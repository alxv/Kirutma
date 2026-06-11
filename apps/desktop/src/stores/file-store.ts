import { create } from "zustand";
import { confirmDiscardUnsavedChanges } from "@/lib/confirm-unsaved";
import {
  designFromFile,
  parseDocument,
  pickOpenPath,
  pickSavePath,
  pushRecentFile,
  readDocumentFile,
  removeRecentFile,
  serializeDocument,
  writeDocumentFile,
} from "@/lib/file-io";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";

interface SaveOptions {
  silent?: boolean;
}

interface FileState {
  filePath: string | null;
  fileName: string;
  dirty: boolean;
  markDirty: () => void;
  markSaved: (path: string, name: string) => void;
  setFileName: (name: string) => void;
  newDocument: () => boolean;
  saveDocument: (options?: SaveOptions) => Promise<boolean>;
  saveDocumentAs: () => Promise<boolean>;
  openDocument: (path?: string) => Promise<boolean>;
}

async function persistToPath(path: string, name: string, options?: SaveOptions): Promise<boolean> {
  const doc = useDocumentStore.getState();
  const content = serializeDocument(doc.nodes, doc.camera, name, {
    colorStyles: doc.colorStyles,
    textStyles: doc.textStyles,
    components: doc.components,
  });
  try {
    await writeDocumentFile(path, content);
    pushRecentFile(path);
    useFileStore.setState({ filePath: path, fileName: name, dirty: false });
    if (!options?.silent) {
      useUiStore.getState().showToast("Saved");
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Save failed:", error);
    useUiStore.getState().showToast(`Could not save file: ${message}`, "error");
    return false;
  }
}

export const useFileStore = create<FileState>((set, get) => ({
  filePath: null,
  fileName: "Untitled",
  dirty: false,

  markDirty: () => set({ dirty: true }),

  markSaved: (path, name) => set({ filePath: path, fileName: name, dirty: false }),

  setFileName: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set({ fileName: trimmed, dirty: true });
  },

  newDocument: () => {
    if (!confirmDiscardUnsavedChanges()) return false;
    useDocumentStore.getState().resetDocument();
    set({ filePath: null, fileName: "Untitled", dirty: false });
    return true;
  },

  saveDocument: async (options) => {
    const { filePath, fileName } = get();
    if (filePath) return persistToPath(filePath, fileName, options);
    return get().saveDocumentAs();
  },

  saveDocumentAs: async () => {
    const { fileName, filePath } = get();
    const path = await pickSavePath(fileName, filePath);
    if (!path) return false;
    const name = path.split(/[/\\]/).pop()?.replace(/\.kirutma$/i, "") ?? fileName;
    return persistToPath(path, name);
  },

  openDocument: async (path) => {
    if (!confirmDiscardUnsavedChanges()) return false;
    const selectedPath = path ?? (await pickOpenPath());
    if (!selectedPath) return false;

    try {
      const raw = await readDocumentFile(selectedPath);
      const doc = parseDocument(raw);
      useDocumentStore.getState().loadDocument(doc.nodes, doc.camera, designFromFile(doc));
      const pathName = selectedPath.split(/[/\\]/).pop()?.replace(/\.kirutma$/i, "") ?? "Untitled";
      const name = doc.name?.trim() || pathName;
      pushRecentFile(selectedPath);
      set({ filePath: selectedPath, fileName: name, dirty: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Open failed:", error);
      removeRecentFile(selectedPath);
      useUiStore.getState().showToast(`Could not open file: ${message}`, "error");
      return false;
    }
  },
}));
