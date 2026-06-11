import type { PathPoint, VectorNode } from "@/types/document";
import type { Point } from "@/canvas/geometry";

export interface PenDraft {
  points: PathPoint[];
  preview?: Point;
}

export function absoluteToLocalPoints(
  points: PathPoint[],
  origin: Point,
): PathPoint[] {
  return points.map((point) => ({
    x: point.x - origin.x,
    y: point.y - origin.y,
    handleIn: point.handleIn
      ? { x: point.handleIn.x - origin.x, y: point.handleIn.y - origin.y }
      : undefined,
    handleOut: point.handleOut
      ? { x: point.handleOut.x - origin.x, y: point.handleOut.y - origin.y }
      : undefined,
  }));
}

export function pathGeometryBounds(
  points: PathPoint[],
  closed: boolean,
  padding = 0,
): { x: number; y: number; width: number; height: number } | null {
  if (points.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const include = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  const sampleSegmentBounds = (from: PathPoint, to: PathPoint) => {
    include(from.x, from.y);
    const steps = from.handleOut || to.handleIn ? 24 : 1;
    for (let i = 1; i <= steps; i += 1) {
      const sample = sampleSegment(from, to, i / steps);
      include(sample.x, sample.y);
    }
  };

  for (let i = 0; i < points.length - 1; i += 1) {
    sampleSegmentBounds(points[i], points[i + 1]);
  }
  if (closed && points.length > 2) {
    sampleSegmentBounds(points[points.length - 1], points[0]);
  }

  if (!Number.isFinite(minX)) return null;

  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(maxX - minX + padding * 2, 1),
    height: Math.max(maxY - minY + padding * 2, 1),
  };
}

/** @deprecated Use pathGeometryBounds for selection boxes. */
export function pathBounds(points: PathPoint[]): { x: number; y: number; width: number; height: number } | null {
  if (points.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const include = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const point of points) {
    include(point.x, point.y);
    if (point.handleIn) include(point.handleIn.x, point.handleIn.y);
    if (point.handleOut) include(point.handleOut.x, point.handleOut.y);
  }

  if (!Number.isFinite(minX)) return null;
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  return { x: minX, y: minY, width, height };
}

export function traceVectorPath(
  ctx: CanvasRenderingContext2D,
  points: PathPoint[],
  closed: boolean,
) {
  if (points.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i += 1) {
    appendSegment(ctx, points[i - 1], points[i]);
  }

  if (closed && points.length > 2) {
    appendSegment(ctx, points[points.length - 1], points[0]);
    ctx.closePath();
  }
}

function appendSegment(ctx: CanvasRenderingContext2D, from: PathPoint, to: PathPoint) {
  const cp1 = from.handleOut ?? from;
  const cp2 = to.handleIn ?? to;
  const curved = from.handleOut || to.handleIn;
  if (curved) {
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, to.x, to.y);
  } else {
    ctx.lineTo(to.x, to.y);
  }
}

export function tracePenPreview(
  ctx: CanvasRenderingContext2D,
  draft: PenDraft,
  closed = false,
) {
  if (draft.points.length === 0) return;

  traceVectorPath(ctx, draft.points, closed);

  if (draft.preview && draft.points.length > 0) {
    ctx.lineTo(draft.preview.x, draft.preview.y);
  }
}

export function distanceToVectorNode(node: VectorNode, point: Point): number {
  const threshold = Math.max(6, node.strokeWidth + 4);
  let best = Infinity;

  for (let i = 0; i < node.points.length - 1; i += 1) {
    best = Math.min(best, distanceToSegment(point, node.points[i], node.points[i + 1]));
  }

  if (node.closed && node.points.length > 2) {
    best = Math.min(
      best,
      distanceToSegment(point, node.points[node.points.length - 1], node.points[0]),
    );
  }

  if (node.closed && node.points.length > 2 && pointInVector(node, point)) {
    return 0;
  }

  return best <= threshold ? best : Infinity;
}

function distanceToSegment(point: Point, from: PathPoint, to: PathPoint): number {
  let best = Infinity;
  const steps = from.handleOut || to.handleIn ? 16 : 1;

  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const sample = sampleSegment(from, to, t);
    best = Math.min(best, Math.hypot(point.x - sample.x, point.y - sample.y));
  }
  return best;
}

