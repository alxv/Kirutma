import { create } from "zustand";
import { collectSubtree, getResolvedDrawableNodes, syncComponentFromMaster } from "@/canvas/resolve-document";
import { getNodeBounds, pruneContainerSelection } from "@/canvas/geometry";
import {
  absoluteToLocalPoints,
  normalizeVectorNode,
  pathGeometryBounds,
  scaleVectorPointsFromAnchor,
  translatePathPoints,
} from "@/canvas/vector-path";
import { SYMBOL_BY_ID } from "@/constants/symbol-library";
import { fitImageDisplaySize } from "@/lib/image-io";
import { writeNodesToClipboard } from "@/lib/clipboard-nodes";
import {
  boundsOfPathPoints,
  svgPathToPathPoints,
  transformPathPoints,
} from "@/lib/svg-path-import";
import { cloneSnapshot, type DocumentSnapshot } from "@/stores/document-history";
import type { ColorStyle, ComponentDefinition, TextStyle } from "@/types/design-system";
import { defaultDesignSystem } from "@/types/design-system";
import type {
  Camera,
  DraftShape,
  InstanceNode,
  PageNode,
  PathPoint,
  SceneNode,
  SceneNodeType,
  ShapeNode,
} from "@/types/document";
import { nodeLabel, normalizeNodes } from "@/types/document";

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function countType(nodes: Record<string, SceneNode>, type: SceneNodeType): number {
  return Object.values(nodes).filter((node) => node.type === type).length;
}

function nextSortOrder(nodes: Record<string, SceneNode>, parentId: string): number {
  const siblings = Object.values(nodes).filter((node) => node.parentId === parentId);
  if (siblings.length === 0) return 0;
  return Math.max(...siblings.map((node) => node.sortOrder ?? 0)) + 1;
}

function defaultPageFrame(pageId: string, frameId: string): Record<string, SceneNode> {
  return {
    [frameId]: {
      id: frameId,
      name: "Desktop",
      type: "frame",
      parentId: pageId,
      visible: true,
      locked: false,
      sortOrder: 1,
      x: 120,
      y: 80,
      rotation: 0,
      opacity: 1,
      width: 1440,
      height: 900,
      fill: "#FFFFFF",
    },
  };
}

function defaultDocument(): Record<string, SceneNode> {
  const pageId = "page-1";
  const frameId = "frame-1";
  return {
    [pageId]: {
      id: pageId,
      name: "Page 1",
      type: "page",
      parentId: null,
      visible: true,
      locked: false,
      sortOrder: 0,
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
    },
    ...defaultPageFrame(pageId, frameId),
  };
}

function resolveActivePageId(nodes: Record<string, SceneNode>, activePageId: string | null): string {
  if (activePageId && nodes[activePageId]?.type === "page") return activePageId;
  return (
    Object.values(nodes)
      .filter((node) => node.type === "page")
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.id ?? "page-1"
  );
}

