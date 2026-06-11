import type { PathPoint } from "@/types/document";

type LucideElement = [string, Record<string, string>];

export interface SymbolPathDef {
  d: string;
  closed: boolean;
}

export function lucideNodeToPaths(node: LucideElement[]): SymbolPathDef[] {
  const paths: SymbolPathDef[] = [];

  for (const [type, attrs] of node) {
    if (type === "path" && attrs.d) {
      paths.push({
        d: attrs.d,
        closed: /z/i.test(attrs.d),
      });
    } else if (type === "circle" && attrs.cx && attrs.cy && attrs.r) {
      const cx = Number.parseFloat(attrs.cx);
      const cy = Number.parseFloat(attrs.cy);
      const r = Number.parseFloat(attrs.r);
      paths.push({ d: circleToPath(cx, cy, r), closed: true });
    } else if (type === "rect" && attrs.x && attrs.y && attrs.width && attrs.height) {
      const x = Number.parseFloat(attrs.x);
      const y = Number.parseFloat(attrs.y);
      const w = Number.parseFloat(attrs.width);
      const h = Number.parseFloat(attrs.height);
      paths.push({ d: `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`, closed: true });
    } else if (type === "line" && attrs.x1 && attrs.y1 && attrs.x2 && attrs.y2) {
      paths.push({
        d: `M ${attrs.x1} ${attrs.y1} L ${attrs.x2} ${attrs.y2}`,
        closed: false,
      });
    }
  }

  return paths;
}

function circleToPath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

/** Sample an SVG path into editable points (browser only). */
export function svgPathToPathPoints(d: string, sampleDistance = 1.25): PathPoint[] {
  if (typeof document === "undefined") return [];

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  const total = path.getTotalLength();
  if (!Number.isFinite(total) || total === 0) return [];

  const steps = Math.max(8, Math.ceil(total / sampleDistance));
  const points: PathPoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const pt = path.getPointAtLength((total * i) / steps);
    points.push({ x: pt.x, y: pt.y });
  }
  return points;
}

export function transformPathPoints(
  points: PathPoint[],
  scale: number,
  offsetX: number,
  offsetY: number,
): PathPoint[] {
  return points.map((point) => ({
    x: point.x * scale + offsetX,
    y: point.y * scale + offsetY,
  }));
}

export function boundsOfPathPoints(points: PathPoint[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  if (points.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}
