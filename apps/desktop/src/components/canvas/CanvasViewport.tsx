import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adjustLineEndpoint, computeLineConnection } from "@/canvas/lines";
import { onImageCacheUpdate } from "@/canvas/image-cache";
import { renderScene } from "@/canvas/renderer";
import { getResolvedDrawableNodes } from "@/canvas/resolve-document";
import {
  collectSnapTargets,
  flattenDrawableNodes,
  getNodeBounds,
  getSelectionBounds,
  hitTestNodes,
  measureTextWidth,
  screenToWorld,
  snap,
  snapBounds,
  worldToScreen,
  type SnapGuide,
} from "@/canvas/geometry";
import { clonePathPoints, normalizeVectorNode } from "@/canvas/vector-path";
import {
  applyResize,
  getResizeHandles,
  hitTestHandle,
  hitTestLineEndpoint,
  hitTestRotationHandle,
  pointerAngle,
  rotationFromDelta,
  type HandleId,
} from "@/canvas/transform-handles";
import {
  clearHandles,
  nearFirstPoint,
  setHandlesFromDrag,
  type PenDraft,
} from "@/canvas/vector-path";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { getFramePreset } from "@/constants/frame-presets";
import { readImageFromFile, fitImageDisplaySize } from "@/lib/image-io";
import { runPaste } from "@/lib/paste";
import { useDocumentStore } from "@/stores/document-store";
import { useFileStore } from "@/stores/file-store";
import { useUiStore } from "@/stores/ui-store";
import type { DraftShape, LineNode, PathPoint } from "@/types/document";
import { FONT_FAMILIES } from "@/types/document";
import type { ToolId } from "@/stores/ui-store.types";

type DragMode = "none" | "pan" | "move" | "create" | "marquee" | "resize" | "rotate" | "line-endpoint" | "pen-handle";

interface DragState {
  mode: DragMode;
  pending: boolean;
  startScreen: { x: number; y: number };
  startWorld: { x: number; y: number };
  lastWorld: { x: number; y: number };
  createKind?: DraftShape["kind"];
  resizeHandle?: HandleId;
  resizeNodeId?: string;
  resizeStartBounds?: { x: number; y: number; width: number; height: number };
  resizeStartPoints?: PathPoint[];
  rotateNodeId?: string;
  rotateCenter?: { x: number; y: number };
  rotateStartRotation?: number;
  rotateStartAngle?: number;
  lineEndpoint?: "start" | "end";
  lineNodeId?: string;
  historyRecorded?: boolean;
  moveStartBounds?: { x: number; y: number; width: number; height: number } | null;
  moveAppliedDx?: number;
  moveAppliedDy?: number;
  penHandleIndex?: number;
}

const CREATE_TOOLS: Record<string, DraftShape["kind"]> = {
  frame: "frame",
  rectangle: "rectangle",
  ellipse: "ellipse",
  triangle: "triangle",
  polygon: "polygon",
  star: "star",
  line: "line",
};

const DRAG_THRESHOLD = 4;

function toolCursor(tool: ToolId, isPanning: boolean, penActive: boolean): string {
  if (isPanning) return "grabbing";
  if (tool === "hand") return "grab";
  if (tool === "text") return "text";
  if (tool === "pen") return penActive ? "crosshair" : "crosshair";
  if (CREATE_TOOLS[tool]) return "crosshair";
  if (tool === "scale") return "nwse-resize";
  return "default";
}

function screenDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function syncPanning(spaceHeld: boolean, dragMode: DragMode) {
  return spaceHeld || dragMode === "pan";
}

