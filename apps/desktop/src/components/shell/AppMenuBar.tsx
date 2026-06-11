import { useEffect, useState, type ReactNode } from "react";
import { PanelLeft, PanelRight } from "lucide-react";
import { InlineRename } from "@/components/ui/InlineRename";
import { IconButton } from "@/components/ui/primitives";
import { downloadDataUrl, exportNodesToPng } from "@/canvas/export-image";
import { downloadText, exportNodesToSvg } from "@/canvas/export-svg";
import { confirmDiscardUnsavedChanges } from "@/lib/confirm-unsaved";
import { formatRecentFile, loadRecentFiles } from "@/lib/file-io";
import { runImportImage, runPaste } from "@/lib/paste";
import { useDocumentStore } from "@/stores/document-store";
import { useFileStore } from "@/stores/file-store";
import { useUiStore } from "@/stores/ui-store";

const FILE_ITEMS_AFTER_RECENTS = [
  { label: "Save", shortcut: "⌘S", action: "save" },
  { label: "Save As…", shortcut: "⇧⌘S", action: "save-as" },
  { label: "Import Image…", action: "import-image" },
  { label: "Export PNG (1x)", action: "export-png-1", export: true },
  { label: "Export PNG (2x)", action: "export-png-2", export: true },
  { label: "Export PNG (3x)", action: "export-png-3", export: true },
  { label: "Export SVG…", action: "export-svg", export: true },
] as const;
const EDIT_ITEMS = [
  { label: "Undo", shortcut: "⌘Z", action: "undo" },
  { label: "Redo", shortcut: "⇧⌘Z", action: "redo" },
  { label: "Duplicate", shortcut: "⌘D", action: "duplicate" },
  { label: "Copy", shortcut: "⌘C", action: "copy" },
  { label: "Paste", shortcut: "⌘V", action: "paste" },
] as const;
const OBJECT_ITEMS = [
  { label: "Group", shortcut: "⌘G", action: "group" },
  { label: "Ungroup", shortcut: "⇧⌘G", action: "ungroup" },
  { label: "Create Component", action: "create-component" },
  { label: "Detach Instance", action: "detach-instance" },
] as const;
const VIEW_ITEMS = [
  { label: "Zoom to Selection", shortcut: "⇧1", action: "zoom-selection" },
  { label: "Zoom to Fit", shortcut: "⇧0", action: "zoom-fit" },
] as const;

const HELP_ITEMS = [{ label: "Keyboard Shortcuts…", shortcut: "⌘?", action: "shortcuts" }] as const;

