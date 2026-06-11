import type { Camera, DraftShape, LineNode, SceneNode, ShapeNode } from "@/types/document";
import { distanceToLineNode } from "@/canvas/lines";
import { pointInPolygon, regularPolygonVertices, starVertices } from "@/canvas/shapes";
import { distanceToVectorNode, pointInVector } from "@/canvas/vector-path";

export interface Point {
  x: number;
  y: number;
}

export function screenToWorld(point: Point, camera: Camera): Point {
  return {
    x: (point.x - camera.x) / camera.zoom,
    y: (point.y - camera.y) / camera.zoom,
  };
}

export function worldToScreen(point: Point, camera: Camera): Point {
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y,
  };
}

export function getNodeBounds(node: SceneNode): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  switch (node.type) {
    case "page":
      return null;
    case "line": {
      const minX = Math.min(node.x, node.x2);
      const minY = Math.min(node.y, node.y2);
      return {
        x: minX,
        y: minY,
        width: Math.max(Math.abs(node.x2 - node.x), 1),
        height: Math.max(Math.abs(node.y2 - node.y), 1),
      };
    }
    case "text":
      return {
        x: node.x,
        y: node.y,
        width: Math.max(node.width, 1),
        height: node.fontSize * (node.lineHeight ?? 1.2),
      };
    case "group":
    case "frame":
    case "rectangle":
    case "polygon":
    case "star":
    case "vector":
    case "image":
    case "ellipse":
    case "instance":
      return {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
      };
    default:
      return null;
  }
}

export function hitTestNode(node: SceneNode, world: Point): boolean {
  if (!node.visible || node.locked || node.type === "page") return false;
  const bounds = getNodeBounds(node);
  if (!bounds) return false;

  if (node.type === "ellipse") {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;
    if (rx === 0 || ry === 0) return false;
    const dx = (world.x - cx) / rx;
    const dy = (world.y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }

  if (node.type === "line") {
    const dist = distanceToLineNode(node as LineNode, world);
    return dist <= Math.max(6, node.strokeWidth + 4);
  }

  if (node.type === "polygon") {
    return pointInPolygon(
      world,
      regularPolygonVertices(node.x, node.y, node.width, node.height, node.sides),
    );
  }

  if (node.type === "star") {
    return pointInPolygon(
      world,
      starVertices(node.x, node.y, node.width, node.height, node.points, node.innerRadiusRatio),
    );
  }

  if (node.type === "vector") {
    const local = { x: world.x - node.x, y: world.y - node.y };
    const dist = distanceToVectorNode(node, local);
    if (dist !== Infinity) return true;
    return pointInVector(node, local);
  }

  return (
    world.x >= bounds.x &&
    world.x <= bounds.x + bounds.width &&
    world.y >= bounds.y &&
    world.y <= bounds.y + bounds.height
  );
}

const CONTAINER_TYPES = new Set<SceneNode["type"]>(["frame", "group"]);

export function isDescendantOf(
  nodes: Record<string, SceneNode>,
  nodeId: string,
  ancestorId: string,
): boolean {
  let current = nodes[nodeId];
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = nodes[current.parentId];
  }
  return false;
}

/** Drop parent frames/groups when their children are also selected. */
export function pruneContainerSelection(
  nodes: Record<string, SceneNode>,
  ids: string[],
): string[] {
  const idSet = new Set(ids);
  return ids.filter((id) => {
    const node = nodes[id];
    if (!node || !CONTAINER_TYPES.has(node.type)) return true;
    for (const otherId of idSet) {
      if (otherId !== id && isDescendantOf(nodes, otherId, id)) return false;
    }
    return true;
  });
}

/** Prefer the deepest / smallest target under the cursor. */
export function hitTestNodes(nodes: SceneNode[], world: Point): SceneNode | null {
  let best: SceneNode | null = null;
  let bestArea = Infinity;
  let bestIsContainer = true;

  for (const node of nodes) {
    if (node.locked || !hitTestNode(node, world)) continue;

    const bounds = getNodeBounds(node);
    if (!bounds) continue;

    const area = bounds.width * bounds.height;
    const isContainer = CONTAINER_TYPES.has(node.type);

    if (
      area < bestArea ||
      (area === bestArea && bestIsContainer && !isContainer)
    ) {
      best = node;
      bestArea = area;
      bestIsContainer = isContainer;
    }
  }

  return best;
}

export function collectSnapTargets(
  nodes: SceneNode[],
  excludeIds: Set<string>,
): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];

  for (const node of nodes) {
    if (excludeIds.has(node.id) || !node.visible) continue;
    const bounds = getNodeBounds(node);
    if (!bounds) continue;
    x.push(bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width);
    y.push(bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height);
  }

  return { x, y };
}