export function CanvasViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasSizeRef = useRef({ width: 0, height: 0, dpr: 0 });
  const paintFrameRef = useRef<number | null>(null);
  const paintRef = useRef<() => void>(() => {});
  const dragRef = useRef<DragState>({
    mode: "none",
    pending: false,
    startScreen: { x: 0, y: 0 },
    startWorld: { x: 0, y: 0 },
    lastWorld: { x: 0, y: 0 },
  });
  const spaceRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const [textEdit, setTextEdit] = useState<{
    id: string;
    value: string;
    x: number;
    y: number;
    fontSize: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [penDraft, setPenDraft] = useState<PenDraft | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const activeTool = useUiStore((s) => s.activeTool);
  const framePresetId = useUiStore((s) => s.framePresetId);
  const showPixelGrid = useUiStore((s) => s.showPixelGrid);
  const snapEnabled = useUiStore((s) => s.snapEnabled);

  const snapCoord = useCallback((value: number) => (snapEnabled ? snap(value) : value), [snapEnabled]);

  const nodes = useDocumentStore((s) => s.nodes);
  const colorStyles = useDocumentStore((s) => s.colorStyles);
  const textStyles = useDocumentStore((s) => s.textStyles);
  const components = useDocumentStore((s) => s.components);
  const selectedIds = useDocumentStore((s) => s.selectedIds);
  const camera = useDocumentStore((s) => s.camera);
  const draft = useDocumentStore((s) => s.draft);
  const marquee = useDocumentStore((s) => s.marquee);
  const setCamera = useDocumentStore((s) => s.setCamera);
  const setDraft = useDocumentStore((s) => s.setDraft);
  const setMarquee = useDocumentStore((s) => s.setMarquee);
  const selectNode = useDocumentStore((s) => s.selectNode);
  const setSelectedIds = useDocumentStore((s) => s.setSelectedIds);
  const selectNodesInRect = useDocumentStore((s) => s.selectNodesInRect);
  const clearSelection = useDocumentStore((s) => s.clearSelection);
  const createShape = useDocumentStore((s) => s.createShape);
  const createVectorFromPath = useDocumentStore((s) => s.createVectorFromPath);
  const createFramePreset = useDocumentStore((s) => s.createFramePreset);
  const insertImage = useDocumentStore((s) => s.insertImage);
  const moveSelected = useDocumentStore((s) => s.moveSelected);
  const addNode = useDocumentStore((s) => s.addNode);
  const updateNode = useDocumentStore((s) => s.updateNode);
  const getRootPage = useDocumentStore((s) => s.getRootPage);
  const recordHistory = useDocumentStore((s) => s.recordHistory);
  const duplicateSelected = useDocumentStore((s) => s.duplicateSelected);
  const copySelected = useDocumentStore((s) => s.copySelected);
  const deleteSelected = useDocumentStore((s) => s.deleteSelected);
  const markDirty = useFileStore((s) => s.markDirty);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const nodeCount = useDocumentStore((s) => Object.values(s.nodes).filter((n) => n.type === "text").length);

  const drawableNodes = useMemo(
    () => getResolvedDrawableNodes(nodes, { colorStyles, textStyles, components }, activePageId),
    [nodes, colorStyles, textStyles, components, activePageId],
  );
  const sceneNodes = useMemo(() => Object.values(nodes), [nodes]);
  const selectionRenderNodes = useMemo(() => {
    const resolvedById = new Map(drawableNodes.map((node) => [node.id, node]));
    return sceneNodes.map((node) => (node.type === "line" ? resolvedById.get(node.id) ?? node : node));
  }, [drawableNodes, sceneNodes]);
  const selectableNodes = useMemo(() => flattenDrawableNodes(nodes, activePageId), [nodes, activePageId]);
  const connectableNodes = useMemo(
    () => selectableNodes.filter((node) => node.type !== "line" && node.type !== "text"),
    [selectableNodes],
  );

  const lineConnectionDraft = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }) =>
      computeLineConnection(start, end, nodes, connectableNodes),
    [connectableNodes, nodes],
  );

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.floor(rect.width * dpr);
    const pixelHeight = Math.floor(rect.height * dpr);
    const size = canvasSizeRef.current;
    if (size.width !== pixelWidth || size.height !== pixelHeight || size.dpr !== dpr) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvasSizeRef.current = { width: pixelWidth, height: pixelHeight, dpr };
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderScene(
      ctx,
      rect.width,
      rect.height,
      camera,
      textEdit ? drawableNodes.filter((node) => node.id !== textEdit.id) : drawableNodes,
      selectedIds,
      draft,
      showPixelGrid,
      marquee,
      activeTool === "move" || activeTool === "scale",
      snapGuides,
      selectionRenderNodes,
      penDraft,
    );
  }, [activeTool, camera, draft, drawableNodes, marquee, penDraft, selectionRenderNodes, selectedIds, showPixelGrid, snapGuides, textEdit]);

  paintRef.current = paint;

  const schedulePaint = useCallback(() => {
    if (paintFrameRef.current !== null) return;
    paintFrameRef.current = window.requestAnimationFrame(() => {
      paintFrameRef.current = null;
      paintRef.current();
    });
  }, []);

  useEffect(() => {
    schedulePaint();
  }, [paint, schedulePaint]);

  useEffect(() => {
    return onImageCacheUpdate(schedulePaint);
  }, [schedulePaint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => schedulePaint());
    observer.observe(container);
    return () => {
      observer.disconnect();
      if (paintFrameRef.current !== null) {
        window.cancelAnimationFrame(paintFrameRef.current);
        paintFrameRef.current = null;
      }
    };
  }, [schedulePaint]);

  useEffect(() => {
    const resetSpace = () => {
      spaceRef.current = false;
      setIsPanning(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !(event.target instanceof HTMLInputElement)) {
        spaceRef.current = true;
        setIsPanning(true);
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spaceRef.current = false;
        setIsPanning(dragRef.current.mode === "pan");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", resetSpace);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", resetSpace);
    };
  }, []);

  const markDocumentDirty = () => markDirty();

  useEffect(() => {
    if (activeTool !== "pen") {
      setPenDraft(null);
    }
  }, [activeTool]);

  const finishPenPath = useCallback(
    (closed: boolean) => {
      if (!penDraft || penDraft.points.length < 2) {
        setPenDraft(null);
        return;
      }
      recordHistory();
      markDocumentDirty();
      const id = createVectorFromPath(penDraft.points, closed);
      if (id) selectNode(id);
      setPenDraft(null);
    },
    [createVectorFromPath, penDraft, recordHistory, selectNode],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeTool !== "pen" || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        finishPenPath(false);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setPenDraft(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTool, finishPenPath]);

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startTextEdit = (node: { id: string; text: string; x: number; y: number; fontSize: number }) => {
    selectNode(node.id);
    setTextEdit({
      id: node.id,
      value: node.text,
      x: node.x,
      y: node.y,
      fontSize: node.fontSize,
    });
    requestAnimationFrame(() => {
      const input = textInputRef.current;
      if (!input) return;
      input.focus();
      input.select();
    });
  };

  const addTextNode = (world: { x: number; y: number }) => {
    const page = getRootPage();
    if (!page) return;

    const selectedFrame = selectedIds
      .map((id) => nodes[id])
      .find((node) => node?.type === "frame");
    const parentId = selectedFrame?.id ?? page.id;

    recordHistory();
    markDocumentDirty();
    const fontSize = 32;
    const id = `text-${crypto.randomUUID().slice(0, 8)}`;
    const index = nodeCount + 1;
    const x = snapCoord(world.x);
    const y = snapCoord(world.y);

    addNode({
      id,
      name: `Text ${index}`,
      type: "text",
      parentId,
      visible: true,
      locked: false,
      sortOrder: Object.values(nodes).filter((n) => n.parentId === parentId).length,
      x,
      y,
      rotation: 0,
      opacity: 1,
      text: "",
      fontSize,
      fontFamily: FONT_FAMILIES[0],
      fontWeight: 400,
      textAlign: "left",
      lineHeight: 1.2,
      fill: "#000000",
      width: measureTextWidth("", fontSize),
    });
    startTextEdit({ id, text: "", x, y, fontSize });
  };

  const shouldPan = (event: React.PointerEvent<HTMLCanvasElement>) =>
    activeTool === "hand" || spaceRef.current || event.button === 1;

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (textEdit) {
      finishTextEdit(textEdit.value);
    }

    const screen = getCanvasPoint(event);
    const world = screenToWorld(screen, camera);

    if (activeTool !== "text") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setContextMenu(null);

    if (shouldPan(event)) {
      dragRef.current = {
        mode: "pan",
        pending: true,
        startScreen: screen,
        startWorld: world,
        lastWorld: world,
      };
      setIsPanning(true);
      return;
    }

    if (activeTool === "text") {
      const hit = hitTestNodes(selectableNodes, world);
      if (hit?.type === "text" && !hit.locked) {
        startTextEdit(hit);
        return;
      }
      addTextNode(world);
      return;
    }

    if (activeTool === "frame") {
      const preset = getFramePreset(framePresetId);
      if (preset.id !== "custom") {
        recordHistory();
        markDocumentDirty();
        const id = createFramePreset(world, preset);
        if (id) selectNode(id);
        return;
      }
    }

    if (activeTool === "pen") {
      const anchor = { x: snapCoord(world.x), y: snapCoord(world.y) };
      const closeThreshold = 10 / camera.zoom;

      if (penDraft && nearFirstPoint(penDraft.points, anchor, closeThreshold)) {
        finishPenPath(true);
        return;
      }

      const nextPoints = [...(penDraft?.points ?? []), anchor];
      const pointIndex = nextPoints.length - 1;
      setPenDraft({ points: nextPoints, preview: anchor });
      dragRef.current = {
        mode: "pen-handle",
        pending: false,
        startScreen: screen,
        startWorld: world,
        lastWorld: world,
        penHandleIndex: pointIndex,
      };
      return;
    }

    const createKind = CREATE_TOOLS[activeTool];
    if (createKind) {
      recordHistory();
      markDocumentDirty();
      dragRef.current = {
        mode: "create",
        pending: false,
        startScreen: screen,
        startWorld: world,
        lastWorld: world,
        createKind,
        historyRecorded: true,
      };
      setDraft({
        kind: createKind,
        x: snapCoord(world.x),
        y: snapCoord(world.y),
        width: 0,
        height: 0,
        x2: createKind === "line" ? snapCoord(world.x) : undefined,
        y2: createKind === "line" ? snapCoord(world.y) : undefined,
      });
      return;
    }

    if ((activeTool === "move" || activeTool === "scale") && selectedIds.length === 1) {
      const selected = nodes[selectedIds[0]];
      if (selected?.type === "line" && !selected.locked) {
        const resolved = selectionRenderNodes.find((node) => node.id === selected.id);
        const line = (resolved?.type === "line" ? resolved : selected) as LineNode;
        const endpoint = hitTestLineEndpoint(line, world, camera.zoom);
        if (endpoint) {
          recordHistory();
          markDocumentDirty();
          dragRef.current = {
            mode: "line-endpoint",
            pending: false,
            startScreen: screen,
            startWorld: world,
            lastWorld: world,
            lineEndpoint: endpoint,
            lineNodeId: selected.id,
            historyRecorded: true,
          };
          return;
        }
      }

      if (selected && !selected.locked && hitTestRotationHandle(selected, world, camera.zoom)) {
        const bounds = getNodeBounds(selected);
        if (bounds) {
          recordHistory();
          markDocumentDirty();
          dragRef.current = {
            mode: "rotate",
            pending: false,
            startScreen: screen,
            startWorld: world,
            lastWorld: world,
            rotateNodeId: selected.id,
            rotateCenter: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
            rotateStartRotation: selected.rotation,
            rotateStartAngle: pointerAngle(
              { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
              world,
            ),
            historyRecorded: true,
          };
          return;
        }
      }

      const handles = selected && !selected.locked ? getResizeHandles(selected) : null;
      if (handles) {
        const handle = hitTestHandle(handles, world, camera.zoom);
        if (handle) {
          let resizeTarget = selected!;
          let startBounds = getNodeBounds(resizeTarget);
          let startPoints: PathPoint[] | undefined;

          if (resizeTarget.type === "vector") {
            const normalized = normalizeVectorNode(resizeTarget);
            const needsNormalize =
              Math.abs(normalized.x - resizeTarget.x) > 0.01 ||
              Math.abs(normalized.y - resizeTarget.y) > 0.01 ||
              Math.abs(normalized.width - resizeTarget.width) > 0.01 ||
              Math.abs(normalized.height - resizeTarget.height) > 0.01;
            if (needsNormalize) {
              updateNode(resizeTarget.id, normalized);
            }
            resizeTarget = normalized;
            startBounds = getNodeBounds(normalized);
            startPoints = clonePathPoints(normalized.points);
          }

          if (startBounds) {
            recordHistory();
            markDocumentDirty();
            dragRef.current = {
              mode: "resize",
              pending: false,
              startScreen: screen,
              startWorld: world,
              lastWorld: world,
              resizeHandle: handle,
              resizeNodeId: resizeTarget.id,
              resizeStartBounds: startBounds,
              resizeStartPoints: startPoints,
              historyRecorded: true,
            };
            return;
          }
        }
      }
    }

    const hit = hitTestNodes(selectableNodes, world);
    if (hit?.type === "text" && !hit.locked && event.detail >= 2 && activeTool === "move") {
      startTextEdit(hit);
      return;
    }

    if (hit?.type === "line" && !hit.locked && (activeTool === "move" || activeTool === "scale")) {
      const resolved = selectionRenderNodes.find((node) => node.id === hit.id);
      const line = (resolved?.type === "line" ? resolved : hit) as LineNode;
      const endpoint = hitTestLineEndpoint(line, world, camera.zoom);
      if (endpoint) {
        selectNode(hit.id);
        recordHistory();
        markDocumentDirty();
        dragRef.current = {
          mode: "line-endpoint",
          pending: false,
          startScreen: screen,
          startWorld: world,
          lastWorld: world,
          lineEndpoint: endpoint,
          lineNodeId: hit.id,
          historyRecorded: true,
        };
        return;
      }
    }

    if (hit && (activeTool === "move" || activeTool === "scale")) {
      if (event.shiftKey) {
        selectNode(hit.id, true);
      } else if (!selectedIds.includes(hit.id)) {
        selectNode(hit.id, false);
      }

      const { nodes: currentNodes, selectedIds: currentSelectedIds } = useDocumentStore.getState();
      markDocumentDirty();
      dragRef.current = {
        mode: "move",
        pending: true,
        startScreen: screen,
        startWorld: world,
        lastWorld: world,
        moveStartBounds: getSelectionBounds(currentNodes, currentSelectedIds),
        moveAppliedDx: 0,
        moveAppliedDy: 0,
        historyRecorded: false,
      };
      return;
    }

    if (activeTool === "move" || activeTool === "scale") {
      if (!event.shiftKey) clearSelection();
      dragRef.current = {
        mode: "marquee",
        pending: true,
        startScreen: screen,
        startWorld: world,
        lastWorld: world,
      };
      return;
    }

    clearSelection();
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const screen = getCanvasPoint(event);
    const world = screenToWorld(screen, camera);

    if (activeTool === "pen" && drag.mode === "none" && penDraft) {
      setPenDraft((current) =>
        current ? { ...current, preview: { x: snapCoord(world.x), y: snapCoord(world.y) } } : null,
      );
      return;
    }

    if (drag.mode === "none") return;

    if (drag.pending && screenDistance(screen, drag.startScreen) < DRAG_THRESHOLD) {
      return;
    }

    if (drag.pending) {
      dragRef.current.pending = false;
      if (drag.mode === "marquee") {
        setMarquee({ x: drag.startWorld.x, y: drag.startWorld.y, width: 0, height: 0 });
      }
    }

    if (drag.mode === "pan") {
      setCamera({
        x: camera.x + (screen.x - drag.startScreen.x),
        y: camera.y + (screen.y - drag.startScreen.y),
      });
      dragRef.current.startScreen = screen;
      return;
    }

    if (drag.mode === "move") {
      if (!drag.moveStartBounds) return;

      const totalDx = world.x - drag.startWorld.x;
      const totalDy = world.y - drag.startWorld.y;
      const { selectedIds: currentSelectedIds } = useDocumentStore.getState();
      const exclude = new Set(currentSelectedIds);
      const targets = collectSnapTargets(drawableNodes, exclude);
      const snapped = snapEnabled
        ? snapBounds(drag.moveStartBounds, totalDx, totalDy, targets, 8 / camera.zoom)
        : { dx: totalDx, dy: totalDy, guides: [] as SnapGuide[] };
      setSnapGuides(snapped.guides);

      const appliedDx = snapped.dx;
      const appliedDy = snapped.dy;
      const deltaDx = appliedDx - (drag.moveAppliedDx ?? 0);
      const deltaDy = appliedDy - (drag.moveAppliedDy ?? 0);

      if (deltaDx !== 0 || deltaDy !== 0) {
        if (!drag.historyRecorded) {
          recordHistory();
          dragRef.current.historyRecorded = true;
        }
        moveSelected(deltaDx, deltaDy);
        dragRef.current.moveAppliedDx = appliedDx;
        dragRef.current.moveAppliedDy = appliedDy;
      }
      return;
    }

    if (drag.mode === "pen-handle" && drag.penHandleIndex !== undefined) {
      const handleWorld = { x: snapCoord(world.x), y: snapCoord(world.y) };
      setPenDraft((current) => {
        if (!current) return null;
        const points = [...current.points];
        points[drag.penHandleIndex!] = setHandlesFromDrag(points[drag.penHandleIndex!], handleWorld);
        return { ...current, points, preview: handleWorld };
      });
      return;
    }

    if (drag.mode === "line-endpoint" && drag.lineNodeId && drag.lineEndpoint) {
      const line = nodes[drag.lineNodeId];
      if (line?.type === "line") {
        const patch = adjustLineEndpoint(
          line,
          drag.lineEndpoint,
          { x: snapCoord(world.x), y: snapCoord(world.y) },
          nodes,
          connectableNodes,
        );
        updateNode(drag.lineNodeId, patch);
      }
      return;
    }

    if (drag.mode === "rotate" && drag.rotateNodeId && drag.rotateCenter && drag.rotateStartAngle !== undefined) {
      const startRotation = drag.rotateStartRotation ?? 0;
      const rotation = rotationFromDelta(
        startRotation,
        drag.rotateStartAngle,
        pointerAngle(drag.rotateCenter, world),
        event.shiftKey ? 15 : undefined,
      );
      updateNode(drag.rotateNodeId, { rotation });
      return;
    }

    if (drag.mode === "resize" && drag.resizeHandle && drag.resizeNodeId && drag.resizeStartBounds) {
      const node = nodes[drag.resizeNodeId];
      if (!node) return;
      const patch = applyResize(
        node,
        drag.resizeHandle,
        drag.resizeStartBounds,
        world,
        event.shiftKey,
        drag.resizeStartPoints,
      );
      if (patch) updateNode(drag.resizeNodeId, patch);
      return;
    }

    if (drag.mode === "marquee") {
      setMarquee({
        x: drag.startWorld.x,
        y: drag.startWorld.y,
        width: world.x - drag.startWorld.x,
        height: world.y - drag.startWorld.y,
      });
      return;
    }

    if (drag.mode === "create" && drag.createKind) {
      const constrain = event.shiftKey;
      let width = world.x - drag.startWorld.x;
      let height = world.y - drag.startWorld.y;

      if (constrain && drag.createKind !== "line") {
        const size = Math.max(Math.abs(width), Math.abs(height));
        width = Math.sign(width || 1) * size;
        height = Math.sign(height || 1) * size;
      }

      if (drag.createKind === "line") {
        const start = { x: snapCoord(drag.startWorld.x), y: snapCoord(drag.startWorld.y) };
        const end = { x: snapCoord(world.x), y: snapCoord(world.y) };
        const connection = lineConnectionDraft(start, end);
        setDraft({
          kind: "line",
          x: connection.x,
          y: connection.y,
          width: 0,
          height: 0,
          x2: connection.x2,
          y2: connection.y2,
        });
      } else {
        setDraft({
          kind: drag.createKind,
          x: snapCoord(drag.startWorld.x),
          y: snapCoord(drag.startWorld.y),
          width: snapCoord(width),
          height: snapCoord(height),
        });
      }
    }
  };

  const resetDrag = () => {
    dragRef.current = {
      mode: "none",
      pending: false,
      startScreen: { x: 0, y: 0 },
      startWorld: { x: 0, y: 0 },
      lastWorld: { x: 0, y: 0 },
    };
    setSnapGuides([]);
    setIsPanning(syncPanning(spaceRef.current, "none"));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const movedEnough = screenDistance(getCanvasPoint(event), drag.startScreen) >= DRAG_THRESHOLD;

    if (drag.mode === "pen-handle" && drag.penHandleIndex !== undefined) {
      if (!movedEnough) {
        setPenDraft((current) => {
          if (!current) return null;
          const points = [...current.points];
          points[drag.penHandleIndex!] = clearHandles(points[drag.penHandleIndex!]);
          return { ...current, points };
        });
      }
      dragRef.current = {
        mode: "none",
        pending: false,
        startScreen: { x: 0, y: 0 },
        startWorld: { x: 0, y: 0 },
        lastWorld: { x: 0, y: 0 },
      };
      return;
    }

    if (drag.mode === "create" && drag.createKind && !drag.pending) {
      if (!drag.historyRecorded) {
        recordHistory();
        markDocumentDirty();
      }
      const screen = getCanvasPoint(event);
      const world = screenToWorld(screen, camera);

      if (drag.createKind === "line") {
        const start = { x: snapCoord(drag.startWorld.x), y: snapCoord(drag.startWorld.y) };
        const end = { x: snapCoord(world.x), y: snapCoord(world.y) };
        const connection = lineConnectionDraft(start, end);
        const id = createShape("line", {
          x: connection.x,
          y: connection.y,
          width: 0,
          height: 0,
          x2: connection.x2,
          y2: connection.y2,
          startAnchor: connection.startAnchor,
          endAnchor: connection.endAnchor,
        });
        if (id) selectNode(id);
      } else {
        let width = world.x - drag.startWorld.x;
        let height = world.y - drag.startWorld.y;
        if (event.shiftKey) {
          const size = Math.max(Math.abs(width), Math.abs(height));
          width = Math.sign(width || 1) * size;
          height = Math.sign(height || 1) * size;
        }
        const id = createShape(drag.createKind, {
          x: snapCoord(drag.startWorld.x),
          y: snapCoord(drag.startWorld.y),
          width: snapCoord(width),
          height: snapCoord(height),
        });
        if (id) selectNode(id);
      }
      setDraft(null);
      markDocumentDirty();
    }

    if (drag.mode === "move" && drag.pending && !movedEnough) {
      // click without drag — selection already updated on pointer down
    }

    if (drag.mode === "marquee" && marquee && movedEnough) {
      if (Math.abs(marquee.width) > 4 || Math.abs(marquee.height) > 4) {
        selectNodesInRect(marquee, event.shiftKey);
      }
      setMarquee(null);
    } else if (drag.mode === "marquee") {
      setMarquee(null);
    }

    if ((drag.mode === "move" || drag.mode === "resize") && movedEnough) {
      markDocumentDirty();
    }

    resetDrag();
  };

  const onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const screen = getCanvasPoint(event as unknown as React.PointerEvent<HTMLCanvasElement>);
      const worldBefore = screenToWorld(screen, camera);
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
      const nextZoom = Math.min(8, Math.max(0.1, camera.zoom * factor));
      const worldAfter = screenToWorld(screen, { ...camera, zoom: nextZoom });
      setCamera({
        zoom: nextZoom,
        x: camera.x + (worldAfter.x - worldBefore.x) * nextZoom,
        y: camera.y + (worldAfter.y - worldBefore.y) * nextZoom,
      });
      return;
    }

    setCamera({
      x: camera.x - event.deltaX,
      y: camera.y - event.deltaY,
    });
  };

  const viewportCenterWorld = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, camera);
  }, [camera]);

  const insertImageAt = useCallback(
    async (file: File, world?: { x: number; y: number }) => {
      if (!file.type.startsWith("image/")) return false;
      try {
        const image = await readImageFromFile(file);
        const { width, height } = fitImageDisplaySize(image.naturalWidth, image.naturalHeight);
        const position = world
          ? { x: world.x - width / 2, y: world.y - height / 2 }
          : undefined;
        const id = insertImage(image.src, image.naturalWidth, image.naturalHeight, position, image.name);
        if (id) {
          markDirty();
          return true;
        }
      } catch {
        // Ignore invalid image files.
      }
      return false;
    },
    [insertImage, markDirty],
  );

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes("Files")) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const world = screenToWorld(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      camera,
    );
    void insertImageAt(file, world);
  };

  const onPaste = (event: React.ClipboardEvent) => {
    const file = event.clipboardData.files[0];
    if (!file?.type.startsWith("image/")) return;
    event.preventDefault();
    void insertImageAt(file, viewportCenterWorld());
  };

  const onContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const hasSelection = selectedIds.length > 0;
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: "Copy",
          shortcut: "⌘C",
          disabled: !hasSelection,
          onClick: () => {
            copySelected();
          },
        },
        {
          label: "Paste",
          shortcut: "⌘V",
          onClick: () => {
            void runPaste(viewportCenterWorld()).then((pasted) => {
              if (pasted) markDocumentDirty();
            });
          },
        },
        {
          label: "Duplicate",
          shortcut: "⌘D",
          disabled: !hasSelection,
          onClick: () => {
            duplicateSelected();
            markDocumentDirty();
          },
        },
        {
          label: "Delete",
          disabled: !hasSelection,
          onClick: () => {
            deleteSelected();
            markDocumentDirty();
          },
        },
      ],
    });
  };

  const finishTextEdit = (value: string) => {
    if (!textEdit) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setSelectedIds([textEdit.id]);
      deleteSelected();
      markDocumentDirty();
      setTextEdit(null);
      return;
    }
    recordHistory();
    markDocumentDirty();
    updateNode(textEdit.id, {
      text: trimmed,
      name: trimmed.slice(0, 24),
      width: measureTextWidth(trimmed, textEdit.fontSize),
    });
    setTextEdit(null);
  };

  const cancelTextEdit = () => {
    if (!textEdit) return;
    if (!textEdit.value.trim()) {
      setSelectedIds([textEdit.id]);
      deleteSelected();
      markDocumentDirty();
    }
    setTextEdit(null);
  };

  const commitLiveText = (value: string) => {
    if (!textEdit) return;
    setTextEdit((current) => (current ? { ...current, value } : current));
    updateNode(textEdit.id, {
      text: value,
      width: measureTextWidth(value, textEdit.fontSize),
    });
  };

  const editingTextNode = textEdit ? nodes[textEdit.id] : null;
  const editingTextFill =
    editingTextNode?.type === "text" ? editingTextNode.fill : "#000000";
  const editingTextFont =
    editingTextNode?.type === "text" ? editingTextNode.fontFamily : FONT_FAMILIES[0];
  const editingTextWidth = Math.max(
    measureTextWidth(textEdit?.value ?? "", textEdit?.fontSize ?? 32) * camera.zoom,
    2,
  );

  return (
    <div
      ref={containerRef}
      data-canvas-viewport
      className="relative min-h-0 flex-1 bg-canvas"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onPaste={onPaste}
      tabIndex={-1}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ cursor: toolCursor(activeTool, isPanning, !!penDraft) }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onContextMenu={onContextMenu}
      />

      {textEdit && (
        <textarea
          ref={textInputRef}
          value={textEdit.value}
          rows={1}
          spellCheck={false}
          className="absolute z-20 resize-none overflow-hidden border-0 bg-transparent p-0 outline-none"
          style={{
            left: worldToScreen({ x: textEdit.x, y: textEdit.y }, camera).x,
            top: worldToScreen({ x: textEdit.x, y: textEdit.y }, camera).y,
            width: editingTextWidth,
            minWidth: 2,
            fontSize: textEdit.fontSize * camera.zoom,
            lineHeight: 1.2,
            fontFamily: editingTextFont,
            color: editingTextFill,
            caretColor: editingTextFill,
          }}
          onChange={(event) => commitLiveText(event.target.value)}
          onBlur={(event) => finishTextEdit(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              finishTextEdit(event.currentTarget.value);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              cancelTextEdit();
            }
          }}
        />
      )}

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
}