export function AppMenuBar() {
  const toggleLeftPanel = useUiStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const leftPanelOpen = useUiStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen);
  const setScreen = useUiStore((s) => s.setScreen);

  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const canUndo = useDocumentStore((s) => s.past.length > 0);
  const canRedo = useDocumentStore((s) => s.future.length > 0);
  const duplicateSelected = useDocumentStore((s) => s.duplicateSelected);
  const copySelected = useDocumentStore((s) => s.copySelected);
  const groupSelected = useDocumentStore((s) => s.groupSelected);
  const ungroupSelected = useDocumentStore((s) => s.ungroupSelected);
  const createComponentFromSelection = useDocumentStore((s) => s.createComponentFromSelection);
  const detachInstance = useDocumentStore((s) => s.detachInstance);
  const getSelectedNode = useDocumentStore((s) => s.getSelectedNode);
  const exportSelectedNodes = useDocumentStore((s) => s.exportSelectedNodes);
  const hasExportableContent = useDocumentStore((s) => s.getDrawableNodes().length > 0);
  const hasSelection = useDocumentStore((s) => s.selectedIds.length > 0);
  const selectedIds = useDocumentStore((s) => s.selectedIds);
  const showToast = useUiStore((s) => s.showToast);

  const fileName = useFileStore((s) => s.fileName);
  const dirty = useFileStore((s) => s.dirty);
  const setFileName = useFileStore((s) => s.setFileName);
  const newDocument = useFileStore((s) => s.newDocument);
  const openDocument = useFileStore((s) => s.openDocument);
  const saveDocument = useFileStore((s) => s.saveDocument);
  const saveDocumentAs = useFileStore((s) => s.saveDocumentAs);
  const markDirty = useFileStore((s) => s.markDirty);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const recentFiles = loadRecentFiles();

  useEffect(() => {
    if (!openMenu) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openMenu]);

  const exportNodes = (filename: string, scale: number) => {
    try {
      const nodes = exportSelectedNodes();
      const dataUrl = exportNodesToPng(nodes, scale);
      downloadDataUrl(dataUrl, filename);
    } catch {
      showToast("Nothing to export", "error");
    }
  };

  const runAction = async (action: string) => {
    setOpenMenu(null);

    if (action.startsWith("open-recent:")) {
      const path = action.slice("open-recent:".length);
      const ok = await openDocument(path);
      if (ok) setScreen("editor");
      return;
    }

    switch (action) {
      case "new":
        if (newDocument()) setScreen("editor");
        break;
      case "open": {
        const ok = await openDocument();
        if (ok) setScreen("editor");
        break;
      }
      case "save":
        await saveDocument();
        break;
      case "save-as":
        await saveDocumentAs();
        break;
      case "undo":
        if (canUndo) {
          undo();
          markDirty();
        }
        break;
      case "redo":
        if (canRedo) {
          redo();
          markDirty();
        }
        break;
      case "duplicate":
        if (hasSelection) {
          duplicateSelected();
          markDirty();
        }
        break;
      case "copy":
        copySelected();
        break;
      case "paste": {
        const pasted = await runPaste();
        if (pasted) useFileStore.getState().markDirty();
        break;
      }
      case "import-image": {
        try {
          const imported = await runImportImage();
          if (imported) useFileStore.getState().markDirty();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          showToast(`Could not import image: ${message}`, "error");
        }
        break;
      }
      case "group":
        if (selectedIds.length >= 2) {
          groupSelected();
          markDirty();
        }
        break;
      case "ungroup":
        if (selectedIds.length > 0) {
          ungroupSelected();
          markDirty();
        }
        break;
      case "create-component": {
        const id = createComponentFromSelection();
        if (!id) showToast("Select a frame or group to create a component", "error");
        else markDirty();
        break;
      }
      case "detach-instance": {
        const selected = getSelectedNode();
        if (!selected || selected.type !== "instance") {
          showToast("Select a component instance to detach", "error");
          break;
        }
        detachInstance(selected.id);
        markDirty();
        break;
      }
      case "zoom-selection":
      case "zoom-fit":
        window.dispatchEvent(new CustomEvent("kirutma:view", { detail: action }));
        break;
      case "shortcuts":
        setShortcutsOpen(true);
        break;
      case "export-png-1":
        exportNodes("kirutma-export.png", 1);
        break;
      case "export-png-2":
        exportNodes("kirutma-export@2x.png", 2);
        break;
      case "export-png-3":
        exportNodes("kirutma-export@3x.png", 3);
        break;
      case "export-svg":
        try {
          const nodes = exportSelectedNodes();
          downloadText(exportNodesToSvg(nodes), "kirutma-export.svg");
        } catch {
          showToast("Nothing to export", "error");
        }
        break;
    }
  };

  return (
    <header className="relative flex h-toolbar shrink-0 items-center justify-between border-b border-border-subtle bg-toolbar px-3">
      {openMenu && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default"
          aria-label="Close menu"
          onClick={() => setOpenMenu(null)}
        />
      )}
      <div className="relative z-50 flex items-center gap-4">
        <button
          type="button"
          className="flex items-center gap-2 rounded-sm px-1 hover:bg-white/8"
          onClick={() => {
            if (!confirmDiscardUnsavedChanges()) return;
            setScreen("home");
          }}
        >
          <img src="/kirutma.png" alt="" className="h-5 w-5 rounded-sm" />
          <span className="text-[12px] font-semibold text-text-primary">Kirutma</span>
        </button>
        <span className="hidden items-center gap-1 text-[11px] text-text-muted md:inline-flex">
          <InlineRename
            value={fileName}
            onRename={(name) => {
              setFileName(name);
            }}
            activateOnClick
            className="max-w-[220px] text-text-muted hover:text-text-primary"
            title="Click to rename file"
          />
          {dirty ? " •" : ""}
        </span>
        <nav className="hidden items-center gap-1 sm:flex">
          <MenuButton label="File" open={openMenu === "File"} onToggle={() => setOpenMenu(openMenu === "File" ? null : "File")}>
            <MenuItem label="New" shortcut="⌘N" onClick={() => runAction("new")} />
            <MenuItem label="Open…" shortcut="⌘O" onClick={() => runAction("open")} />
            {recentFiles.length > 0 && <MenuDivider />}
            {recentFiles.length > 0 && (
              <MenuItem label="Open Recent" disabled onClick={() => {}} />
            )}
            {recentFiles.map((path) => {
              const { name } = formatRecentFile(path);
              return (
                <MenuItem
                  key={path}
                  label={name}
                  className="pl-5"
                  onClick={() => runAction(`open-recent:${path}`)}
                />
              );
            })}
            {recentFiles.length > 0 && <MenuDivider />}
            {FILE_ITEMS_AFTER_RECENTS.map((item) => (
              <MenuItem
                key={item.action}
                label={item.label}
                shortcut={"shortcut" in item ? item.shortcut : undefined}
                disabled={"export" in item && item.export && !hasExportableContent}
                onClick={() => runAction(item.action)}
              />
            ))}
          </MenuButton>
          <MenuButton label="Edit" open={openMenu === "Edit"} onToggle={() => setOpenMenu(openMenu === "Edit" ? null : "Edit")}>
            {EDIT_ITEMS.map((item) => (
              <MenuItem
                key={item.action}
                label={item.label}
                shortcut={item.shortcut}
                disabled={
                  (item.action === "undo" && !canUndo) ||
                  (item.action === "redo" && !canRedo) ||
                  ((item.action === "copy" || item.action === "duplicate") && !hasSelection)
                }
                onClick={() => runAction(item.action)}
              />
            ))}
          </MenuButton>
          <MenuButton label="View" open={openMenu === "View"} onToggle={() => setOpenMenu(openMenu === "View" ? null : "View")}>
            {VIEW_ITEMS.map((item) => (
              <MenuItem
                key={item.action}
                label={item.label}
                shortcut={item.shortcut}
                onClick={() => runAction(item.action)}
              />
            ))}
          </MenuButton>
          <MenuButton label="Object" open={openMenu === "Object"} onToggle={() => setOpenMenu(openMenu === "Object" ? null : "Object")}>
            {OBJECT_ITEMS.map((item) => (
              <MenuItem
                key={item.action}
                label={item.label}
                shortcut={"shortcut" in item ? item.shortcut : undefined}
                onClick={() => runAction(item.action)}
              />
            ))}
          </MenuButton>
          <MenuButton label="Help" open={openMenu === "Help"} onToggle={() => setOpenMenu(openMenu === "Help" ? null : "Help")}>
            {HELP_ITEMS.map((item) => (
              <MenuItem
                key={item.action}
                label={item.label}
                shortcut={item.shortcut}
                onClick={() => runAction(item.action)}
              />
            ))}
          </MenuButton>
        </nav>
      </div>

      <div className="relative z-50 flex items-center gap-1">
        <IconButton
          label={leftPanelOpen ? "Hide layers panel" : "Show layers panel"}
          active={leftPanelOpen}
          onClick={toggleLeftPanel}
        >
          <PanelLeft size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton
          label={rightPanelOpen ? "Hide properties panel" : "Show properties panel"}
          active={rightPanelOpen}
          onClick={toggleRightPanel}
        >
          <PanelRight size={16} strokeWidth={1.75} />
        </IconButton>
      </div>
    </header>
  );
}

function MenuButton({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className={`rounded-sm px-2 py-1 text-[11px] ${open ? "bg-white/12 text-text-primary" : "text-text-secondary hover:bg-white/8 hover:text-text-primary"}`}
        onClick={onToggle}
      >
        {label}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-border-subtle bg-panel py-1 shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuDivider() {
  return <div className="my-1 border-t border-border-subtle" role="separator" />;
}

function MenuItem({
  label,
  shortcut,
  disabled = false,
  className = "",
  onClick,
}: {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] ${className} ${
        disabled
          ? "cursor-not-allowed text-text-muted opacity-50"
          : "text-text-secondary hover:bg-white/8 hover:text-text-primary"
      }`}
      onClick={onClick}
    >
      <span>{label}</span>
      {shortcut && <span className="text-text-muted">{shortcut}</span>}
    </button>
  );
}
