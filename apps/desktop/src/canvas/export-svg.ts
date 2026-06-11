import type { SceneNode } from "@/types/document";
import { curveControlPoint, lineDashPattern, lineEndpointSvg, lineOutwardAngleAtEnd, lineOutwardAngleAtStart } from "@/canvas/lines";
import { polygonPointsAttr, regularPolygonVertices, starVertices } from "@/canvas/shapes";
import { getNodeBounds } from "@/canvas/geometry";
import { vectorToSvgPath } from "@/canvas/vector-path";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nodeToSvg(node: SceneNode): string {
  if (node.type === "page" || node.type === "group" || !node.visible) return "";

  const opacity = node.opacity < 1 ? ` opacity="${node.opacity}"` : "";
  const transform =
    node.rotation !== 0
      ? ` transform="rotate(${node.rotation} ${node.x + (getNodeBounds(node)?.width ?? 0) / 2} ${node.y + (getNodeBounds(node)?.height ?? 0) / 2})"`
      : "";

  switch (node.type) {
    case "frame":
    case "rectangle": {
      const radius = node.type === "rectangle" ? ` rx="${node.cornerRadius}"` : "";
      const fill = node.fillGradient
        ? `<defs><linearGradient id="g-${node.id}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${node.fillGradient.start}"/><stop offset="100%" stop-color="${node.fillGradient.end}"/></linearGradient></defs><rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"${radius} fill="url(#g-${node.id})"${opacity}${transform}/>`
        : `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"${radius} fill="${node.fill}"${opacity}${transform}/>`;
      return fill;
    }
    case "ellipse":
      return `<ellipse cx="${node.x + node.width / 2}" cy="${node.y + node.height / 2}" rx="${Math.abs(node.width / 2)}" ry="${Math.abs(node.height / 2)}" fill="${node.fill}"${opacity}${transform}/>`;
    case "polygon": {
      const points = polygonPointsAttr(
        regularPolygonVertices(node.x, node.y, node.width, node.height, node.sides),
      );
      return `<polygon points="${points}" fill="${node.fill}" stroke="${node.stroke}" stroke-width="${node.strokeWidth}"${opacity}${transform}/>`;
    }
    case "star": {
      const points = polygonPointsAttr(
        starVertices(node.x, node.y, node.width, node.height, node.points, node.innerRadiusRatio),
      );
      return `<polygon points="${points}" fill="${node.fill}" stroke="${node.stroke}" stroke-width="${node.strokeWidth}"${opacity}${transform}/>`;
    }
    case "vector": {
      const d = vectorToSvgPath(node.points, node.closed);
      const fillAttr = node.closed ? ` fill="${node.fill}"` : ' fill="none"';
      const shadow = node.effects?.dropShadow;
      const filterDef =
        shadow?.enabled
          ? `<defs><filter id="shadow-${node.id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${shadow.offsetX}" dy="${shadow.offsetY}" stdDeviation="${shadow.blur / 2}" flood-color="${shadow.color}"/></filter></defs>`
          : "";
      const filterAttr = shadow?.enabled ? ` filter="url(#shadow-${node.id})"` : "";
      return `${filterDef}<path d="${d}" transform="translate(${node.x} ${node.y})${node.rotation !== 0 ? ` rotate(${node.rotation} ${node.width / 2} ${node.height / 2})` : ""}"${fillAttr} stroke="${node.stroke}" stroke-width="${node.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${opacity}${filterAttr}/>`;
    }
    case "image":
      return `<image x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" href="${escapeXml(node.src)}" preserveAspectRatio="none"${opacity}${transform}/>`;
    case "line": {
      const dash = lineDashPattern(node.lineDash);
      const dashAttr = dash ? ` stroke-dasharray="${dash}"` : "";
      const strokeAttrs = `stroke="${node.stroke}" stroke-width="${node.strokeWidth}" stroke-linecap="round"${dashAttr}${opacity}${transform}`;
      let body = "";
      if (node.lineStyle === "curved") {
        const cp = curveControlPoint(node.x, node.y, node.x2, node.y2, node.curveOffsetX ?? 0, node.curveOffsetY ?? 0);
        body = `<path d="M ${node.x} ${node.y} Q ${cp.x} ${cp.y} ${node.x2} ${node.y2}" fill="none" ${strokeAttrs}/>`;
      } else {
        body = `<line x1="${node.x}" y1="${node.y}" x2="${node.x2}" y2="${node.y2}" ${strokeAttrs}/>`;
      }
      const startMarker = lineEndpointSvg(
        node.x,
        node.y,
        lineOutwardAngleAtStart(node),
        node.startEndpoint ?? "none",
        node.stroke,
        node.strokeWidth,
      );
      const endMarker = lineEndpointSvg(
        node.x2,
        node.y2,
        lineOutwardAngleAtEnd(node),
        node.endEndpoint ?? "none",
        node.stroke,
        node.strokeWidth,
      );
      return `${body}${startMarker}${endMarker}`;
    }
    case "text":
      return `<text x="${node.x}" y="${node.y + node.fontSize}" fill="${node.fill}" font-size="${node.fontSize}" font-family="${escapeXml(node.fontFamily)}" font-weight="${node.fontWeight}" text-anchor="${node.textAlign === "center" ? "middle" : node.textAlign === "right" ? "end" : "start"}"${opacity}${transform}>${escapeXml(node.text)}</text>`;
    default:
      return "";
  }
}

export function exportNodesToSvg(nodes: SceneNode[]): string {
  const bounds = nodes.reduce(
    (acc, node) => {
      const b = getNodeBounds(node);
      if (!b) return acc;
      return {
        minX: Math.min(acc.minX, b.x),
        minY: Math.min(acc.minY, b.y),
        maxX: Math.max(acc.maxX, b.x + b.width),
        maxY: Math.max(acc.maxY, b.y + b.height),
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  if (!Number.isFinite(bounds.minX)) throw new Error("Nothing to export");

  const padding = 40;
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  const body = nodes.map(nodeToSvg).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}">\n${body}\n</svg>`;
}

export function downloadText(content: string, filename: string, mime = "image/svg+xml") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