export function selectPages(nodes: Record<string, SceneNode>): PageNode[] {
  return Object.values(nodes)
    .filter((node): node is PageNode => node.type === "page")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export type AlignMode = "left" | "center-h" | "right" | "top" | "center-v" | "bottom";

export interface DocumentState {
  nodes: Record<string, SceneNode>;
  activePageId: string;
  colorStyles: Record<string, ColorStyle>;
  textStyles: Record<string, TextStyle>;
  components: Record<string, ComponentDefinition>;
  selectedIds: string[];
  camera: Camera;
  draft: DraftShape | null;
  marquee: { x: number; y: number; width: number; height: number } | null;
  clipboard: SceneNode[];
  past: DocumentSnapshot[];
  future: DocumentSnapshot[];
  recordHistory: () => void;
  undo: () => void;
  redo: () => void;
  setCamera: (partial: Partial<Camera>) => void;
  setSelectedIds: (ids: string[]) => void;
  selectNode: (id: string, additive?: boolean) => void;
  selectNodesInRect: (
    rect: { x: number; y: number; width: number; height: number },
    additive?: boolean,
  ) => void;
  clearSelection: () => void;
  setDraft: (draft: DraftShape | null) => void;
  setMarquee: (marquee: DocumentState["marquee"]) => void;
  addNode: (node: SceneNode) => void;
  updateNode: (id: string, patch: Partial<SceneNode>) => void;
  updateNodeWithHistory: (id: string, patch: Partial<SceneNode>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  pasteExternalNodes: (nodes: SceneNode[], center?: { x: number; y: number }) => boolean;
  updateSelectedWithHistory: (patch: Partial<SceneNode>) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  getPages: () => PageNode[];
  setActivePage: (id: string) => void;
  addPage: () => string;
  deletePage: (pageId: string) => boolean;
  moveLayerOrder: (nodeId: string, direction: "forward" | "backward") => void;
  alignSelected: (mode: AlignMode) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  createShape: (
    kind: DraftShape["kind"],
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
      x2?: number;
      y2?: number;
      startAnchor?: string;
      endAnchor?: string;
    },
  ) => string | null;
  createVectorFromPath: (
    points: PathPoint[],
    closed: boolean,
    options?: { name?: string; fill?: string; stroke?: string; strokeWidth?: number },
  ) => string | null;
  insertLibrarySymbol: (symbolId: string, position: { x: number; y: number }, size?: number) => string | null;
  insertImage: (
    src: string,
    naturalWidth: number,
    naturalHeight: number,
    position?: { x: number; y: number },
    name?: string,
  ) => string | null;
  createFramePreset: (
    center: { x: number; y: number },
    preset: { name: string; width: number; height: number },
  ) => string | null;
  reorderNode: (nodeId: string, targetId: string, position: "before" | "after") => void;
  moveSelected: (dx: number, dy: number) => void;
  getChildren: (parentId: string) => SceneNode[];
  getRootPage: () => SceneNode | undefined;
  getSelectedNode: () => ShapeNode | undefined;
  getSelectedNodes: () => ShapeNode[];
  getDrawableNodes: () => SceneNode[];
  exportSelectedNodes: () => SceneNode[];
  resetDocument: () => void;
  loadDocument: (
    nodes: Record<string, SceneNode>,
    camera: Camera,
    design?: Partial<Pick<DocumentState, "colorStyles" | "textStyles" | "components">>,
  ) => void;
  zoomToBounds: (bounds: { x: number; y: number; width: number; height: number }, viewport: { width: number; height: number }, padding?: number) => void;
  createColorStyle: (name: string, color: string) => string;
  updateColorStyle: (id: string, patch: Partial<ColorStyle>) => void;
  deleteColorStyle: (id: string) => void;
  createTextStyle: (name: string) => string;
  updateTextStyle: (id: string, patch: Partial<TextStyle>) => void;
  deleteTextStyle: (id: string) => void;
  applyColorStyleToSelected: (styleId: string) => void;
  applyTextStyleToSelected: (styleId: string) => void;
  createComponentFromSelection: () => string | null;
  createInstance: (componentId: string, position: { x: number; y: number }) => string | null;
  detachInstance: (instanceId: string) => void;
  resetInstanceOverrides: (instanceId: string) => void;
}

function applyColorStyleToNode(node: SceneNode, style: ColorStyle): SceneNode {
  if ("fill" in node) return { ...node, fill: style.color };
  if ("stroke" in node) return { ...node, stroke: style.color };
  return node;
}

function applyTextStyleToNode(node: Extract<SceneNode, { type: "text" }>, style: TextStyle): SceneNode {
  return {
    ...node,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
    fill: style.fill,
  };
}

function findComponentMaster(nodeId: string, nodes: Record<string, SceneNode>): SceneNode | null {
  let current = nodes[nodeId];
  while (current) {
    if (current.componentId) return current;
    if (!current.parentId) return null;
    current = nodes[current.parentId];
  }
  return null;
}

function designSnapshot(state: DocumentState) {
  return {
    colorStyles: state.colorStyles,
    textStyles: state.textStyles,
    components: state.components,
  };
}

function cloneNodes(nodes: SceneNode[]): SceneNode[] {
  return nodes.map((node) => ({
    ...structuredClone(node),
    id: createId(node.type),
    name: `${node.name} copy`,
    x: node.x + 16,
    y: node.y + 16,
    ...(node.type === "line" ? { x2: node.x2 + 16, y2: node.y2 + 16 } : {}),
  }));
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  nodes: defaultDocument(),
  activePageId: "page-1",
  ...defaultDesignSystem(),
  selectedIds: [],
  camera: { x: 0, y: 0, zoom: 1 },
  draft: null,
  marquee: null,
  clipboard: [],
  past: [],
  future: [],

  recordHistory: () =>
    set((state) => ({
      past: [...state.past, cloneSnapshot(state.nodes, state.selectedIds, designSnapshot(state))].slice(-100),
      future: [],
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const current = cloneSnapshot(state.nodes, state.selectedIds, designSnapshot(state));
      const activePageId = resolveActivePageId(previous.nodes, state.activePageId);
      return {
        nodes: previous.nodes,
        selectedIds: previous.selectedIds,
        activePageId,
        colorStyles: previous.colorStyles,
        textStyles: previous.textStyles,
        components: previous.components,
        past: state.past.slice(0, -1),
        future: [current, ...state.future].slice(0, 100),
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const current = cloneSnapshot(state.nodes, state.selectedIds, designSnapshot(state));
      const activePageId = resolveActivePageId(next.nodes, state.activePageId);
      return {
        nodes: next.nodes,
        selectedIds: next.selectedIds,
        activePageId,
        colorStyles: next.colorStyles,
        textStyles: next.textStyles,
        components: next.components,
        past: [...state.past, current].slice(-100),
        future: state.future.slice(1),
      };
    }),

  setCamera: (partial) =>
    set((state) => ({ camera: { ...state.camera, ...partial } })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  selectNode: (id, additive = false) =>
    set((state) => {
      const node = state.nodes[id];
      if (!node || node.type === "page" || node.locked) {
        return additive ? state : { selectedIds: [] };
      }
      let selectedIds: string[];
      if (additive) {
        const exists = state.selectedIds.includes(id);
        selectedIds = exists
          ? state.selectedIds.filter((selectedId) => selectedId !== id)
          : [...state.selectedIds, id];
      } else {
        selectedIds = [id];
      }
      return { selectedIds: pruneContainerSelection(state.nodes, selectedIds) };
    }),

  selectNodesInRect: (rect, additive = false) =>
    set((state) => {
      const x = rect.width < 0 ? rect.x + rect.width : rect.x;
      const y = rect.height < 0 ? rect.y + rect.height : rect.y;
      const w = Math.abs(rect.width);
      const h = Math.abs(rect.height);
      const ids = Object.values(state.nodes)
        .filter((node) => node.type !== "page" && node.visible)
        .filter((node) => {
          const bounds = getNodeBounds(node);
          if (!bounds) return false;
          return (
            bounds.x < x + w &&
            bounds.x + bounds.width > x &&
            bounds.y < y + h &&
            bounds.y + bounds.height > y
          );
        })
        .map((node) => node.id);
      const selectedIds = additive
        ? [...new Set([...state.selectedIds, ...ids])]
        : ids;
      return { selectedIds: pruneContainerSelection(state.nodes, selectedIds) };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  setDraft: (draft) => set({ draft }),
  setMarquee: (marquee) => set({ marquee }),

  addNode: (node) =>
    set((state) => ({
      nodes: { ...state.nodes, [node.id]: node },
    })),

  updateNode: (id, patch) =>
    set((state) => {
      const current = state.nodes[id];
      if (!current) return state;

      let updated = { ...current, ...patch } as SceneNode;

      if (
        current.type === "vector" &&
        ("width" in patch || "height" in patch) &&
        !("points" in patch)
      ) {
        const nextWidth = "width" in patch ? Number(patch.width) : current.width;
        const nextHeight = "height" in patch ? Number(patch.height) : current.height;
        if (
          Number.isFinite(nextWidth) &&
          Number.isFinite(nextHeight) &&
          current.width > 0 &&
          current.height > 0 &&
          (nextWidth !== current.width || nextHeight !== current.height)
        ) {
          const anchor = { x: current.width / 2, y: current.height / 2 };
          const centerX = current.x + anchor.x;
          const centerY = current.y + anchor.y;
          const nextX = centerX - nextWidth / 2;
          const nextY = centerY - nextHeight / 2;
          const scaledPoints = scaleVectorPointsFromAnchor(
            current.points,
            anchor,
            nextWidth / current.width,
            nextHeight / current.height,
          );
          updated = {
            ...updated,
            x: nextX,
            y: nextY,
            width: nextWidth,
            height: nextHeight,
            points: translatePathPoints(scaledPoints, current.x - nextX, current.y - nextY),
          } as SceneNode;
        }
      }

      if (current.type === "instance") {
        const component = state.components[current.componentId];
        const stylePatch: Record<string, unknown> = {};
        if ("fill" in patch && typeof patch.fill === "string") stylePatch.fill = patch.fill;
        if ("stroke" in patch && typeof patch.stroke === "string") stylePatch.stroke = patch.stroke;
        if ("fillGradient" in patch) stylePatch.fillGradient = patch.fillGradient;
        if (Object.keys(stylePatch).length > 0 && component) {
          updated = {
            ...updated,
            overrides: {
              ...current.overrides,
              [component.rootNodeId]: {
                ...(current.overrides[component.rootNodeId] ?? {}),
                ...stylePatch,
              },
            },
          } as InstanceNode;
        }
      }

      if (updated.colorStyleId && state.colorStyles[updated.colorStyleId]) {
        updated = applyColorStyleToNode(updated, state.colorStyles[updated.colorStyleId]);
      }
      if (updated.type === "text" && updated.textStyleId && state.textStyles[updated.textStyleId]) {
        updated = applyTextStyleToNode(updated, state.textStyles[updated.textStyleId]);
      }

      const nextNodes = { ...state.nodes, [id]: updated };
      const master = findComponentMaster(id, nextNodes);
      const nextComponents = master?.componentId
        ? syncComponentFromMaster(master.componentId, nextNodes, state.components)
        : state.components;

      return { nodes: nextNodes, components: nextComponents };
    }),

  updateNodeWithHistory: (id, patch) => {
    get().recordHistory();
    get().updateNode(id, patch);
  },

  deleteSelected: () => {
    get().recordHistory();
    set((state) => {
      const pageId = Object.values(state.nodes).find((node) => node.type === "page")?.id ?? null;
      const nextNodes = { ...state.nodes };
      for (const id of state.selectedIds) {
        delete nextNodes[id];
        for (const [nodeId, node] of Object.entries(nextNodes)) {
          if (node.parentId === id) {
            nextNodes[nodeId] = { ...node, parentId: pageId };
          }
        }
      }
      return { nodes: nextNodes, selectedIds: [] };
    });
  },

  duplicateSelected: () => {
    const state = get();
    const selected = state.getSelectedNodes();
    if (selected.length === 0) return;
    state.recordHistory();
    const clones = cloneNodes(selected);
    const nextNodes = { ...state.nodes };
    const newIds: string[] = [];
    for (const clone of clones) {
      nextNodes[clone.id] = clone;
      newIds.push(clone.id);
    }
    set({ nodes: nextNodes, selectedIds: newIds });
  },

  copySelected: () => {
    const selected = get().getSelectedNodes();
    set({ clipboard: selected.map((node) => structuredClone(node)) });
    void writeNodesToClipboard(selected);
  },

  pasteClipboard: () => {
    const { clipboard } = get();
    if (clipboard.length === 0) return;
    get().recordHistory();
    const clones = cloneNodes(clipboard);
    const nextNodes = { ...get().nodes };
    const newIds: string[] = [];
    for (const clone of clones) {
      nextNodes[clone.id] = clone;
      newIds.push(clone.id);
    }
    set({ nodes: nextNodes, selectedIds: newIds });
  },

  pasteExternalNodes: (nodes, center) => {
    if (nodes.length === 0) return false;
    get().recordHistory();
    let clones = cloneNodes(nodes);
    if (center) {
      const bounds = clones.reduce(
        (acc, node) => {
          const b = getNodeBounds(node);
          if (!b) return acc;
          return {
            minX: Math.min(acc.minX, b.x),
            minY: Math.min(acc.minY, b.y),
            maxX: Math.max(acc.maxX, b.x + b.width),
            maxY: Math.max(acc.maxY, b.y + b.height),
          };
        },
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
      );
      if (Number.isFinite(bounds.minX)) {
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        const dx = center.x - cx;
        const dy = center.y - cy;
        clones = clones.map((clone) => ({
          ...clone,
          x: clone.x + dx,
          y: clone.y + dy,
          ...(clone.type === "line" ? { x2: clone.x2 + dx, y2: clone.y2 + dy } : {}),
        }));
      }
    }
    const nextNodes = { ...get().nodes };
    const newIds: string[] = [];
    for (const clone of clones) {
      nextNodes[clone.id] = clone;
      newIds.push(clone.id);
    }
    set({ nodes: nextNodes, selectedIds: newIds });
    return true;
  },

  updateSelectedWithHistory: (patch) => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    state.recordHistory();
    const nextNodes = { ...state.nodes };
    for (const id of state.selectedIds) {
      const node = nextNodes[id];
      if (!node || node.type === "page") continue;
      nextNodes[id] = { ...node, ...patch } as SceneNode;
    }
    set({ nodes: nextNodes });
  },

  groupSelected: () => {
    const state = get();
    const selected = state.getSelectedNodes();
    if (selected.length < 2) return;

    state.recordHistory();
    const bounds = selected.reduce(
      (acc, node) => {
        const b = getNodeBounds(node);
        if (!b) return acc;
        return {
          minX: Math.min(acc.minX, b.x),
          minY: Math.min(acc.minY, b.y),
          maxX: Math.max(acc.maxX, b.x + b.width),
          maxY: Math.max(acc.maxY, b.y + b.height),
        };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );

    const page = state.getRootPage();
    if (!page) return;

    const groupId = createId("group");
    const index = countType(state.nodes, "group") + 1;
    const group: SceneNode = {
      id: groupId,
      name: `Group ${index}`,
      type: "group",
      parentId: page.id,
      visible: true,
      locked: false,
      sortOrder: nextSortOrder(state.nodes, page.id),
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      rotation: 0,
      opacity: 1,
    };

    const nextNodes = { ...state.nodes, [groupId]: group };
    for (const node of selected) {
      nextNodes[node.id] = { ...nextNodes[node.id], parentId: groupId };
    }
    set({ nodes: nextNodes, selectedIds: [groupId] });
  },

  ungroupSelected: () => {
    const state = get();
    const groups = state.selectedIds
      .map((id) => state.nodes[id])
      .filter((node): node is ShapeNode => !!node && node.type === "group");
    if (groups.length === 0) return;

    state.recordHistory();
    const nextNodes = { ...state.nodes };
    const newSelection: string[] = [];

    for (const group of groups) {
      const children = Object.values(nextNodes).filter((node) => node.parentId === group.id);
      for (const child of children) {
        nextNodes[child.id] = { ...child, parentId: group.parentId };
        newSelection.push(child.id);
      }
      delete nextNodes[group.id];
    }
    set({ nodes: nextNodes, selectedIds: newSelection });
  },

  toggleVisibility: (id) => {
    get().recordHistory();
    const node = get().nodes[id];
    if (!node) return;
    get().updateNode(id, { visible: !node.visible });
  },

  toggleLock: (id) => {
    get().recordHistory();
    const node = get().nodes[id];
    if (!node) return;
    get().updateNode(id, { locked: !node.locked });
  },

  renameNode: (id, name) => {
    get().recordHistory();
    const node = get().nodes[id];
    if (!node) return;
    const trimmed = name.trim();
    const fallback = node.type === "page" ? node.name : "Layer";
    get().updateNode(id, { name: trimmed || fallback });
  },

  getPages: () => selectPages(get().nodes),

  setActivePage: (id) => {
    const page = get().nodes[id];
    if (!page || page.type !== "page" || get().activePageId === id) return;
    set({ activePageId: id, selectedIds: [], draft: null, marquee: null });
  },

  addPage: () => {
    const state = get();
    state.recordHistory();
    const pageId = createId("page");
    const frameId = createId("frame");
    const pageCount = countType(state.nodes, "page") + 1;
    const sortOrder =
      Math.max(0, ...state.getPages().map((page) => page.sortOrder ?? 0)) + 1;

    set((current) => ({
      nodes: {
        ...current.nodes,
        [pageId]: {
          id: pageId,
          name: `Page ${pageCount}`,
          type: "page",
          parentId: null,
          visible: true,
          locked: false,
          sortOrder,
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
        },
        ...defaultPageFrame(pageId, frameId),
      },
      activePageId: pageId,
      selectedIds: [],
      draft: null,
      marquee: null,
      camera: { x: 0, y: 0, zoom: 1 },
    }));

    return pageId;
  },

  deletePage: (pageId) => {
    const state = get();
    const pages = state.getPages();
    if (pages.length <= 1) return false;

    const page = state.nodes[pageId];
    if (!page || page.type !== "page") return false;

    state.recordHistory();

    const toDelete = new Set<string>([pageId]);
    const queue = [pageId];
    while (queue.length > 0) {
      const id = queue.pop()!;
      for (const node of Object.values(state.nodes)) {
        if (node.parentId === id && !toDelete.has(node.id)) {
          toDelete.add(node.id);
          queue.push(node.id);
        }
      }
    }

    const nextNodes = { ...state.nodes };
    for (const id of toDelete) {
      delete nextNodes[id];
    }

    const remainingPages = pages.filter((entry) => entry.id !== pageId);
    const nextActivePageId =
      state.activePageId === pageId ? remainingPages[0].id : state.activePageId;

    set({
      nodes: nextNodes,
      activePageId: nextActivePageId,
      selectedIds: [],
      draft: null,
      marquee: null,
    });
    return true;
  },

  moveLayerOrder: (nodeId, direction) => {
    const state = get();
    const node = state.nodes[nodeId];
    if (!node || node.type === "page") return;

    const siblings = Object.values(state.nodes)
      .filter((entry) => entry.parentId === node.parentId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const index = siblings.findIndex((entry) => entry.id === nodeId);
    const targetIndex = direction === "forward" ? index + 1 : index - 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;

    state.recordHistory();
    const target = siblings[targetIndex];
    const nextNodes = { ...state.nodes };
    nextNodes[nodeId] = { ...node, sortOrder: target.sortOrder ?? targetIndex };
    nextNodes[target.id] = { ...target, sortOrder: node.sortOrder ?? index };
    set({ nodes: nextNodes });
  },

  alignSelected: (mode) => {
    const state = get();
    const selected = state.getSelectedNodes();
    if (selected.length < 2) return;

    state.recordHistory();
    const bounds = selected.map((node) => getNodeBounds(node)).filter(Boolean) as NonNullable<
      ReturnType<typeof getNodeBounds>
    >[];
    const minX = Math.min(...bounds.map((b) => b.x));
    const maxX = Math.max(...bounds.map((b) => b.x + b.width));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxY = Math.max(...bounds.map((b) => b.y + b.height));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    for (const node of selected) {
      const b = getNodeBounds(node);
      if (!b) continue;
      let x = node.x;
      let y = node.y;
      if (mode === "left") x = minX;
      if (mode === "center-h") x = midX - b.width / 2;
      if (mode === "right") x = maxX - b.width;
      if (mode === "top") y = minY;
      if (mode === "center-v") y = midY - b.height / 2;
      if (mode === "bottom") y = maxY - b.height;
      state.updateNode(node.id, { x, y });
    }
  },

  nudgeSelected: (dx, dy) => {
    get().recordHistory();
    get().moveSelected(dx, dy);
  },

  createShape: (kind, bounds) => {
    const state = get();
    const page = state.getRootPage();
    if (!page) return null;

    const selectedFrame = state.selectedIds
      .map((id) => state.nodes[id])
      .find((node) => node?.type === "frame");
    const parentId = selectedFrame?.id ?? page.id;
    const minSize = kind === "line" ? 1 : 4;
    const width = Math.abs(bounds.width);
    const height = Math.abs(bounds.height);

    if (kind !== "line" && (width < minSize || height < minSize)) {
      return null;
    }

    const x = bounds.width < 0 ? bounds.x + bounds.width : bounds.x;
    const y = bounds.height < 0 ? bounds.y + bounds.height : bounds.y;
    const id = createId(kind);
    const index = countType(
      state.nodes,
      kind === "frame" ? "frame" : kind === "triangle" || kind === "polygon" ? "polygon" : kind === "star" ? "star" : kind,
    ) + 1;

    if (kind === "line") {
      const length = Math.hypot((bounds.x2 ?? bounds.x) - bounds.x, (bounds.y2 ?? bounds.y) - bounds.y);
      if (length < minSize) return null;

      const node: SceneNode = {
        id,
        name: `${nodeLabel("line")} ${index}`,
        type: "line",
        parentId,
        visible: true,
        locked: false,
        sortOrder: nextSortOrder(state.nodes, parentId),
        x: bounds.x,
        y: bounds.y,
        x2: bounds.x2 ?? bounds.x,
        y2: bounds.y2 ?? bounds.y,
        rotation: 0,
        opacity: 1,
        stroke: "#000000",
        strokeWidth: 2,
        lineStyle: "straight",
        lineDash: "solid",
        startAnchor: bounds.startAnchor,
        endAnchor: bounds.endAnchor,
      };
      get().addNode(node);
      return id;
    }

    const shapeLabel =
      kind === "triangle"
        ? "Triangle"
        : kind === "polygon"
          ? "Polygon"
          : kind === "star"
            ? "Star"
            : nodeLabel(kind === "frame" ? "frame" : kind);

    const base = {
      id,
      name: `${shapeLabel} ${index}`,
      parentId,
      visible: true,
      locked: false,
      sortOrder: nextSortOrder(state.nodes, parentId),
      x,
      y,
      rotation: 0,
      opacity: 1,
      width,
      height,
    };

    let node: SceneNode;
    const fillShape = {
      fill: "#0D99FF",
      stroke: "#FFFFFF",
      strokeWidth: 1,
    };

    if (kind === "frame") {
      node = { ...base, type: "frame", fill: "#FFFFFF" };
    } else if (kind === "rectangle") {
      node = {
        ...base,
        type: "rectangle",
        ...fillShape,
        cornerRadius: 8,
      };
    } else if (kind === "ellipse") {
      node = { ...base, type: "ellipse", ...fillShape };
    } else if (kind === "triangle") {
      node = { ...base, type: "polygon", sides: 3, ...fillShape };
    } else if (kind === "polygon") {
      node = { ...base, type: "polygon", sides: 6, ...fillShape };
    } else if (kind === "star") {
      node = {
        ...base,
        type: "star",
        points: 5,
        innerRadiusRatio: 0.38,
        ...fillShape,
      };
    } else {
      return null;
    }

    get().addNode(node);
    return id;
  },

  createVectorFromPath: (
    absolutePoints,
    closed,
    options,
  ) => {
    const state = get();
    const page = state.getRootPage();
    if (!page || absolutePoints.length < 2) return null;

    const bounds = pathGeometryBounds(absolutePoints, closed, (options?.strokeWidth ?? 2) / 2);
    if (!bounds) return null;

    const selectedFrame = state.selectedIds
      .map((id) => state.nodes[id])
      .find((node) => node?.type === "frame");
    const parentId = selectedFrame?.id ?? page.id;
    const id = createId("vector");
    const index = countType(state.nodes, "vector") + 1;
    const localPoints = absoluteToLocalPoints(absolutePoints, { x: bounds.x, y: bounds.y });

    const node: SceneNode = normalizeVectorNode({
      id,
      name: options?.name ?? `Vector ${index}`,
      type: "vector",
      parentId,
      visible: true,
      locked: false,
      sortOrder: nextSortOrder(state.nodes, parentId),
      x: bounds.x,
      y: bounds.y,
      rotation: 0,
      opacity: 1,
      width: bounds.width,
      height: bounds.height,
      points: localPoints,
      closed,
      fill: options?.fill ?? "#0D99FF",
      stroke: options?.stroke ?? "#000000",
      strokeWidth: options?.strokeWidth ?? 2,
      effects: {
        dropShadow: {
          enabled: false,
          offsetX: 4,
          offsetY: 4,
          blur: 8,
          color: "rgba(0,0,0,0.25)",
        },
      },
    });

    get().addNode(node);
    return id;
  },

  insertLibrarySymbol: (symbolId, position, size = 48) => {
    const symbol = SYMBOL_BY_ID[symbolId];
    if (!symbol) return null;

    const state = get();
    const page = state.getRootPage();
    if (!page) return null;

    state.recordHistory();

    const scale = size / symbol.viewBox;
    const strokeWidth = 2 * scale;
    const scaledSets = symbol.paths
      .map((pathDef) => transformPathPoints(svgPathToPathPoints(pathDef.d), scale, 0, 0))
      .filter((points) => points.length >= 2);

    if (scaledSets.length === 0) return null;

    const flatPoints = scaledSets.flat();
    const combined = boundsOfPathPoints(flatPoints);
    if (!combined) return null;

    const offsetX = position.x - (combined.x + combined.width / 2);
    const offsetY = position.y - (combined.y + combined.height / 2);
    const createdIds: string[] = [];

    for (const pathDef of symbol.paths) {
      const points = transformPathPoints(svgPathToPathPoints(pathDef.d), scale, offsetX, offsetY);
      if (points.length < 2) continue;
      const id = get().createVectorFromPath(points, pathDef.closed, {
        name: symbol.name,
        fill: "none",
        stroke: "#000000",
        strokeWidth,
      });
      if (id) createdIds.push(id);
    }

    if (createdIds.length === 0) return null;

    if (createdIds.length === 1) {
      get().updateNode(createdIds[0], { name: symbol.name });
      set({ selectedIds: [createdIds[0]] });
      return createdIds[0];
    }

    const bounds = createdIds.reduce(
      (acc, id) => {
        const node = get().nodes[id];
        const b = node ? getNodeBounds(node) : null;
        if (!b) return acc;
        return {
          minX: Math.min(acc.minX, b.x),
          minY: Math.min(acc.minY, b.y),
          maxX: Math.max(acc.maxX, b.x + b.width),
          maxY: Math.max(acc.maxY, b.y + b.height),
        };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );

    const selectedFrame = state.selectedIds
      .map((id) => state.nodes[id])
      .find((node) => node?.type === "frame");
    const parentId = selectedFrame?.id ?? page.id;
    const groupId = createId("group");
    const group: SceneNode = {
      id: groupId,
      name: symbol.name,
      type: "group",
      parentId,
      visible: true,
      locked: false,
      sortOrder: nextSortOrder(get().nodes, parentId),
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      rotation: 0,
      opacity: 1,
    };

    const nextNodes = { ...get().nodes, [groupId]: group };
    for (const id of createdIds) {
      nextNodes[id] = { ...nextNodes[id], parentId: groupId, name: symbol.name };
    }
    set({ nodes: nextNodes, selectedIds: [groupId] });
    return groupId;
  },

  insertImage: (src, naturalWidth, naturalHeight, position, name) => {
    const state = get();
    const page = state.getRootPage();
    if (!page || !src) return null;

    state.recordHistory();

    const { width, height } = fitImageDisplaySize(naturalWidth, naturalHeight);
    const camera = state.camera;
    const defaultPosition = {
      x: (-camera.x + window.innerWidth / 2) / camera.zoom - width / 2,
      y: (-camera.y + (window.innerHeight - 120) / 2) / camera.zoom - height / 2,
    };
    const pos = position ?? defaultPosition;

    const selectedFrame = state.selectedIds
      .map((id) => state.nodes[id])
      .find((node) => node?.type === "frame");
    const parentId = selectedFrame?.id ?? page.id;
    const id = createId("image");
    const index = countType(state.nodes, "image") + 1;

    const node: SceneNode = {
      id,
      name: name ?? `Image ${index}`,
      type: "image",
      parentId,
      visible: true,
      locked: false,
      sortOrder: nextSortOrder(state.nodes, parentId),
      x: pos.x,
      y: pos.y,
      rotation: 0,
      opacity: 1,
      width,
      height,
      src,
      naturalWidth,
      naturalHeight,
    };

    get().addNode(node);
    set({ selectedIds: [id] });
    return id;
  },

  createFramePreset: (center, preset) => {
    const state = get();
    const page = state.getRootPage();
    if (!page) return null;

    const id = createId("frame");
    const index = countType(state.nodes, "frame") + 1;
    const node: SceneNode = {
      id,
      name: preset.name || `Frame ${index}`,
      type: "frame",
      parentId: page.id,
      visible: true,
      locked: false,
      sortOrder: nextSortOrder(state.nodes, page.id),
      x: center.x - preset.width / 2,
      y: center.y - preset.height / 2,
      rotation: 0,
      opacity: 1,
      width: preset.width,
      height: preset.height,
      fill: "#FFFFFF",
    };
    get().addNode(node);
    return id;
  },

  reorderNode: (nodeId, targetId, position) => {
    const state = get();
    const node = state.nodes[nodeId];
    const target = state.nodes[targetId];
    if (!node || !target || node.id === target.id || node.type === "page") return;

    state.recordHistory();
    const parentId = target.parentId;
    if (node.parentId !== parentId) {
      get().updateNode(nodeId, { parentId });
    }

    const siblings = Object.values(get().nodes)
      .filter((entry) => entry.parentId === parentId && entry.id !== nodeId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const targetIndex = siblings.findIndex((entry) => entry.id === targetId);
    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
    siblings.splice(insertIndex, 0, { ...get().nodes[nodeId], parentId });

    const nextNodes = { ...get().nodes };
    siblings.forEach((entry, index) => {
      nextNodes[entry.id] = { ...nextNodes[entry.id], sortOrder: index, parentId };
    });
    set({ nodes: nextNodes });
  },

  moveSelected: (dx, dy) =>
    set((state) => {
      if ((dx === 0 && dy === 0) || state.selectedIds.length === 0) return state;

      const nextNodes = { ...state.nodes };
      const moved = new Set<string>();

      const applyDelta = (id: string) => {
        const node = nextNodes[id];
        if (!node || node.locked) return;
        if (node.type === "line") {
          nextNodes[id] = {
            ...node,
            x: node.x + dx,
            y: node.y + dy,
            x2: node.x2 + dx,
            y2: node.y2 + dy,
          };
        } else {
          nextNodes[id] = { ...node, x: node.x + dx, y: node.y + dy };
        }
      };

      const moveNode = (id: string, moveChildren: boolean) => {
        if (moved.has(id)) return;
        const node = nextNodes[id];
        if (!node || node.locked) return;
        moved.add(id);
        applyDelta(id);

        if (moveChildren) {
          for (const child of Object.values(nextNodes)) {
            if (child.parentId === id) moveNode(child.id, true);
          }
        }
      };

      for (const id of state.selectedIds) {
        const node = nextNodes[id];
        const moveChildren = node?.type === "frame" || node?.type === "group";
        moveNode(id, moveChildren);
      }

      return { nodes: nextNodes };
    }),

  getChildren: (parentId) =>
    Object.values(get().nodes)
      .filter((node) => node.parentId === parentId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),

  getRootPage: () => {
    const state = get();
    const page = state.nodes[state.activePageId];
    if (page?.type === "page") return page;
    return Object.values(state.nodes).find((node) => node.type === "page");
  },

  getSelectedNode: () => {
    const [id] = get().selectedIds;
    if (!id) return undefined;
    const node = get().nodes[id];
    if (!node || node.type === "page") return undefined;
    return node;
  },

  getSelectedNodes: () =>
    get()
      .selectedIds.map((id) => get().nodes[id])
      .filter((node): node is ShapeNode => !!node && node.type !== "page"),

  getDrawableNodes: () =>
    getResolvedDrawableNodes(
      get().nodes,
      {
        colorStyles: get().colorStyles,
        textStyles: get().textStyles,
        components: get().components,
      },
      get().activePageId,
    ),

  exportSelectedNodes: () => {
    const selected = get().getSelectedNodes();
    if (selected.length > 0) {
      const drawable = get().getDrawableNodes();
      if (selected.some((node) => node.type === "instance")) {
        return drawable;
      }
      return selected;
    }
    return get().getDrawableNodes();
  },

  resetDocument: () =>
    set({
      nodes: defaultDocument(),
      activePageId: "page-1",
      ...defaultDesignSystem(),
      selectedIds: [],
      camera: { x: 0, y: 0, zoom: 1 },
      draft: null,
      marquee: null,
      past: [],
      future: [],
    }),

  loadDocument: (nodes, camera, design) => {
    const normalized = normalizeNodes(nodes);
    for (const [id, node] of Object.entries(normalized)) {
      if (node.type === "vector") {
        normalized[id] = normalizeVectorNode(node);
      }
    }
    const activePageId = resolveActivePageId(normalized, null);
    set({
      nodes: normalized,
      activePageId,
      colorStyles: design?.colorStyles ?? defaultDesignSystem().colorStyles,
      textStyles: design?.textStyles ?? defaultDesignSystem().textStyles,
      components: design?.components ?? {},
      selectedIds: [],
      camera,
      draft: null,
      marquee: null,
      past: [],
      future: [],
    });
  },

  createColorStyle: (name, color) => {
    const id = createId("color");
    get().recordHistory();
    set((state) => ({
      colorStyles: {
        ...state.colorStyles,
        [id]: { id, name, color },
      },
    }));
    return id;
  },

  updateColorStyle: (id, patch) => {
    get().recordHistory();
    set((state) => {
      const current = state.colorStyles[id];
      if (!current) return state;
      const nextStyle = { ...current, ...patch };
      const nextStyles = { ...state.colorStyles, [id]: nextStyle };
      const nextNodes = { ...state.nodes };
      for (const [nodeId, node] of Object.entries(nextNodes)) {
        if (node.colorStyleId === id) {
          nextNodes[nodeId] = applyColorStyleToNode(node, nextStyle);
        }
      }
      return { colorStyles: nextStyles, nodes: nextNodes };
    });
  },

  deleteColorStyle: (id) => {
    get().recordHistory();
    set((state) => {
      const { [id]: _, ...rest } = state.colorStyles;
      const nextNodes = { ...state.nodes };
      for (const [nodeId, node] of Object.entries(nextNodes)) {
        if (node.colorStyleId === id) {
          const { colorStyleId: __, ...without } = node;
          nextNodes[nodeId] = without as SceneNode;
        }
      }
      return { colorStyles: rest, nodes: nextNodes };
    });
  },

  createTextStyle: (name) => {
    const id = createId("textstyle");
    get().recordHistory();
    set((state) => ({
      textStyles: {
        ...state.textStyles,
        [id]: {
          id,
          name,
          fontFamily: "Inter, sans-serif",
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 1.4,
          textAlign: "left",
          fill: "#000000",
        },
      },
    }));
    return id;
  },

  updateTextStyle: (id, patch) => {
    get().recordHistory();
    set((state) => {
      const current = state.textStyles[id];
      if (!current) return state;
      const nextStyle = { ...current, ...patch };
      const nextStyles = { ...state.textStyles, [id]: nextStyle };
      const nextNodes = { ...state.nodes };
      for (const [nodeId, node] of Object.entries(nextNodes)) {
        if (node.type === "text" && node.textStyleId === id) {
          nextNodes[nodeId] = applyTextStyleToNode(node, nextStyle);
        }
      }
      return { textStyles: nextStyles, nodes: nextNodes };
    });
  },

  deleteTextStyle: (id) => {
    get().recordHistory();
    set((state) => {
      const { [id]: _, ...rest } = state.textStyles;
      const nextNodes = { ...state.nodes };
      for (const [nodeId, node] of Object.entries(nextNodes)) {
        if (node.type === "text" && node.textStyleId === id) {
          const { textStyleId: __, ...without } = node;
          nextNodes[nodeId] = without as SceneNode;
        }
      }
      return { textStyles: rest, nodes: nextNodes };
    });
  },

  applyColorStyleToSelected: (styleId) => {
    const selected = get().getSelectedNodes();
    if (selected.length === 0) return;
    get().recordHistory();
    for (const node of selected) {
      get().updateNode(node.id, { colorStyleId: styleId });
    }
  },

  applyTextStyleToSelected: (styleId) => {
    const selected = get().getSelectedNodes().filter((node) => node.type === "text");
    if (selected.length === 0) return;
    get().recordHistory();
    for (const node of selected) {
      get().updateNode(node.id, { textStyleId: styleId });
    }
  },

  createComponentFromSelection: () => {
    const state = get();
    const [selected] = state.getSelectedNodes();
    if (!selected || (selected.type !== "frame" && selected.type !== "group")) return null;

    const bounds = getNodeBounds(selected);
    if (!bounds) return null;

    state.recordHistory();
    const componentId = createId("component");
    const subtree = collectSubtree(selected.id, state.nodes);

    set((s) => ({
      components: {
        ...s.components,
        [componentId]: {
          id: componentId,
          name: selected.name,
          rootNodeId: selected.id,
          width: bounds.width,
          height: bounds.height,
          nodes: subtree,
        },
      },
      nodes: {
        ...s.nodes,
        [selected.id]: { ...s.nodes[selected.id], componentId },
      },
      selectedIds: [selected.id],
    }));

    return componentId;
  },

  createInstance: (componentId, position) => {
    const state = get();
    const component = state.components[componentId];
    if (!component) return null;

    const page = state.getRootPage();
    if (!page) return null;

    const selectedFrame = state.selectedIds
      .map((id) => state.nodes[id])
      .find((node) => node?.type === "frame");
    const parentId = selectedFrame?.id ?? page.id;

    state.recordHistory();
    const id = createId("instance");
    const index = Object.values(state.nodes).filter((n) => n.type === "instance").length + 1;
    const node: InstanceNode = {
      id,
      name: `${component.name} ${index}`,
      type: "instance",
      parentId,
      visible: true,
      locked: false,
      sortOrder: nextSortOrder(state.nodes, parentId),
      x: position.x,
      y: position.y,
      rotation: 0,
      opacity: 1,
      componentId,
      width: component.width,
      height: component.height,
      overrides: {},
    };

    get().addNode(node);
    set({ selectedIds: [id] });
    return id;
  },

  detachInstance: (instanceId) => {
    const state = get();
    const instance = state.nodes[instanceId];
    if (!instance || instance.type !== "instance") return;

    const component = state.components[instance.componentId];
    if (!component) return;

    const page = state.getRootPage();
    if (!page) return;

    state.recordHistory();
    const root = component.nodes[component.rootNodeId];
    const dx = instance.x - root.x;
    const dy = instance.y - root.y;
    const nextNodes = { ...state.nodes };
    delete nextNodes[instanceId];

    const idMap = new Map<string, string>();
    for (const sourceId of Object.keys(component.nodes)) {
      idMap.set(sourceId, createId(component.nodes[sourceId].type));
    }

    const newSelected: string[] = [];
    for (const source of Object.values(component.nodes)) {
      const override = instance.overrides[source.id] ?? {};
      const newId = idMap.get(source.id)!;
      const parentId =
        source.id === component.rootNodeId
          ? instance.parentId
          : source.parentId
            ? (idMap.get(source.parentId) ?? instance.parentId)
            : instance.parentId;

      let node = {
        ...source,
        ...override,
        id: newId,
        parentId,
        x: source.x + dx,
        y: source.y + dy,
        sortOrder: nextSortOrder(nextNodes, parentId ?? page.id),
      } as SceneNode;

      if (node.type === "line") {
        node = { ...node, x2: node.x2 + dx, y2: node.y2 + dy };
      }
      if (node.colorStyleId && state.colorStyles[node.colorStyleId]) {
        node = applyColorStyleToNode(node, state.colorStyles[node.colorStyleId]);
      }
      if (node.type === "text" && node.textStyleId && state.textStyles[node.textStyleId]) {
        node = applyTextStyleToNode(node, state.textStyles[node.textStyleId]);
      }

      nextNodes[newId] = node;
      if (source.id === component.rootNodeId) newSelected.push(newId);
    }

    set({ nodes: nextNodes, selectedIds: newSelected });
  },

  resetInstanceOverrides: (instanceId) => {
    get().recordHistory();
    get().updateNode(instanceId, { overrides: {} } as Partial<InstanceNode>);
  },

  zoomToBounds: (bounds, viewport, padding = 64) =>
    set((state) => {
      if (bounds.width <= 0 || bounds.height <= 0) return state;
      const scaleX = (viewport.width - padding * 2) / bounds.width;
      const scaleY = (viewport.height - padding * 2) / bounds.height;
      const zoom = Math.min(8, Math.max(0.1, Math.min(scaleX, scaleY)));
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      return {
        camera: {
          zoom,
          x: viewport.width / 2 - cx * zoom,
          y: viewport.height / 2 - cy * zoom,
        },
      };
    }),
}));
