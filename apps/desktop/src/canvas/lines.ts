import { getNodeBounds, type Point } from "@/canvas/geometry";
import type { LineDash, LineEndpointStyle, LineNode, LineStyle, SceneNode } from "@/types/document";

const CONNECTABLE_TYPES = new Set<SceneNode["type"]>([
  "frame",
  "rectangle",
  "ellipse",
  "polygon",
  "star",
  "vector",
  "group",
  "instance",
]);

export function isConnectableShape(node: SceneNode): boolean {
  return CONNECTABLE_TYPES.has(node.type);
}

function shapeCenter(node: SceneNode): Point {
  const bounds = getNodeBounds(node);
  if (!bounds) return { x: node.x, y: node.y };
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

function toLocal(node: SceneNode, point: Point): Point {
  if (node.rotation === 0) return point;
  const center = shapeCenter(node);
  const radians = (-node.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function toWorld(node: SceneNode, point: Point): Point {
  if (node.rotation === 0) return point;
  const center = shapeCenter(node);
  const radians = (node.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function boundaryPointUnrotated(node: SceneNode, target: Point): Point {
  const bounds = getNodeBounds(node);
  if (!bounds) return target;

  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;

  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    return { x: cx, y: bounds.y };
  }

  if (node.type === "ellipse") {
    const rx = Math.abs(bounds.width / 2) || 1;
    const ry = Math.abs(bounds.height / 2) || 1;
    const scale = 1 / Math.hypot(dx / rx, dy / ry);
    return { x: cx + dx * scale, y: cy + dy * scale };
  }

  const hw = bounds.width / 2;
  const hh = bounds.height / 2;
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

/** Point on shape boundary facing toward `target` (world space). */
export function boundaryPointToward(node: SceneNode, target: Point): Point {
  const localTarget = toLocal(node, target);
  const localPoint = boundaryPointUnrotated(node, localTarget);
  return toWorld(node, localPoint);
}

/** Max distance (document px) from a shape edge before a line endpoint attaches. */
export const LINE_CONNECT_THRESHOLD = 16;

function shapeArea(node: SceneNode): number {
  const bounds = getNodeBounds(node);
  if (!bounds) return Infinity;
  return Math.abs(bounds.width * bounds.height);
}

function distanceToShapeBoundary(node: SceneNode, point: Point): number {
  const boundary = boundaryPointToward(node, point);
  return Math.hypot(point.x - boundary.x, point.y - boundary.y);
}

/** Nearest connectable shape whose boundary is within `threshold` of `point`. */
export function findConnectableAt(
  point: Point,
  nodes: SceneNode[],
  excludeId?: string,
  threshold = LINE_CONNECT_THRESHOLD,
): SceneNode | null {
  let best: SceneNode | null = null;
  let bestDistance = threshold + 1;
  let bestArea = Infinity;

  for (const node of nodes) {
    if (node.id === excludeId || !node.visible || node.locked || !isConnectableShape(node)) continue;
    const bounds = getNodeBounds(node);
    if (!bounds) continue;

    const distance = distanceToShapeBoundary(node, point);
    if (distance > threshold) continue;

    const area = shapeArea(node);
    if (distance < bestDistance - 0.01 || (Math.abs(distance - bestDistance) <= 0.01 && area < bestArea)) {
      best = node;
      bestDistance = distance;
      bestArea = area;
    }
  }

  return best;
}

function findConnectableForEndpoint(
  point: Point,
  candidates: SceneNode[],
  existingAnchorId: string | undefined,
  excludeId: string | undefined,
  threshold: number,
  nodes: Record<string, SceneNode>,
): SceneNode | null {
  if (existingAnchorId) {
    const existing = nodes[existingAnchorId];
    if (existing && isConnectableShape(existing) && existing.visible && !existing.locked) {
      const distance = distanceToShapeBoundary(existing, point);
      if (distance <= threshold * 2) return existing;
    }
  }
  return findConnectableAt(point, candidates, excludeId, threshold);
}

export function resolveLineEndpoints(
  line: LineNode,
  nodes: Record<string, SceneNode>,
): Pick<LineNode, "x" | "y" | "x2" | "y2"> {
  let { x, y, x2, y2 } = line;
  const startNode = line.startAnchor ? nodes[line.startAnchor] : undefined;
  const endNode = line.endAnchor ? nodes[line.endAnchor] : undefined;

  if (startNode && endNode) {
    const start = boundaryPointToward(startNode, shapeCenter(endNode));
    const end = boundaryPointToward(endNode, start);
    const refinedStart = boundaryPointToward(startNode, end);
    return { x: refinedStart.x, y: refinedStart.y, x2: end.x, y2: end.y };
  }

  if (startNode) {
    const p = boundaryPointToward(startNode, { x: x2, y: y2 });
    x = p.x;
    y = p.y;
  }
  if (endNode) {
    const p = boundaryPointToward(endNode, { x, y });
    x2 = p.x;
    y2 = p.y;
  }

  return { x, y, x2, y2 };
}

export function resolveLineNode(line: LineNode, nodes: Record<string, SceneNode>): LineNode {
  return { ...line, ...resolveLineEndpoints(line, nodes) };
}

export interface LineEndpointsInput {
  x: number;
  y: number;
  x2: number;
  y2: number;
  startAnchor?: string;
  endAnchor?: string;
}

export function computeLineConnection(
  start: Point,
  end: Point,
  nodes: Record<string, SceneNode>,
  candidates: SceneNode[],
  threshold = LINE_CONNECT_THRESHOLD,
): LineEndpointsInput {
  const startShape = findConnectableAt(start, candidates, undefined, threshold);
  const endShape = findConnectableAt(end, candidates, undefined, threshold);

  let startAnchor = startShape?.id;
  let endAnchor = endShape?.id;

  if (startShape && endShape && startShape.id === endShape.id) {
    startAnchor = undefined;
    endAnchor = undefined;
  }

  const draft: LineNode = {
    id: "draft",
    name: "Line",
    type: "line",
    parentId: null,
    visible: true,
    locked: false,
    sortOrder: 0,
    x: start.x,
    y: start.y,
    x2: end.x,
    y2: end.y,
    rotation: 0,
    opacity: 1,
    stroke: "#000000",
    strokeWidth: 2,
    startAnchor,
    endAnchor,
  };

  const resolved = resolveLineEndpoints(draft, nodes);
  return { ...resolved, startAnchor, endAnchor };
}

/** Move one line endpoint; only the dragged end re-attaches to nearby shapes. */
export function adjustLineEndpoint(
  line: LineNode,
  endpoint: "start" | "end",
  point: Point,
  nodes: Record<string, SceneNode>,
  candidates: SceneNode[],
  threshold = LINE_CONNECT_THRESHOLD,
): Partial<LineNode> {
  const resolved = resolveLineEndpoints(line, nodes);
  let { x, y, x2, y2 } = resolved;
  let startAnchor = line.startAnchor;
  let endAnchor = line.endAnchor;

  if (endpoint === "start") {
    const shape = findConnectableForEndpoint(point, candidates, line.startAnchor, line.id, threshold, nodes);
    if (shape) {
      startAnchor = shape.id;
      if (endAnchor === shape.id) endAnchor = undefined;
      const snapped = boundaryPointToward(shape, point);
      x = snapped.x;
      y = snapped.y;
    } else {
      startAnchor = undefined;
      x = point.x;
      y = point.y;
    }
  } else {
    const shape = findConnectableForEndpoint(point, candidates, line.endAnchor, line.id, threshold, nodes);
    if (shape) {
      endAnchor = shape.id;
      if (startAnchor === shape.id) startAnchor = undefined;
      const snapped = boundaryPointToward(shape, point);
      x2 = snapped.x;
      y2 = snapped.y;
    } else {
      endAnchor = undefined;
      x2 = point.x;
      y2 = point.y;
    }
  }

  const draft: LineNode = { ...line, x, y, x2, y2, startAnchor, endAnchor };
  const finalEndpoints = resolveLineEndpoints(draft, nodes);
  return { ...finalEndpoints, startAnchor, endAnchor };
}

export function curveControlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  offsetX = 0,
  offsetY = 0,
): Point {
  const mx = (x1 + x2) / 2 + offsetX;
  const my = (y1 + y2) / 2 + offsetY;
  if (offsetX !== 0 || offsetY !== 0) return { x: mx, y: my };

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(len * 0.22, 120);
  return { x: mx + (-dy / len) * bend, y: my + (dx / len) * bend };
}

export function applyLineDash(ctx: CanvasRenderingContext2D, dash: LineDash | undefined) {
  switch (dash) {
    case "dashed":
      ctx.setLineDash([10, 6]);
      break;
    case "dotted":
      ctx.setLineDash([2, 6]);
      break;
    default:
      ctx.setLineDash([]);
      break;
  }
}

export function strokeLinePath(
  ctx: CanvasRenderingContext2D,
  line: Pick<LineNode, "x" | "y" | "x2" | "y2" | "lineStyle" | "curveOffsetX" | "curveOffsetY">,
) {
  const { x, y, x2, y2 } = line;
  ctx.beginPath();
  ctx.moveTo(x, y);
  if (line.lineStyle === "curved") {
    const cp = curveControlPoint(x, y, x2, y2, line.curveOffsetX ?? 0, line.curveOffsetY ?? 0);
    ctx.quadraticCurveTo(cp.x, cp.y, x2, y2);
  } else {
    ctx.lineTo(x2, y2);
  }
}

export function distanceToLineNode(line: LineNode, point: Point): number {
  const { x, y, x2, y2 } = line;
  if (line.lineStyle === "curved") {
    const cp = curveControlPoint(x, y, x2, y2, line.curveOffsetX ?? 0, line.curveOffsetY ?? 0);
    let best = Infinity;
    let prev = { x, y };
    for (let i = 1; i <= 24; i += 1) {
      const t = i / 24;
      const inv = 1 - t;
      const sample = {
        x: inv * inv * x + 2 * inv * t * cp.x + t * t * x2,
        y: inv * inv * y + 2 * inv * t * cp.y + t * t * y2,
      };
      best = Math.min(best, distanceToSegment(point, prev, sample));
      prev = sample;
    }
    return best;
  }
  return distanceToSegment(point, { x, y }, { x: x2, y: y2 });
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

export function lineDashPattern(dash: LineDash | undefined): string | undefined {
  switch (dash) {
    case "dashed":
      return "10 6";
    case "dotted":
      return "2 6";
    default:
      return undefined;
  }
}

export function lineStyleLabel(style: LineStyle): string {
  return style === "curved" ? "Curved" : "Straight";
}

export function lineDashLabel(dash: LineDash): string {
  switch (dash) {
    case "dashed":
      return "Dashed";
    case "dotted":
      return "Dotted";
    default:
      return "Solid";
  }
}

export const LINE_ENDPOINT_OPTIONS: { value: LineEndpointStyle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "arrow", label: "Arrow" },
  { value: "triangle", label: "Triangle" },
  { value: "circle", label: "Round" },
  { value: "diamond", label: "Diamond" },
  { value: "square", label: "Square" },
  { value: "bar", label: "Bar" },
];

export function lineEndpointLabel(style: LineEndpointStyle): string {
  return LINE_ENDPOINT_OPTIONS.find((option) => option.value === style)?.label ?? "None";
}

function endpointMetrics(strokeWidth: number) {
  return {
    length: Math.max(strokeWidth * 4, 10),
    width: Math.max(strokeWidth * 3, 7),
    radius: Math.max(strokeWidth * 1.35, 4),
  };
}

/** Outward angle at the start point (away from the line body). */
export function lineOutwardAngleAtStart(
  line: Pick<LineNode, "x" | "y" | "x2" | "y2" | "lineStyle" | "curveOffsetX" | "curveOffsetY">,
): number {
  const { x, y, x2, y2 } = line;
  if (line.lineStyle === "curved") {
    const cp = curveControlPoint(x, y, x2, y2, line.curveOffsetX ?? 0, line.curveOffsetY ?? 0);
    return Math.atan2(y - cp.y, x - cp.x);
  }
  return Math.atan2(y - y2, x - x2);
}

/** Outward angle at the end point (away from the line body). */
export function lineOutwardAngleAtEnd(
  line: Pick<LineNode, "x" | "y" | "x2" | "y2" | "lineStyle" | "curveOffsetX" | "curveOffsetY">,
): number {
  const { x, y, x2, y2 } = line;
  if (line.lineStyle === "curved") {
    const cp = curveControlPoint(x, y, x2, y2, line.curveOffsetX ?? 0, line.curveOffsetY ?? 0);
    return Math.atan2(y2 - cp.y, x2 - cp.x);
  }
  return Math.atan2(y2 - y, x2 - x);
}

function drawLineEndpointMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  style: LineEndpointStyle,
  stroke: string,
  strokeWidth: number,
) {
  if (style === "none") return;

  const { length, width, radius } = endpointMetrics(strokeWidth);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const px = -sin;
  const py = cos;

  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  switch (style) {
    case "circle":
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "square": {
      const half = width / 2;
      ctx.beginPath();
      ctx.moveTo(x + half * px, y + half * py);
      ctx.lineTo(x + half * px - length * cos, y + half * py - length * sin);
      ctx.lineTo(x - half * px - length * cos, y - half * py - length * sin);
      ctx.lineTo(x - half * px, y - half * py);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "diamond": {
      const half = width / 2;
      const midX = x - (length / 2) * cos;
      const midY = y - (length / 2) * sin;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(midX + half * px, midY + half * py);
      ctx.lineTo(x - length * cos, y - length * sin);
      ctx.lineTo(midX - half * px, midY - half * py);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "bar": {
      const half = width / 2;
      ctx.beginPath();
      ctx.moveTo(x + half * px, y + half * py);
      ctx.lineTo(x - half * px, y - half * py);
      ctx.stroke();
      break;
    }
    case "triangle":
    case "arrow": {
      const baseX = x - length * cos;
      const baseY = y - length * sin;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(baseX + (width / 2) * px, baseY + (width / 2) * py);
      ctx.lineTo(baseX - (width / 2) * px, baseY - (width / 2) * py);
      ctx.closePath();
      if (style === "arrow") ctx.fill();
      else ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function drawLineEndpoints(
  ctx: CanvasRenderingContext2D,
  line: Pick<
    LineNode,
    | "x"
    | "y"
    | "x2"
    | "y2"
    | "lineStyle"
    | "curveOffsetX"
    | "curveOffsetY"
    | "stroke"
    | "strokeWidth"
    | "startEndpoint"
    | "endEndpoint"
  >,
) {
  const startStyle = line.startEndpoint ?? "none";
  const endStyle = line.endEndpoint ?? "none";
  if (startStyle === "none" && endStyle === "none") return;

  if (startStyle !== "none") {
    drawLineEndpointMarker(
      ctx,
      line.x,
      line.y,
      lineOutwardAngleAtStart(line),
      startStyle,
      line.stroke,
      line.strokeWidth,
    );
  }
  if (endStyle !== "none") {
    drawLineEndpointMarker(
      ctx,
      line.x2,
      line.y2,
      lineOutwardAngleAtEnd(line),
      endStyle,
      line.stroke,
      line.strokeWidth,
    );
  }
}

export function lineEndpointSvg(
  x: number,
  y: number,
  angle: number,
  style: LineEndpointStyle,
  stroke: string,
  strokeWidth: number,
): string {
  if (style === "none") return "";

  const { length, width, radius } = endpointMetrics(strokeWidth);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const px = -sin;
  const py = cos;

  switch (style) {
    case "circle":
      return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${stroke}"/>`;
    case "square": {
      const half = width / 2;
      const points = [
        [x + half * px, y + half * py],
        [x + half * px - length * cos, y + half * py - length * sin],
        [x - half * px - length * cos, y - half * py - length * sin],
        [x - half * px, y - half * py],
      ];
      return `<polygon points="${points.map(([px, py]) => `${px},${py}`).join(" ")}" fill="${stroke}"/>`;
    }
    case "diamond": {
      const half = width / 2;
      const midX = x - (length / 2) * cos;
      const midY = y - (length / 2) * sin;
      const points = [
        [x, y],
        [midX + half * px, midY + half * py],
        [x - length * cos, y - length * sin],
        [midX - half * px, midY - half * py],
      ];
      return `<polygon points="${points.map(([px, py]) => `${px},${py}`).join(" ")}" fill="${stroke}"/>`;
    }
    case "bar": {
      const half = width / 2;
      return `<line x1="${x + half * px}" y1="${y + half * py}" x2="${x - half * px}" y2="${y - half * py}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
    }
    case "triangle":
    case "arrow": {
      const baseX = x - length * cos;
      const baseY = y - length * sin;
      const points = [
        [x, y],
        [baseX + (width / 2) * px, baseY + (width / 2) * py],
        [baseX - (width / 2) * px, baseY - (width / 2) * py],
      ];
      const attrs =
        style === "arrow"
          ? `fill="${stroke}"`
          : `fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"`;
      return `<polygon points="${points.map(([px, py]) => `${px},${py}`).join(" ")}" ${attrs}/>`;
    }
    default:
      return "";
  }
}
