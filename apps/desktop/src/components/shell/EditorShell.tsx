import { useEffect } from "react";
import { getDocumentBounds, getSelectionBounds } from "@/canvas/geometry";
import { CanvasViewport } from "@/components/canvas/CanvasViewport";
import { LayersPanel } from "@/components/layers-panel/LayersPanel";
import { PageTabs } from "@/components/page-tabs/PageTabs";
import { PropertiesPanel } from "@/components/properties-panel/PropertiesPanel";
import { AppMenuBar } from "@/components/shell/AppMenuBar";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { ShortcutsDialog } from "@/components/ui/ShortcutsDialog";
import { runPaste } from "@/lib/paste";
import { useDocumentStore } from "@/stores/document-store";
import { useFileStore } from "@/stores/file-store";
import { useUiStore, type ToolId } from "@/stores/ui-store";

const TOOL_SHORTCUTS: Record<string, ToolId> = {
  v: "move",
  f: "frame",
  r: "rectangle",
  o: "ellipse",
  3: "triangle",
  p: "polygon",
  s: "star",
  d: "pen",
  l: "line",
  t: "text",
  h: "hand",
  k: "scale",
};

export function EditorShell() {
  const leftPanelOpen = useUiStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen);
  const setActiveTool = useUiStore((s) => s.setActiveTool);
  const shortcutsOpen = useUiStore((s) => s.shortcutsOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  const zoom = useDocumentStore((s) => s.camera.zoom);
  const setCamera = useDocumentStore((s) => s.setCamera);
  const nodes = useDocumentStore((s) => s.nodes);
  const selectedIds = useDocumentStore((s) => s.selectedIds);
  const zoomToBounds = useDocumentStore((s) => s.zoomToBounds);
  const deleteSelected = useDocumentStore((s) => s.deleteSelected);
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const canUndo = useDocumentStore((s) => s.past.length > 0);
  const canRedo = useDocumentStore((s) => s.future.length > 0);
  const duplicateSelected = useDocumentStore((s) => s.duplicateSelected);
  const copySelected = useDocumentStore((s) => s.copySelected);
  const groupSelected = useDocumentStore((s) => s.groupSelected);
  const ungroupSelected = useDocumentStore((s) => s.ungroupSelected);
  const nudgeSelected = useDocumentStore((s) => s.nudgeSelected);

  const saveDocument = useFileStore((s) => s.saveDocument);
  const saveDocumentAs = useFileStore((s) => s.saveDocumentAs);
  const openDocument = useFileStore((s) => s.openDocument);
  const newDocument = useFileStore((s) => s.newDocument);
  const markDirty = useFileStore((s) => s.markDirty);
  const dirty = useFileStore((s) => s.dirty);
  const filePath = useFileStore((s) => s.filePath);

  useEffect(() => {
    if (!dirty || !filePath) return;
    const timer = window.setInterval(() => {
      void saveDocument({ silent: true });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [dirty, filePath, saveDocument]);

  useEffect(() => {
    const onView = (event: Event) => {
      const action = (event as CustomEvent<string>).detail;
      const viewport = { width: window.innerWidth, height: window.innerHeight - 120 };
      if (action === "zoom-selection") {
        const bounds = getSelectionBounds(nodes, selectedIds);
        if (bounds) zoomToBounds(bounds, viewport);
      }
      if (action === "zoom-fit") {
        const bounds = getDocumentBounds(nodes);
        if (bounds) zoomToBounds(bounds, viewport);
      }
    };
    window.addEventListener("kirutma:view", onView);
    return () => window.removeEventListener("kirutma:view", onView);
  }, [nodes, selectedIds, zoomToBounds]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();
      const meta = event.metaKey || event.ctrlKey;
      const shift = event.shiftKey;

      if (!meta && TOOL_SHORTCUTS[key]) {
        event.preventDefault();
        setActiveTool(TOOL_SHORTCUTS[key]);
        return;
      }

      if (meta && key === "s" && shift) {
        event.preventDefault();
        void saveDocumentAs();
        return;
      }

      if (meta && key === "s") {
        event.preventDefault();
        void saveDocument();
        return;
      }

      if ((meta && shift && key === "/") || (meta && key === "?")) {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (meta && key === "o") {
        event.preventDefault();
        void openDocument();
        return;
      }

      if (meta && key === "n") {
        event.preventDefault();
        newDocument();
        return;
      }

      if (shift && key === "1") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("kirutma:view", { detail: "zoom-selection" }));
        return;
      }

      if (shift && key === "0") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("kirutma:view", { detail: "zoom-fit" }));
        return;
      }

      if (meta && key === "z" && !shift) {
        event.preventDefault();
        if (canUndo) {
          undo();
          markDirty();
        }
        return;
      }

      if (meta && key === "z" && shift) {
        event.preventDefault();
        if (canRedo) {
          redo();
          markDirty();
        }
        return;
      }

      if (meta && key === "d") {
        event.preventDefault();
        if (selectedIds.length > 0) {
          duplicateSelected();
          markDirty();
        }
        return;
      }

      if (meta && key === "c") {
        event.preventDefault();
        copySelected();
        return;
      }

      if (meta && key === "v") {
        event.preventDefault();
        void runPaste().then((pasted) => {
          if (pasted) markDirty();
        });
        return;
      }

      if (meta && key === "g" && !shift) {
        event.preventDefault();
        if (selectedIds.length >= 2) {
          groupSelected();
          markDirty();
        }
        return;
      }

      if (meta && key === "g" && shift) {
        event.preventDefault();
        if (selectedIds.length > 0) {
          ungroupSelected();
          markDirty();
        }
        return;
      }

      if (meta && (key === "=" || key === "+")) {
        event.preventDefault();
        setCamera({ zoom: Math.min(8, zoom * 1.25) });
        return;
      }

      if (meta && key === "-") {
        event.preventDefault();
        setCamera({ zoom: Math.max(0.1, zoom / 1.25) });
        return;
      }

      if (meta && key === "0") {
        event.preventDefault();
        setCamera({ zoom: 1 });
        return;
      }

      if (key === "delete" || key === "backspace") {
        event.preventDefault();
        if (selectedIds.length > 0) {
          deleteSelected();
          markDirty();
        }
        return;
      }

      const step = shift ? 10 : 1;
      if (key === "arrowleft") {
        event.preventDefault();
        if (selectedIds.length > 0) {
          nudgeSelected(-step, 0);
          markDirty();
        }
      }
      if (key === "arrowright") {
        event.preventDefault();
        if (selectedIds.length > 0) {
          nudgeSelected(step, 0);
          markDirty();
        }
      }
      if (key === "arrowup") {
        event.preventDefault();
        if (selectedIds.length > 0) {
          nudgeSelected(0, -step);
          markDirty();
        }
      }
      if (key === "arrowdown") {
        event.preventDefault();
        if (selectedIds.length > 0) {
          nudgeSelected(0, step);
          markDirty();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    canRedo,
    canUndo,
    copySelected,
    deleteSelected,
    duplicateSelected,
    groupSelected,
    markDirty,
    newDocument,
    nudgeSelected,
    openDocument,
    redo,
    saveDocument,
    saveDocumentAs,
    setActiveTool,
    setCamera,
    setShortcutsOpen,
    selectedIds,
    undo,
    ungroupSelected,
    zoom,
  ]);

  return (
    <div className="flex h-full flex-col bg-canvas" onContextMenu={(event) => event.preventDefault()}>
      <AppMenuBar />
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        {leftPanelOpen && <LayersPanel />}
        <div className="flex min-w-0 flex-1 flex-col">
          <CanvasViewport />
          <PageTabs />
        </div>
        {rightPanelOpen && <PropertiesPanel />}
      </div>
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
