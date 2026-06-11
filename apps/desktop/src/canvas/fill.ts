import type { FillGradient } from "@/types/document";

export function setCanvasFill(
  ctx: CanvasRenderingContext2D,
  fill: string,
  gradient: FillGradient | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (gradient) {
    const angle = (gradient.angle * Math.PI) / 180;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const len = Math.max(width, height) / 2;
    const x1 = cx - Math.cos(angle) * len;
    const y1 = cy - Math.sin(angle) * len;
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, gradient.start);
    g.addColorStop(1, gradient.end);
    ctx.fillStyle = g;
    return;
  }
  ctx.fillStyle = fill;
}
