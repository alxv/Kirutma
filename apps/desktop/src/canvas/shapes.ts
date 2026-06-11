import type { Point } from "@/canvas/geometry";

export function regularPolygonVertices(
  x: number,
  y: number,
  width: number,
  height: number,
  sides: number,
): Point[] {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = Math.abs(width / 2);
  const ry = Math.abs(height / 2);
  const count = Math.max(3, Math.round(sides));
  const startAngle = -Math.PI / 2;
  const vertices: Point[] = [];

  for (let i = 0; i < count; i += 1) {
    const angle = startAngle + (i * 2 * Math.PI) / count;
    vertices.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
  }

  return vertices;
}

export function starVertices(
  x: number,
  y: number,
  width: number,
  height: number,
  points: number,
  innerRadiusRatio: number,
): Point[] {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const outerRx = Math.abs(width / 2);
  const outerRy = Math.abs(height / 2);
  const innerRx = outerRx * innerRadiusRatio;
  const innerRy = outerRy * innerRadiusRatio;
  const count = Math.max(3, Math.round(points));
  const startAngle = -Math.PI / 2;
  const vertices: Point[] = [];

  for (let i = 0; i < count * 2; i += 1) {
    const angle = startAngle + (i * Math.PI) / count;
    const isOuter = i % 2 === 0;
    vertices.push({
      x: cx + (isOuter ? outerRx : innerRx) * Math.cos(angle),
      y: cy + (isOuter ? outerRy : innerRy) * Math.sin(angle),
    });
  }

  return vertices;
}

export function traceVertexPath(ctx: CanvasRenderingContext2D, vertices: Point[]) {
  if (vertices.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i += 1) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();
}

export function pointInPolygon(point: Point, vertices: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonPointsAttr(vertices: Point[]): string {
  return vertices.map((vertex) => `${vertex.x},${vertex.y}`).join(" ");
}
