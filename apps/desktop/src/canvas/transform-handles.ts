import { getNodeBounds } from "@/canvas/geometry";
import { strokeLinePath } from "@/canvas/lines";
import { scaleVectorPointsFromAnchor, translatePathPoints } from "@/canvas/vector-path";
import type { LineNode, PathPoint, SceneNode } from "@/types/document";

export type HandleId =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

export interface HandlePoint {
  id: HandleId;
  x: number;
  y: number;
}

const HANDLE_SIZE = 8;
const ROTATION_OFFSET = 28;

function getCenter(node: SceneNode): { x: number; y: number } | null {
  const bounds = getNodeBounds(node);
  if (!bounds) return null;
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

function rotatePoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  degrees: number,
): { x: number; y: number } {
  if (degrees === 0) return point;
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function withRotation<T extends { x: number; y: number }>(
  node: SceneNode,
  point: T,
): T {
  const center = getCenter(node);
  if (!center || node.rotation === 0) return point;
  return { ...point, ...rotatePoint(point, center, node.rotation) };
}

export function getResizeHandles(node: SceneNode): HandlePoint[] | null {
  const bounds = getNodeBounds(node);
  if (!bounds || node.type === "line" || node.type === "text") return null;

  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const right = x + width;
  const bottom = y + height;

  const local: HandlePoint[] = [
    { id: "nw", x, y },
    { id: "n", x: cx, y },
    { id: "ne", x: right, y },
    { id: "e", x: right, y: cy },
    { id: "se", x: right, y: bottom },
    { id: "s", x: cx, y: bottom },
    { id: "sw", x, y: bottom },
    { id: "w", x, y: cy },
  ];

  return local.map((handle) => withRotation(node, handle));
}

export function getRotationHandle(node: SceneNode): { x: number; y: number } | null {
  const bounds = getNodeBounds(node);
  if (!bounds || node.type === "line" || node.type === "text") return null;

  const top = { x: bounds.x + bounds.width / 2, y: bounds.y };
  const handle = { x: top.x, y: top.y - ROTATION_OFFSET };
  return withRotation(node, handle);
}

export type LineEndpointId = "start" | "end";

export function getLineEndpointHandles(line: LineNode): { id: LineEndpointId; x: number; y: number }[] {
  return [
    { id: "start", x: line.x, y: line.y },
    { id: "end", x: line.x2, y: line.y2 },
  ];
}

export function hitTestLineEndpoint(
  line: LineNode,
  world: { x: number; y: number },
  zoom: number,
): LineEndpointId | null {
  const hitRadius = HANDLE_SIZE / zoom / 2 + 6 / zoom;
  for (const handle of getLineEndpointHandles(line)) {
    if (Math.hypot(world.x - handle.x, world.y - handle.y) <= hitRadius) {
      return handle.id;
    }
  }
  return null;
}

export function hitTestHandle(
  handles: HandlePoint[],
  world: { x: number; y: number },
  zoom: number,
): HandleId | null {
  const hitRadius = HANDLE_SIZE / zoom / 2 + 2 / zoom;
  for (const handle of handles) {
    if (Math.hypot(world.x - handle.x, world.y - handle.y) <= hitRadius) {
      return handle.id;
    }
  }
  return null;
}

export function hitTestRotationHandle(
  node: SceneNode,
  world: { x: number; y: number },
  zoom: number,
): boolean {
  const handle = getRotationHandle(node);
  if (!handle) return false;
  const hitRadius = HANDLE_SIZE / zoom / 2 + 4 / zoom;
  return Math.hypot(world.x - handle.x, world.y - handle.y) <= hitRadius;
}

export function computeRotation(
  center: { x: number; y: number },
  world: { x: number; y: number },
): number {
  const radians = Math.atan2(world.y - center.y, world.x - center.x);
  return (radians * 180) / Math.PI + 90;
}

export function pointerAngle(center: { x: number; y: number }, world: { x: number; y: number }): number {
  return Math.atan2(world.y - center.y, world.x - center.x);
}

export function rotationFromDelta(
  startRotation: number,
  startAngle: number,
  currentAngle: number,
  snapDegrees?: number,
): number {
  const delta = ((currentAngle - startAngle) * 180) / Math.PI;
  let rotation = startRotation + delta;
  if (snapDegrees) {
    rotation = Math.round(rotation / snapDegrees) * snapDegrees;
  }
  return rotation;
}

function getResizeAnchor(
  handle: HandleId,
  width: number,
  height: number,
): { x: number; y: number } {
  switch (handle) {
    case "nw":
      return { x: width, y: height };
    case "n":
      return { x: width / 2, y: height };
    case "ne":
      return { x: 0, y: height };
    case "e":
      return { x: 0, y: height / 2 };
    case "se":
      return { x: 0, y: 0 };
    case "s":
      return { x: width / 2, y: 0 };
    case "sw":
      return { x: width, y: 0 };
    case "w":
      return { x: width, y: height / 2 };
  }
}

export function applyResize(
  node: SceneNode,
  handle: HandleId,
  startBounds: { x: number; y: number; width: number; height: number },
  world: { x: number; y: number },
  constrain: boolean,
  startPoints?: PathPoint[],
): Partial<SceneNode> | null {
  if (node.type === "line" || node.type === "text" || node.type === "page") return null;

  let { x, y, width, height } = startBounds;
  const right = x + width;
  const bottom = y + height;

  switch (handle) {
    case "nw":
      x = world.x;
      y = world.y;
      width = right - x;
      height = bottom - y;
      break;
    case "n":
      y = world.y;
      height = bottom - y;
      break;
    case "ne":
      y = world.y;
      width = world.x - x;
      height = bottom - y;
      break;
    case "e":
      width = world.x - x;
      break;
    case "se":
      width = world.x - x;
      height = world.y - y;
      break;
    case "s":
      height = world.y - y;
      break;
    case "sw":
      x = world.x;
      width = right - x;
      height = world.y - y;
      break;
    case "w":
      x = world.x;
      width = right - x;
      break;
  }

  if (width < 0) {
    x += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }

  if (constrain) {
    const size = Math.max(width, height);
    width = size;
    height = size;
  }

  if (width < 4 || height < 4) return null;

  if (node.type === "vector") {
    const sourcePoints = startPoints ?? node.points;
    let scaleX = width / startBounds.width;
    let scaleY = height / startBounds.height;
    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || startBounds.width === 0 || startBounds.height === 0) {
      return null;
    }

    const anchor = getResizeAnchor(handle, startBounds.width, startBounds.height);

    if (constrain) {
      const uniform = Math.min(scaleX, scaleY);
      scaleX = uniform;
      scaleY = uniform;
      width = startBounds.width * uniform;
      height = startBounds.height * uniform;
      x = startBounds.x + anchor.x * (1 - uniform);
      y = startBounds.y + anchor.y * (1 - uniform);
    }

    const scaledPoints = scaleVectorPointsFromAnchor(sourcePoints, anchor, scaleX, scaleY);
    const points = translatePathPoints(scaledPoints, startBounds.x - x, startBounds.y - y);

    return {
      x,
      y,
      width,
      height,
      points,
    };
  }

  return { x, y, width, height };
}

