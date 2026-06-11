import { readImageFromClipboard, fitImageDisplaySize } from "@/lib/image-io";
import { readNodesFromClipboard } from "@/lib/clipboard-nodes";
import { useDocumentStore } from "@/stores/document-store";

export async function runPaste(center?: { x: number; y: number }): Promise<boolean> {
  const state = useDocumentStore.getState();
  if (state.clipboard.length > 0) {
    state.pasteClipboard();
    return true;
  }

  const externalNodes = await readNodesFromClipboard();
  if (externalNodes) {
    return state.pasteExternalNodes(externalNodes, center);
  }

  const image = await readImageFromClipboard();
  if (!image) return false;

  let position: { x: number; y: number } | undefined;
  if (center) {
    const { width, height } = fitImageDisplaySize(image.naturalWidth, image.naturalHeight);
    position = { x: center.x - width / 2, y: center.y - height / 2 };
  }

  const id = state.insertImage(
    image.src,
    image.naturalWidth,
    image.naturalHeight,
    position,
    image.name,
  );
  return !!id;
}

export async function runImportImage(position?: { x: number; y: number }): Promise<boolean> {
  const { pickAndReadImageFile } = await import("@/lib/image-io");
  const image = await pickAndReadImageFile();
  if (!image) return false;

  const id = useDocumentStore.getState().insertImage(
    image.src,
    image.naturalWidth,
    image.naturalHeight,
    position,
    image.name,
  );
  return !!id;
}
