import type { Camera, SceneNode } from "@/types/document";
import { worldToScreen } from "@/canvas/geometry";

export function renderTextOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: Camera,
  nodes: SceneNode[],
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  for (const node of nodes) {
    if (node.type !== "text" || !node.visible) continue;
    drawTextNode(ctx, node);
  }

  ctx.restore();
}

function drawTextNode(ctx: CanvasRenderingContext2D, node: Extract<SceneNode, { type: "text" }>) {
  ctx.save();
  if (node.rotation !== 0) {
    const cx = node.x + node.width / 2;
    const cy = node.y + (node.fontSize * node.lineHeight) / 2;
    ctx.translate(cx, cy);
    ctx.rotate((node.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  ctx.globalAlpha = node.opacity;
  ctx.fillStyle = node.fill;
  ctx.font = `${node.fontWeight} ${node.fontSize}px ${node.fontFamily}`;
  ctx.textBaseline = "top";
  ctx.textAlign = node.textAlign;

  let drawX = node.x;
  if (node.textAlign === "center") drawX = node.x + node.width / 2;
  if (node.textAlign === "right") drawX = node.x + node.width;

  const lines = node.text.split("\n");
  const lineHeightPx = node.fontSize * node.lineHeight;
  lines.forEach((line, index) => {
    ctx.fillText(line, drawX, node.y + index * lineHeightPx);
  });
  ctx.restore();
}

export function screenPointForText(node: SceneNode, camera: Camera) {
  return worldToScreen({ x: node.x, y: node.y }, camera);
}
