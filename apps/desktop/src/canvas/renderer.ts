import type { Camera, DraftShape, DropShadowEffect, SceneNode } from "@/types/document";
import { setCanvasFill } from "@/canvas/fill";
import { getCachedImage, preloadImage } from "@/canvas/image-cache";
import { applyLineDash, drawLineEndpoints, strokeLinePath } from "@/canvas/lines";
import { regularPolygonVertices, starVertices, traceVertexPath } from "@/canvas/shapes";
import { getNodeBounds, type SnapGuide } from "@/canvas/geometry";
import { drawSelectionOutline, drawTransformHandles, getResizeHandles, getRotationHandle } from "@/canvas/transform-handles";
import { tracePenPreview, traceVectorPath, type PenDraft } from "@/canvas/vector-path";

function applyOpacity(ctx: CanvasRenderingContext2D, opacity: number) {
  ctx.globalAlpha = opacity;
}

function resetOpacity(ctx: CanvasRenderingContext2D) {
  ctx.globalAlpha = 1;
}

function drawWithDropShadow(
  ctx: CanvasRenderingContext2D,
  shadow: DropShadowEffect | undefined,
  draw: () => void,
) {
  if (shadow?.enabled) {
    ctx.save();
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    draw();
    ctx.restore();
  }
  draw();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: Camera,
  nodes: SceneNode[],
  selectedIds: string[],
  draft: DraftShape | null,
  showPixelGrid: boolean,
  marquee: { x: number; y: number; width: number; height: number } | null = null,
  showHandles = true,
  snapGuides: SnapGuide[] = [],
  selectionNodes: SceneNode[] = nodes,
  penDraft: PenDraft | null = null,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#1E1E1E";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  for (const node of nodes) {
    if (node.type === "group") continue;
    drawNode(ctx, node);
  }

  if (showPixelGrid) {
    drawPixelGrid(ctx, width, height, camera, nodes);
  }

  if (draft) {
    drawDraft(ctx, draft);
  }

  if (penDraft) {
    drawPenDraft(ctx, penDraft);
  }

  if (marquee) {
    drawMarquee(ctx, marquee);
  }

  drawSnapGuides(ctx, snapGuides);

  for (const id of selectedIds) {
    const selected = selectionNodes.find((node) => node.id === id);
    if (selected) drawSelectionOutline(ctx, selected, camera.zoom);
  }

  if (showHandles && selectedIds.length === 1) {
    const selected = selectionNodes.find((node) => node.id === selectedIds[0]);
    if (selected) {
      const handles = getResizeHandles(selected);
      const rotationHandle = getRotationHandle(selected);
      if (handles) drawTransformHandles(ctx, handles, camera.zoom, rotationHandle);
    }
  }

  ctx.restore();
}

