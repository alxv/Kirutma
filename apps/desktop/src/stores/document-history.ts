import type { ColorStyle, ComponentDefinition, DesignSystemState, TextStyle } from "@/types/design-system";
import type { SceneNode } from "@/types/document";

export interface DocumentSnapshot {
  nodes: Record<string, SceneNode>;
  selectedIds: string[];
  colorStyles: Record<string, ColorStyle>;
  textStyles: Record<string, TextStyle>;
  components: Record<string, ComponentDefinition>;
}

export function cloneSnapshot(
  nodes: Record<string, SceneNode>,
  selectedIds: string[],
  design: DesignSystemState,
): DocumentSnapshot {
  return {
    nodes: structuredClone(nodes),
    selectedIds: [...selectedIds],
    colorStyles: structuredClone(design.colorStyles),
    textStyles: structuredClone(design.textStyles),
    components: structuredClone(design.components),
  };
}
