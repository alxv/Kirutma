import { renderScene } from "@/canvas/renderer";
import type { Camera, SceneNode } from "@/types/document";

export function exportNodesToPng(nodes: SceneNode[], scale = 2): string {
  const bounds = nodes.reduce(
    (acc, node) => {
      if (node.type === "page") return acc;
      let minX = acc.minX;
      let minY = acc.minY;
      let maxX = acc.maxX;
      let maxY = acc.maxY;

      if (node.type === "line") {
        minX = Math.min(minX, node.x, node.x2);
        minY = Math.min(minY, node.y, node.y2);
        maxX = Math.max(maxX, node.x, node.x2);
        maxY = Math.max(maxY, node.y, node.y2);
      } else if (node.type === "text") {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.fontSize * 1.4);
      } else {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
      }
      return { minX, minY, maxX, maxY };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  if (!Number.isFinite(bounds.minX)) {
    throw new Error("Nothing to export");
  }

  const padding = 40;
  const width = Math.ceil(bounds.maxX - bounds.minX + padding * 2);
  const height = Math.ceil(bounds.maxY - bounds.minY + padding * 2);

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create export canvas");

  const exportCamera: Camera = {
    x: padding - bounds.minX,
    y: padding - bounds.minY,
    zoom: scale,
  };

  renderScene(ctx, width, height, exportCamera, nodes, [], null, false);
  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
