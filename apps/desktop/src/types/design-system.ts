import type { SceneNode, TextAlign } from "@/types/document";

export interface ColorStyle {
  id: string;
  name: string;
  color: string;
}

export interface TextStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  textAlign: TextAlign;
  fill: string;
}

/** Snapshot of a component subtree (node ids are stable within the component). */
export interface ComponentDefinition {
  id: string;
  name: string;
  rootNodeId: string;
  width: number;
  height: number;
  nodes: Record<string, SceneNode>;
}

/** Partial property overrides keyed by internal component node id. */
export type InstanceOverrides = Record<string, Partial<SceneNode>>;

export interface DesignSystemState {
  colorStyles: Record<string, ColorStyle>;
  textStyles: Record<string, TextStyle>;
  components: Record<string, ComponentDefinition>;
}

export const DEFAULT_COLOR_STYLES: ColorStyle[] = [
  { id: "color-primary", name: "Primary", color: "#0D99FF" },
  { id: "color-surface", name: "Surface", color: "#FFFFFF" },
  { id: "color-text", name: "Text", color: "#1E1E1E" },
  { id: "color-muted", name: "Muted", color: "#8E8E8E" },
];

export const DEFAULT_TEXT_STYLES: TextStyle[] = [
  {
    id: "text-heading",
    name: "Heading",
    fontFamily: "Inter, sans-serif",
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.2,
    textAlign: "left",
    fill: "#000000",
  },
  {
    id: "text-body",
    name: "Body",
    fontFamily: "Inter, sans-serif",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.4,
    textAlign: "left",
    fill: "#000000",
  },
  {
    id: "text-caption",
    name: "Caption",
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.3,
    textAlign: "left",
    fill: "#666666",
  },
];

export function defaultDesignSystem(): DesignSystemState {
  return {
    colorStyles: Object.fromEntries(DEFAULT_COLOR_STYLES.map((style) => [style.id, style])),
    textStyles: Object.fromEntries(DEFAULT_TEXT_STYLES.map((style) => [style.id, style])),
    components: {},
  };
}