function drawSnapGuides(ctx: CanvasRenderingContext2D, guides: SnapGuide[]) {
  if (guides.length === 0) return;
  ctx.save();
  ctx.strokeStyle = "#FF2D55";
  ctx.lineWidth = 1 / (ctx.getTransform().a || 1);
  ctx.setLineDash([4, 4]);
  for (const guide of guides) {
    ctx.beginPath();
    if (guide.axis === "x") {
      ctx.moveTo(guide.value, guide.from);
      ctx.lineTo(guide.value, guide.to);
    } else {
      ctx.moveTo(guide.from, guide.value);
      ctx.lineTo(guide.to, guide.value);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawPixelGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: Camera,
  nodes: SceneNode[],
) {
  const step = camera.zoom >= 4 ? 1 : 8;
  if (camera.zoom * step < 2) return;

  const minX = Math.floor(-camera.x / camera.zoom);
  const minY = Math.floor(-camera.y / camera.zoom);
  const maxX = Math.ceil((width - camera.x) / camera.zoom);
  const maxY = Math.ceil((height - camera.y) / camera.zoom);

  const frames = nodes.filter((node): node is Extract<SceneNode, { type: "frame" }> => node.type === "frame");
  if (frames.length === 0) return;

  ctx.save();
  ctx.beginPath();
  for (const frame of frames) {
    ctx.rect(frame.x, frame.y, frame.width, frame.height);
  }
  ctx.clip();

  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1 / camera.zoom;
  ctx.beginPath();
  for (let x = minX; x <= maxX; x += step) {
    ctx.moveTo(x, minY);
    ctx.lineTo(x, maxY);
  }
  for (let y = minY; y <= maxY; y += step) {
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawNode(ctx: CanvasRenderingContext2D, node: SceneNode) {
  if (node.type === "page" || node.type === "group") return;

  const bounds = getNodeBounds(node);
  if (!bounds) return;

  ctx.save();
  if (node.rotation !== 0) {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((node.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  applyOpacity(ctx, node.opacity);

  switch (node.type) {
    case "frame":
      drawWithDropShadow(ctx, node.effects?.dropShadow, () => {
        setCanvasFill(ctx, node.fill, node.fillGradient, node.x, node.y, node.width, node.height);
        ctx.fillRect(node.x, node.y, node.width, node.height);
      });
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(node.x, node.y, node.width, node.height);
      drawFrameLabel(ctx, node.name, node.x, node.y, node.width, node.height);
      break;
    case "rectangle":
      drawWithDropShadow(ctx, node.effects?.dropShadow, () => {
        drawRoundedRect(ctx, node.x, node.y, node.width, node.height, node.cornerRadius);
        setCanvasFill(ctx, node.fill, node.fillGradient, node.x, node.y, node.width, node.height);
        ctx.fill();
      });
      if (node.strokeWidth > 0) {
        drawRoundedRect(ctx, node.x, node.y, node.width, node.height, node.cornerRadius);
        ctx.strokeStyle = node.stroke;
        ctx.lineWidth = node.strokeWidth;
        ctx.stroke();
      }
      break;
    case "ellipse":
      drawWithDropShadow(ctx, node.effects?.dropShadow, () => {
        ctx.beginPath();
        ctx.ellipse(
          node.x + node.width / 2,
          node.y + node.height / 2,
          Math.abs(node.width / 2),
          Math.abs(node.height / 2),
          0,
          0,
          Math.PI * 2,
        );
        setCanvasFill(ctx, node.fill, node.fillGradient, node.x, node.y, node.width, node.height);
        ctx.fill();
      });
      if (node.strokeWidth > 0) {
        ctx.beginPath();
        ctx.ellipse(
          node.x + node.width / 2,
          node.y + node.height / 2,
          Math.abs(node.width / 2),
          Math.abs(node.height / 2),
          0,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = node.stroke;
        ctx.lineWidth = node.strokeWidth;
        ctx.stroke();
      }
      break;
    case "polygon": {
      const vertices = regularPolygonVertices(node.x, node.y, node.width, node.height, node.sides);
      drawWithDropShadow(ctx, node.effects?.dropShadow, () => {
        traceVertexPath(ctx, vertices);
        setCanvasFill(ctx, node.fill, node.fillGradient, node.x, node.y, node.width, node.height);
        ctx.fill();
      });
      if (node.strokeWidth > 0) {
        traceVertexPath(ctx, vertices);
        ctx.strokeStyle = node.stroke;
        ctx.lineWidth = node.strokeWidth;
        ctx.stroke();
      }
      break;
    }
    case "star": {
      const vertices = starVertices(
        node.x,
        node.y,
        node.width,
        node.height,
        node.points,
        node.innerRadiusRatio,
      );
      drawWithDropShadow(ctx, node.effects?.dropShadow, () => {
        traceVertexPath(ctx, vertices);
        setCanvasFill(ctx, node.fill, node.fillGradient, node.x, node.y, node.width, node.height);
        ctx.fill();
      });
      if (node.strokeWidth > 0) {
        traceVertexPath(ctx, vertices);
        ctx.strokeStyle = node.stroke;
        ctx.lineWidth = node.strokeWidth;
        ctx.stroke();
      }
      break;
    }
    case "vector": {
      ctx.save();
      ctx.translate(node.x, node.y);
      const shadow = node.effects?.dropShadow;
      if (shadow?.enabled) {
        ctx.save();
        ctx.shadowColor = shadow.color;
        ctx.shadowBlur = shadow.blur;
        ctx.shadowOffsetX = shadow.offsetX;
        ctx.shadowOffsetY = shadow.offsetY;
        traceVectorPath(ctx, node.points, node.closed);
        const shadowSkipFill = node.fill === "none" || node.fill === "transparent";
        if (node.closed && !shadowSkipFill) {
          setCanvasFill(ctx, node.fill, node.fillGradient, 0, 0, node.width, node.height);
          ctx.fill();
        } else if (node.strokeWidth > 0) {
          ctx.strokeStyle = node.stroke;
          ctx.lineWidth = node.strokeWidth;
          ctx.stroke();
        }
        ctx.restore();
      }
      traceVectorPath(ctx, node.points, node.closed);
      const skipFill = node.fill === "none" || node.fill === "transparent";
      if (node.closed && !skipFill) {
        setCanvasFill(ctx, node.fill, node.fillGradient, 0, 0, node.width, node.height);
        ctx.fill();
      }
      if (node.strokeWidth > 0) {
        ctx.strokeStyle = node.stroke;
        ctx.lineWidth = node.strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case "image": {
      const img = getCachedImage(node.src) ?? preloadImage(node.src);
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, node.x, node.y, node.width, node.height);
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1;
        ctx.strokeRect(node.x, node.y, node.width, node.height);
      }
      break;
    }
    case "line":
      applyLineDash(ctx, node.lineDash);
      strokeLinePath(ctx, node);
      ctx.strokeStyle = node.stroke;
      ctx.lineWidth = node.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      drawLineEndpoints(ctx, node);
      ctx.setLineDash([]);
      break;
    case "text":
      drawTextNode(ctx, node);
      break;
  }

  resetOpacity(ctx);
  ctx.restore();
}

function drawTextNode(ctx: CanvasRenderingContext2D, node: Extract<SceneNode, { type: "text" }>) {
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
}

function drawFrameLabel(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "11px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${name} · ${Math.round(width)} × ${Math.round(height)}`, x, y - 6);
  ctx.restore();
}

function drawDraft(ctx: CanvasRenderingContext2D, draft: DraftShape) {
  ctx.save();
  ctx.strokeStyle = "#0D99FF";
  ctx.fillStyle = "rgba(13,153,255,0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  if (draft.kind === "line") {
    ctx.beginPath();
    const x2 = draft.x2 ?? draft.x + draft.width;
    const y2 = draft.y2 ?? draft.y + draft.height;
    ctx.moveTo(draft.x, draft.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const x = draft.width < 0 ? draft.x + draft.width : draft.x;
  const y = draft.height < 0 ? draft.y + draft.height : draft.y;
  const width = Math.abs(draft.width);
  const height = Math.abs(draft.height);

  if (draft.kind === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (draft.kind === "triangle") {
    traceVertexPath(ctx, regularPolygonVertices(x, y, width, height, 3));
    ctx.fill();
    ctx.stroke();
  } else if (draft.kind === "polygon") {
    traceVertexPath(ctx, regularPolygonVertices(x, y, width, height, 6));
    ctx.fill();
    ctx.stroke();
  } else if (draft.kind === "star") {
    traceVertexPath(ctx, starVertices(x, y, width, height, 5, 0.38));
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  }

  ctx.restore();
}

function drawPenDraft(ctx: CanvasRenderingContext2D, draft: PenDraft) {
  if (draft.points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = "#0D99FF";
  ctx.fillStyle = "#0D99FF";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([4, 4]);

  tracePenPreview(ctx, draft, false);
  ctx.stroke();

  for (const point of draft.points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
    if (point.handleOut) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.handleOut.x, point.handleOut.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(point.handleOut.x, point.handleOut.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (point.handleIn) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.handleIn.x, point.handleIn.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(point.handleIn.x, point.handleIn.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (draft.points.length >= 3) {
    const first = draft.points[0];
    ctx.beginPath();
    ctx.arc(first.x, first.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = "#14AE5C";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMarquee(
  ctx: CanvasRenderingContext2D,
  marquee: { x: number; y: number; width: number; height: number },
) {
  const x = marquee.width < 0 ? marquee.x + marquee.width : marquee.x;
  const y = marquee.height < 0 ? marquee.y + marquee.height : marquee.y;
  const width = Math.abs(marquee.width);
  const height = Math.abs(marquee.height);

  ctx.save();
  ctx.strokeStyle = "#0D99FF";
  ctx.fillStyle = "rgba(13,153,255,0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}