export interface SnapGuide {
  axis: "x" | "y";
  value: number;
  from: number;
  to: number;
}

export function snapBounds(
  bounds: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number,
  targets: { x: number[]; y: number[] },
  threshold = 6,
): { dx: number; dy: number; guides: SnapGuide[] } {
  const guides: SnapGuide[] = [];
  let nextDx = dx;
  let nextDy = dy;

  const edges = {
    left: bounds.x + dx,
    centerX: bounds.x + bounds.width / 2 + dx,
    right: bounds.x + bounds.width + dx,
    top: bounds.y + dy,
    centerY: bounds.y + bounds.height / 2 + dy,
    bottom: bounds.y + bounds.height + dy,
  };

  const xCandidates = [
    { edge: edges.left, offset: 0 },
    { edge: edges.centerX, offset: bounds.width / 2 },
    { edge: edges.right, offset: bounds.width },
  ];

  for (const targetX of targets.x) {
    for (const candidate of xCandidates) {
      if (Math.abs(candidate.edge - targetX) <= threshold) {
        nextDx = targetX - bounds.x - candidate.offset;
        guides.push({
          axis: "x",
          value: targetX,
          from: Math.min(bounds.y + dy, bounds.y + bounds.height + dy) - 40,
          to: Math.max(bounds.y + dy, bounds.y + bounds.height + dy) + 40,
        });
        break;
      }
    }
    if (guides.some((guide) => guide.axis === "x")) break;
  }

  const yCandidates = [
    { edge: edges.top, offset: 0 },
    { edge: edges.centerY, offset: bounds.height / 2 },
    { edge: edges.bottom, offset: bounds.height },
  ];

  for (const targetY of targets.y) {
    for (const candidate of yCandidates) {
      if (Math.abs(candidate.edge - targetY) <= threshold) {
        nextDy = targetY - bounds.y - candidate.offset;
        guides.push({
          axis: "y",
          value: targetY,
          from: Math.min(bounds.x + dx, bounds.x + bounds.width + dx) - 40,
          to: Math.max(bounds.x + dx, bounds.x + bounds.width + dx) + 40,
        });
        break;
      }
    }
    if (guides.some((guide) => guide.axis === "y")) break;
  }

  return { dx: nextDx, dy: nextDy, guides };
}

export function snapPoint(
  point: Point,
  targets: { x: number[]; y: number[] },
  threshold = 6,
): Point {
  let { x, y } = point;

  for (const targetX of targets.x) {
    if (Math.abs(x - targetX) <= threshold) {
      x = targetX;
      break;
    }
  }

  for (const targetY of targets.y) {
    if (Math.abs(y - targetY) <= threshold) {
      y = targetY;
      break;
    }
  }

  return { x, y };
}

export function getSelectionBounds(nodes: Record<string, SceneNode>, ids: string[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const id of ids) {
    const bounds = getNodeBounds(nodes[id]);
    if (!bounds) continue;
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }

  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function getDocumentBounds(nodes: Record<string, SceneNode>) {
  return getSelectionBounds(
    nodes,
    Object.values(nodes)
      .filter((node) => node.type !== "page" && node.visible)
      .map((node) => node.id),
  );
}

export function flattenDrawableNodes(nodes: Record<string, SceneNode>, pageId?: string): SceneNode[] {
  const page =
    (pageId && nodes[pageId]?.type === "page" ? nodes[pageId] : undefined) ??
    Object.values(nodes).find((node) => node.type === "page");
  if (!page) return [];

  const result: SceneNode[] = [];
  const walk = (parentId: string) => {
    const children = Object.values(nodes)
      .filter((node) => node.parentId === parentId && node.visible)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    for (const child of children) {
      result.push(child);
      walk(child.id);
    }
  };
  walk(page.id);
  return result;
}

export function snap(value: number, grid = 1): number {
  return Math.round(value / grid) * grid;
}

export function normalizeDraftBounds(
  start: Point,
  end: Point,
  constrain: boolean,
): DraftShape {
  let width = end.x - start.x;
  let height = end.y - start.y;

  if (constrain) {
    const size = Math.max(Math.abs(width), Math.abs(height));
    width = Math.sign(width || 1) * size;
    height = Math.sign(height || 1) * size;
  }

  return {
    kind: "rectangle",
    x: start.x,
    y: start.y,
    width,
    height,
  };
}

export function measureTextWidth(text: string, fontSize: number): number {
  if (!text) return 1;
  return Math.max(text.length * fontSize * 0.56, fontSize * 0.5);
}

export function isShapeNode(node: SceneNode): node is ShapeNode {
  return node.type !== "page";
}
