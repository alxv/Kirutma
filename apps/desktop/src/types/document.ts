export type SceneNodeType =
  | "page"
  | "frame"
  | "group"
  | "rectangle"
  | "ellipse"
  | "polygon"
  | "star"
  | "vector"
  | "image"
  | "line"
  | "text"
  | "instance";

export interface PathPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface DropShadowEffect {
  enabled: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface VectorEffects {
  dropShadow?: DropShadowEffect;
}

export type TextAlign = "left" | "center" | "right";

export type LineStyle = "straight" | "curved";
export type LineDash = "solid" | "dashed" | "dotted";
export type LineEndpointStyle =
  | "none"
  | "arrow"
  | "triangle"
  | "circle"
  | "diamond"
  | "square"
  | "bar";

export interface FillGradient {
  start: string;
  end: string;
  angle: number;
}

export interface SceneNodeBase {
  id: string;
  name: string;
  type: SceneNodeType;
  parentId: string | null;
  visible: boolean;
  locked: boolean;
  sortOrder: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  /** Links fill/stroke to a local color style. */
  colorStyleId?: string;
  /** Marks this node as a component master on canvas. */
  componentId?: string;
}

export interface GroupNode extends SceneNodeBase {
  type: "group";
  width: number;
  height: number;
}

export interface FrameNode extends SceneNodeBase {
  type: "frame";
  width: number;
  height: number;
  fill: string;
  fillGradient?: FillGradient;
  effects?: VectorEffects;
}

export interface RectangleNode extends SceneNodeBase {
  type: "rectangle";
  width: number;
  height: number;
  fill: string;
  fillGradient?: FillGradient;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  effects?: VectorEffects;
}

export interface EllipseNode extends SceneNodeBase {
  type: "ellipse";
  width: number;
  height: number;
  fill: string;
  fillGradient?: FillGradient;
  stroke: string;
  strokeWidth: number;
  effects?: VectorEffects;
}

export interface PolygonNode extends SceneNodeBase {
  type: "polygon";
  width: number;
  height: number;
  sides: number;
  fill: string;
  fillGradient?: FillGradient;
  stroke: string;
  strokeWidth: number;
  effects?: VectorEffects;
}

export interface StarNode extends SceneNodeBase {
  type: "star";
  width: number;
  height: number;
  points: number;
  innerRadiusRatio: number;
  fill: string;
  fillGradient?: FillGradient;
  stroke: string;
  strokeWidth: number;
  effects?: VectorEffects;
}

export interface VectorNode extends SceneNodeBase {
  type: "vector";
  width: number;
  height: number;
  points: PathPoint[];
  closed: boolean;
  fill: string;
  fillGradient?: FillGradient;
  stroke: string;
  strokeWidth: number;
  effects?: VectorEffects;
}

export interface ImageNode extends SceneNodeBase {
  type: "image";
  width: number;
  height: number;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

export interface LineNode extends SceneNodeBase {
  type: "line";
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  lineStyle?: LineStyle;
  lineDash?: LineDash;
  startEndpoint?: LineEndpointStyle;
  endEndpoint?: LineEndpointStyle;
  curveOffsetX?: number;
  curveOffsetY?: number;
  /** When set, start point snaps to this shape's boundary. */
  startAnchor?: string;
  /** When set, end point snaps to this shape's boundary. */
  endAnchor?: string;
}

export interface TextNode extends SceneNodeBase {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  textAlign: TextAlign;
  lineHeight: number;
  fill: string;
  width: number;
  textStyleId?: string;
}

export interface InstanceNode extends SceneNodeBase {
  type: "instance";
  componentId: string;
  width: number;
  height: number;
  overrides: Record<string, Partial<SceneNode>>;
}

export interface PageNode extends SceneNodeBase {
  type: "page";
}

export type SceneNode =
  | PageNode
  | FrameNode
  | GroupNode
  | RectangleNode
  | PolygonNode
  | StarNode
  | VectorNode
  | ImageNode
  | EllipseNode
  | LineNode
  | TextNode
  | InstanceNode;

export type ShapeNode =
  | FrameNode
  | GroupNode
  | RectangleNode
  | PolygonNode
  | StarNode
  | VectorNode
  | ImageNode
  | EllipseNode
  | LineNode
  | TextNode
  | InstanceNode;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface DraftShape {
  kind: "frame" | "rectangle" | "ellipse" | "triangle" | "polygon" | "star" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  x2?: number;
  y2?: number;
}

export const FONT_FAMILIES = [
  "Inter, sans-serif",
  "-apple-system, BlinkMacSystemFont, sans-serif",
  "Georgia, serif",
  "Menlo, monospace",
] as const;

export function isShapeNode(node: SceneNode): node is ShapeNode {
  return node.type !== "page";
}

export function nodeLabel(type: SceneNodeType): string {
  switch (type) {
    case "frame":
      return "Frame";
    case "group":
      return "Group";
    case "rectangle":
      return "Rectangle";
    case "polygon":
      return "Polygon";
    case "star":
      return "Star";
    case "vector":
      return "Vector";
    case "image":
      return "Image";
    case "ellipse":
      return "Ellipse";
    case "line":
      return "Line";
    case "text":
      return "Text";
    case "instance":
      return "Instance";
    default:
      return "Page";
  }
}

/** Ensure legacy documents get sortOrder and text defaults. */
export function normalizeNodes(nodes: Record<string, SceneNode>): Record<string, SceneNode> {
  const next: Record<string, SceneNode> = {};
  let order = 0;

  for (const node of Object.values(nodes)) {
    const base = {
      ...node,
      sortOrder: node.sortOrder ?? order++,
    };

    if (base.type === "text") {
      next[base.id] = {
        ...base,
        fontFamily: base.fontFamily ?? FONT_FAMILIES[0],
        fontWeight: base.fontWeight ?? 400,
        textAlign: base.textAlign ?? "left",
        lineHeight: base.lineHeight ?? 1.2,
      };
    } else if (base.type === "polygon") {
      next[base.id] = {
        ...base,
        sides: base.sides ?? 3,
      };
    } else if (base.type === "star") {
      next[base.id] = {
        ...base,
        points: base.points ?? 5,
        innerRadiusRatio: base.innerRadiusRatio ?? 0.38,
      };
    } else if (base.type === "line") {
      next[base.id] = {
        ...base,
        lineStyle: base.lineStyle ?? "straight",
        lineDash: base.lineDash ?? "solid",
        startEndpoint: base.startEndpoint ?? "none",
        endEndpoint: base.endEndpoint ?? "none",
      };
    } else if (base.type === "vector") {
      next[base.id] = {
        ...base,
        closed: base.closed ?? false,
        fill: base.fill ?? "#0D99FF",
        stroke: base.stroke ?? "#000000",
        strokeWidth: base.strokeWidth ?? 2,
        points: base.points ?? [],
      };
    } else if (base.type === "image") {
      next[base.id] = {
        ...base,
        naturalWidth: base.naturalWidth ?? base.width,
        naturalHeight: base.naturalHeight ?? base.height,
        src: base.src ?? "",
      };
    } else {
      next[base.id] = base;
    }
  }

  return next;
}
