import type { SceneNode } from "@/types/document";

const CLIPBOARD_PREFIX = "kirutma:";

export async function writeNodesToClipboard(nodes: SceneNode[]): Promise<void> {
  if (nodes.length === 0) return;
  const payload = JSON.stringify({ version: 1, nodes });
  try {
    await navigator.clipboard.writeText(`${CLIPBOARD_PREFIX}${payload}`);
  } catch {
    // Clipboard API unavailable.
  }
}

export async function readNodesFromClipboard(): Promise<SceneNode[] | null> {
  try {
    const text = await navigator.clipboard.readText();
    if (!text.startsWith(CLIPBOARD_PREFIX)) return null;
    const data = JSON.parse(text.slice(CLIPBOARD_PREFIX.length)) as { nodes?: SceneNode[] };
    if (!Array.isArray(data.nodes) || data.nodes.length === 0) return null;
    return data.nodes;
  } catch {
    return null;
  }
}
