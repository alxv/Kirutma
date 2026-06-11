import type { ColorStyle, ComponentDefinition, DesignSystemState, TextStyle } from "@/types/design-system";
import { resolveLineNode } from "@/canvas/lines";
import type { SceneNode } from "@/types/document";

function applyColorStyle(node: SceneNode, styles: Record<string, ColorStyle>): SceneNode {
  if (!node.colorStyleId) return node;
  const style = styles[node.colorStyleId];
  if (!style) return node;

  if ("fill" in node) {
    return { ...node, fill: style.color } as SceneNode;
  }
  if ("stroke" in node) {
    return { ...node, stroke: style.color } as SceneNode;
  }
  return node;
}

function applyTextStyle(node: SceneNode, styles: Record<string, TextStyle>): SceneNode {
  if (node.type !== "text" || !node.textStyleId) return node;
  const style = styles[node.textStyleId];
  if (!style) return node;
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

function applyStyles(node: SceneNode, design: DesignSystemState): SceneNode {
  return applyTextStyle(applyColorStyle(node, design.colorStyles), design.textStyles);
}

function offsetNode(node: SceneNode, dx: number, dy: number, parentId: string | null): SceneNode {
  const next = {
    ...node,
    parentId,
    x: node.x + dx,
    y: node.y + dy,
  } as SceneNode;
  if (next.type === "line") {
    return { ...next, x2: next.x2 + dx, y2: next.y2 + dy };
  }
  return next;
}

function expandComponentNodes(
  component: ComponentDefinition,
  instance: Extract<SceneNode, { type: "instance" }>,
  design: DesignSystemState,
): SceneNode[] {
  const root = component.nodes[component.rootNodeId];
  if (!root) return [];

  const dx = instance.x - root.x;
  const dy = instance.y - root.y;
  const result: SceneNode[] = [];

  const walk = (nodeId: string, parentId: string | null) => {
    const source = component.nodes[nodeId];
    if (!source || !source.visible) return;

    const override = instance.overrides[nodeId] ?? {};
    let resolved = applyStyles({ ...source, ...override } as SceneNode, design);
    resolved = offsetNode(resolved, dx, dy, parentId);

    result.push(resolved);
    for (const child of Object.values(component.nodes).filter((n) => n.parentId === nodeId)) {
      walk(child.id, nodeId);
    }
  };

  walk(component.rootNodeId, instance.parentId);
  return result;
}

/** Flatten scene graph for rendering/hit-testing, expanding component instances. */
export function getResolvedDrawableNodes(
  nodes: Record<string, SceneNode>,
  design: DesignSystemState,
  pageId?: string,
): SceneNode[] {
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
      if (child.type === "instance") {
        const component = design.components[child.componentId];
        if (component) {
          result.push(...expandComponentNodes(component, child, design));
        }
        continue;
      }

      result.push(applyStyles(child, design));
      if (child.type === "frame" || child.type === "group") {
        walk(child.id);
      }
    }
  };

  walk(page.id);
  return result.map((node) => (node.type === "line" ? resolveLineNode(node, nodes) : node));
}

export function collectSubtree(nodeId: string, nodes: Record<string, SceneNode>): Record<string, SceneNode> {
  const subtree: Record<string, SceneNode> = {};
  const walk = (id: string) => {
    const node = nodes[id];
    if (!node) return;
    subtree[id] = structuredClone(node);
    for (const child of Object.values(nodes).filter((n) => n.parentId === id)) {
      walk(child.id);
    }
  };
  walk(nodeId);
  return subtree;
}

export function syncComponentFromMaster(
  componentId: string,
  nodes: Record<string, SceneNode>,
  components: Record<string, ComponentDefinition>,
): Record<string, ComponentDefinition> {
  const component = components[componentId];
  if (!component) return components;

  const master = Object.values(nodes).find((node) => node.componentId === componentId);
  if (!master) return components;

  const subtree = collectSubtree(master.id, nodes);
  const root = subtree[master.id];
  if (!root || !("width" in root) || !("height" in root)) return components;

  return {
    ...components,
    [componentId]: {
      ...component,
      name: master.name,
      rootNodeId: master.id,
      width: root.width,
      height: root.height,
      nodes: subtree,
    },
  };
}
