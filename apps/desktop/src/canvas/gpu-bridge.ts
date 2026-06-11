import { invoke } from "@tauri-apps/api/core";
import { getSelectionBounds, type SnapGuide } from "@/canvas/geometry";
import { getResizeHandles, getRotationHandle } from "@/canvas/transform-handles";
import type { Camera, DraftShape, SceneNode } from "@/types/document";

export interface CanvasSyncPayload {
  nodes: GpuRenderNode[];
  camera: Camera;
  viewport: { x: number; y: number; width: number; height: number };
  selectedIds: string[];
  draft: DraftShape | null;
  marquee: { x: number; y: number; width: number; height: number } | null;
  snapGuides: SnapGuide[];
  showPixelGrid: boolean;
  showHandles: boolean;
  handles: GpuTransformHandles | null;
  selectionBounds: { x: number; y: number; width: number; height: number } | null;
  windowWidth: number;
  windowHeight: number;
}

type GpuRenderNode =
  | {
      type: "frame";
      id: string;
      name: string;
      visible: boolean;
      locked: boolean;
      sortOrder: number;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      opacity: number;
      fill: string;
      fillGradient?: { start: string; end: string; angle: number };
    }
  | {
      type: "rectangle";
      id: string;
      visible: boolean;
      locked: boolean;
      sortOrder: number;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      opacity: number;
      fill: string;
      fillGradient?: { start: string; end: string; angle: number };
      stroke: string;
      strokeWidth: number;
      cornerRadius: number;
    }
  | {
      type: "ellipse";
      id: string;
      visible: boolean;
      locked: boolean;
      sortOrder: number;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      opacity: number;
      fill: string;
      fillGradient?: { start: string; end: string; angle: number };
      stroke: string;
      strokeWidth: number;
    }
  | {
      type: "line";
      id: string;
      visible: boolean;
      locked: boolean;
      sortOrder: number;
      x: number;
      y: number;
      x2: number;
      y2: number;
      rotation: number;
      opacity: number;
      stroke: string;
      strokeWidth: number;
    }
  | {
      type: "text";
      id: string;
      visible: boolean;
      locked: boolean;
      sortOrder: number;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      opacity: number;
      fill: string;
    };

interface GpuTransformHandles {
  nw: { x: number; y: number };
  n: { x: number; y: number };
  ne: { x: number; y: number };
  e: { x: number; y: number };
  se: { x: number; y: number };
  s: { x: number; y: number };
  sw: { x: number; y: number };
  w: { x: number; y: number };
  rotation?: { x: number; y: number };
}

function toGpuNode(node: SceneNode): GpuRenderNode | null {
  const base = {
    id: node.id,
    visible: node.visible,
    locked: node.locked,
    sortOrder: node.sortOrder,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    opacity: node.opacity,
  };

  switch (node.type) {
    case "frame":
      return {
        type: "frame",
        name: node.name,
        width: node.width,
        height: node.height,
        fill: node.fill,
        fillGradient: node.fillGradient,
        ...base,
      };
    case "rectangle":
      return {
        type: "rectangle",
        width: node.width,
        height: node.height,
        fill: node.fill,
        fillGradient: node.fillGradient,
        stroke: node.stroke,
        strokeWidth: node.strokeWidth,
        cornerRadius: node.cornerRadius,
        ...base,
      };
    case "ellipse":
      return {
        type: "ellipse",
        width: node.width,
        height: node.height,
        fill: node.fill,
        fillGradient: node.fillGradient,
        stroke: node.stroke,
        strokeWidth: node.strokeWidth,
        ...base,
      };
    case "line":
      return {
        type: "line",
        x2: node.x2,
        y2: node.y2,
        stroke: node.stroke,
        strokeWidth: node.strokeWidth,
        ...base,
      };
    case "text":
      return {
        type: "text",
        width: node.width,
        height: node.fontSize * node.lineHeight,
        fill: node.fill,
        ...base,
      };
    default:
      return null;
  }
}

function serializeHandles(nodes: SceneNode[], selectedId: string): GpuTransformHandles | null {
  const selected = nodes.find((node) => node.id === selectedId);
  if (!selected) return null;
  const handles = getResizeHandles(selected);
  if (!handles) return null;
  const byId = Object.fromEntries(handles.map((handle) => [handle.id, { x: handle.x, y: handle.y }]));
  const rotation = getRotationHandle(selected);
  return {
    nw: byId.nw,
    n: byId.n,
    ne: byId.ne,
    e: byId.e,
    se: byId.se,
    s: byId.s,
    sw: byId.sw,
    w: byId.w,
    rotation: rotation ?? undefined,
  };
}

export function buildCanvasSyncPayload(input: {
  nodes: SceneNode[];
  camera: Camera;
  viewportRect: DOMRect;
  selectedIds: string[];
  draft: DraftShape | null;
  marquee: { x: number; y: number; width: number; height: number } | null;
  snapGuides: SnapGuide[];
  showPixelGrid: boolean;
  showHandles: boolean;
}): CanvasSyncPayload {
  const gpuNodes = input.nodes
    .map(toGpuNode)
    .filter((node): node is GpuRenderNode => node !== null);

  const selectedId = input.selectedIds.length === 1 ? input.selectedIds[0] : null;
  const handles = selectedId && input.showHandles ? serializeHandles(input.nodes, selectedId) : null;
  const selectionBounds = getSelectionBounds(
    Object.fromEntries(input.nodes.map((node) => [node.id, node])),
    input.selectedIds,
  );

  return {
    nodes: gpuNodes,
    camera: input.camera,
    viewport: {
      x: input.viewportRect.x,
      y: input.viewportRect.y,
      width: input.viewportRect.width,
      height: input.viewportRect.height,
    },
    selectedIds: input.selectedIds,
    draft: input.draft,
    marquee: input.marquee,
    snapGuides: input.snapGuides,
    showPixelGrid: input.showPixelGrid,
    showHandles: input.showHandles,
    handles,
    selectionBounds,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  };
}

export async function syncGpuCanvas(payload: CanvasSyncPayload): Promise<void> {
  await invoke("canvas_sync", { payload });
}

export async function gpuHitTest(screenX: number, screenY: number): Promise<string | null> {
  return invoke<string | null>("canvas_hit_test", { x: screenX, y: screenY });
}

export async function gpuRendererInfo(): Promise<{ renderer: string; tileSize: number }> {
  return invoke("canvas_renderer_info");
}
