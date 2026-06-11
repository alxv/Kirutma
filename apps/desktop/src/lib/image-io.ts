import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

export interface ImageImportResult {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  name: string;
}

const IMAGE_FILTER = {
  name: "Images",
  extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"],
};

function mimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "bmp":
      return "image/bmp";
    default:
      return "application/octet-stream";
  }
}

function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image blob"));
    reader.readAsDataURL(blob);
  });
}

export function loadImageDimensions(src: string): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = src;
  });
}

function fileBaseName(path: string): string {
  const parts = path.split(/[/\\]/);
  const name = parts[parts.length - 1] ?? "Image";
  return name.replace(/\.[^.]+$/, "") || "Image";
}

export async function readImageFile(path: string): Promise<ImageImportResult> {
  try {
    const bytes = await readFile(path);
    const mime = mimeFromPath(path);
    const src = bytesToDataUrl(bytes, mime);
    const { naturalWidth, naturalHeight } = await loadImageDimensions(src);
    return { src, naturalWidth, naturalHeight, name: fileBaseName(path) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Could not read image: ${message}`);
  }
}

export async function pickAndReadImageFile(): Promise<ImageImportResult | null> {
  const selected = await open({
    multiple: false,
    filters: [IMAGE_FILTER],
  });
  if (!selected || typeof selected !== "string") return null;
  return readImageFile(selected);
}

export async function readImageFromFile(file: File): Promise<ImageImportResult> {
  const src = await blobToDataUrl(file);
  const { naturalWidth, naturalHeight } = await loadImageDimensions(src);
  const name = file.name.replace(/\.[^.]+$/, "") || "Image";
  return { src, naturalWidth, naturalHeight, name };
}

export async function readImageFromClipboard(): Promise<ImageImportResult | null> {
  try {
    if (navigator.clipboard?.read) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((entry) => entry.startsWith("image/"));
        if (!type) continue;
        const blob = await item.getType(type);
        const src = await blobToDataUrl(blob);
        const { naturalWidth, naturalHeight } = await loadImageDimensions(src);
        return { src, naturalWidth, naturalHeight, name: "Pasted Image" };
      }
    }
  } catch {
    // Clipboard API unavailable or permission denied.
  }
  return null;
}

export function fitImageDisplaySize(
  naturalWidth: number,
  naturalHeight: number,
  maxDimension = 1200,
): { width: number; height: number } {
  if (naturalWidth <= maxDimension && naturalHeight <= maxDimension) {
    return { width: naturalWidth, height: naturalHeight };
  }
  const scale = maxDimension / Math.max(naturalWidth, naturalHeight);
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}
