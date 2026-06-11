import { save, open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { ComponentDefinition, DesignSystemState } from "@/types/design-system";
import { defaultDesignSystem } from "@/types/design-system";
import type { Camera, SceneNode } from "@/types/document";

export interface KirutmaFile {
  version: 1 | 2;
  name: string;
  nodes: Record<string, SceneNode>;
  camera: Camera;
  colorStyles?: DesignSystemState["colorStyles"];
  textStyles?: DesignSystemState["textStyles"];
  components?: DesignSystemState["components"];
}

const FILE_FILTER = {
  name: "Kirutma Document",
  extensions: ["kirutma"],
};

export function serializeDocument(
  nodes: Record<string, SceneNode>,
  camera: Camera,
  name: string,
  design: DesignSystemState = defaultDesignSystem(),
): string {
  const payload: KirutmaFile = {
    version: 2,
    name,
    nodes,
    camera,
    colorStyles: design.colorStyles,
    textStyles: design.textStyles,
    components: design.components,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseDocument(raw: string): KirutmaFile {
  let data: KirutmaFile;
  try {
    data = JSON.parse(raw) as KirutmaFile;
  } catch {
    throw new Error("Invalid .kirutma file (not valid JSON)");
  }
  if (!data.nodes || !data.camera) {
    throw new Error("Invalid .kirutma file");
  }
  if (data.version !== 1 && data.version !== 2) {
    throw new Error("Unsupported .kirutma version");
  }
  return data;
}

export function designFromFile(file: KirutmaFile): DesignSystemState {
  const defaults = defaultDesignSystem();
  return {
    colorStyles: file.colorStyles ?? defaults.colorStyles,
    textStyles: file.textStyles ?? defaults.textStyles,
    components: file.components ?? {},
  };
}

function ensureKirutmaExtension(path: string): string {
  return /\.kirutma$/i.test(path) ? path : `${path}.kirutma`;
}

export async function pickSavePath(defaultName: string, currentPath?: string | null) {
  const selected = await save({
    defaultPath: currentPath ?? `${defaultName}.kirutma`,
    filters: [FILE_FILTER],
  });
  return selected ? ensureKirutmaExtension(selected) : null;
}

export async function pickOpenPath() {
  const selected = await open({
    multiple: false,
    filters: [FILE_FILTER],
  });
  return typeof selected === "string" ? selected : null;
}

export async function writeDocumentFile(path: string, content: string) {
  await writeTextFile(path, content);
}

export async function readDocumentFile(path: string) {
  return readTextFile(path);
}

const RECENTS_KEY = "kirutma-recent-files";

export function loadRecentFiles(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentFile(path: string) {
  const next = [path, ...loadRecentFiles().filter((entry) => entry !== path)].slice(0, 8);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
}

export function removeRecentFile(path: string) {
  const next = loadRecentFiles().filter((entry) => entry !== path);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
}

export function clearRecentFiles() {
  localStorage.removeItem(RECENTS_KEY);
}

export function formatRecentFile(path: string): { name: string; folder: string } {
  const parts = path.split(/[/\\]/);
  const file = parts.pop() ?? path;
  const name = file.replace(/\.kirutma$/i, "") || "Untitled";
  const folder = parts.join("/") || "—";
  return { name, folder };
}

export type { ComponentDefinition };