export function drawSelectionOutline(ctx: CanvasRenderingContext2D, node: SceneNode, zoom: number) {
  if (node.type === "line") {
    drawLineSelectionOutline(ctx, node, zoom);
    return;
  }

  const bounds = getNodeBounds(node);
  if (!bounds || node.type === "page") return;

  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;

  ctx.save();
  if (node.rotation !== 0) {
    ctx.translate(cx, cy);
    ctx.rotate((node.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  ctx.strokeStyle = "#0D99FF";
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);
  ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawLineSelectionOutline(ctx: CanvasRenderingContext2D, node: LineNode, zoom: number) {
  ctx.save();
  ctx.strokeStyle = "#0D99FF";
  ctx.lineWidth = Math.max(1 / zoom, node.strokeWidth + 2 / zoom);
  ctx.setLineDash([]);
  strokeLinePath(ctx, node);
  ctx.stroke();

  const size = HANDLE_SIZE / zoom;
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#0D99FF";
  ctx.lineWidth = 1 / zoom;
  for (const point of [
    { x: node.x, y: node.y },
    { x: node.x2, y: node.y2 },
  ]) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTransformHandles(
  ctx: CanvasRenderingContext2D,
  handles: HandlePoint[],
  zoom: number,
  rotationHandle: { x: number; y: number } | null,
) {
  const size = HANDLE_SIZE / zoom;
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#0D99FF";
  ctx.lineWidth = 1 / zoom;

  for (const handle of handles) {
    ctx.fillRect(handle.x - size / 2, handle.y - size / 2, size, size);
    ctx.strokeRect(handle.x - size / 2, handle.y - size / 2, size, size);
  }

  if (rotationHandle) {
    const top = handles.find((handle) => handle.id === "n");
    if (top) {
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(rotationHandle.x, rotationHandle.y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(rotationHandle.x, rotationHandle.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