function sampleSegment(from: PathPoint, to: PathPoint, t: number): Point {
  if (!from.handleOut && !to.handleIn) {
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
  }
  const cp1 = from.handleOut ?? from;
  const cp2 = to.handleIn ?? to;
  const inv = 1 - t;
  return {
    x: inv * inv * inv * from.x + 3 * inv * inv * t * cp1.x + 3 * inv * t * t * cp2.x + t * t * t * to.x,
    y: inv * inv * inv * from.y + 3 * inv * inv * t * cp1.y + 3 * inv * t * t * cp2.y + t * t * t * to.y,
  };
}

export function pointInVector(node: VectorNode, point: Point): boolean {
  if (!node.closed || node.points.length < 3) return false;

  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return false;
  traceVectorPath(ctx, node.points, true);
  return ctx.isPointInPath(point.x, point.y);
}

export function vectorToSvgPath(points: PathPoint[], closed: boolean): string {
  if (points.length === 0) return "";

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1];
    const to = points[i];
    const cp1 = from.handleOut ?? from;
    const cp2 = to.handleIn ?? to;
    if (from.handleOut || to.handleIn) {
      d += ` C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${to.x} ${to.y}`;
    } else {
      d += ` L ${to.x} ${to.y}`;
    }
  }
  if (closed && points.length > 2) {
    const from = points[points.length - 1];
    const to = points[0];
    const cp1 = from.handleOut ?? from;
    const cp2 = to.handleIn ?? to;
    if (from.handleOut || to.handleIn) {
      d += ` C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${to.x} ${to.y}`;
    } else {
      d += ` L ${to.x} ${to.y}`;
    }
    d += " Z";
  }
  return d;
}

export function nearFirstPoint(points: PathPoint[], point: Point, threshold: number): boolean {
  if (points.length < 3) return false;
  return Math.hypot(point.x - points[0].x, point.y - points[0].y) <= threshold;
}

export function setHandlesFromDrag(anchor: PathPoint, handleWorld: Point, symmetric = true): PathPoint {
  const handleOut = { x: handleWorld.x, y: handleWorld.y };
  if (!symmetric) {
    return { ...anchor, handleOut };
  }
  const handleIn = {
    x: anchor.x - (handleOut.x - anchor.x),
    y: anchor.y - (handleOut.y - anchor.y),
  };
  return { ...anchor, handleIn, handleOut };
}

export function clearHandles(point: PathPoint): PathPoint {
  const { handleIn, handleOut, ...rest } = point;
  return rest;
}

export function translatePathPoints(
  points: PathPoint[],
  dx: number,
  dy: number,
): PathPoint[] {
  const shift = (point: { x: number; y: number }) => ({
    x: point.x + dx,
    y: point.y + dy,
  });

  return points.map((point) => ({
    ...shift(point),
    handleIn: point.handleIn ? shift(point.handleIn) : undefined,
    handleOut: point.handleOut ? shift(point.handleOut) : undefined,
  }));
}

export function scaleVectorPoints(points: PathPoint[], sx: number, sy: number): PathPoint[] {
  return scaleVectorPointsFromAnchor(points, { x: 0, y: 0 }, sx, sy);
}

export function scaleVectorPointsFromAnchor(
  points: PathPoint[],
  anchor: Point,
  sx: number,
  sy: number,
): PathPoint[] {
  const transform = (point: { x: number; y: number }) => ({
    x: anchor.x + (point.x - anchor.x) * sx,
    y: anchor.y + (point.y - anchor.y) * sy,
  });

  return points.map((point) => ({
    ...transform(point),
    handleIn: point.handleIn ? transform(point.handleIn) : undefined,
    handleOut: point.handleOut ? transform(point.handleOut) : undefined,
  }));
}

export function clonePathPoints(points: PathPoint[]): PathPoint[] {
  return points.map((point) => ({
    x: point.x,
    y: point.y,
    handleIn: point.handleIn ? { ...point.handleIn } : undefined,
    handleOut: point.handleOut ? { ...point.handleOut } : undefined,
  }));
}

export function normalizeVectorNode(node: VectorNode): VectorNode {
  const padding = node.strokeWidth / 2;
  const bounds = pathGeometryBounds(node.points, node.closed, padding);
  if (!bounds) return node;

  const translate = (point: { x: number; y: number }) => ({
    x: point.x - bounds.x,
    y: point.y - bounds.y,
  });

  return {
    ...node,
    x: node.x + bounds.x,
    y: node.y + bounds.y,
    width: bounds.width,
    height: bounds.height,
    points: node.points.map((point) => ({
      ...translate(point),
      handleIn: point.handleIn ? translate(point.handleIn) : undefined,
      handleOut: point.handleOut ? translate(point.handleOut) : undefined,
    })),
  };
}
