import { useEffect, useState } from "react";
import { FilePlus, FolderOpen } from "lucide-react";
import { clearRecentFiles, formatRecentFile, loadRecentFiles } from "@/lib/file-io";
import { useFileStore } from "@/stores/file-store";
import { useUiStore } from "@/stores/ui-store";

export function HomeScreen() {
  const openDocument = useFileStore((s) => s.openDocument);
  const newDocument = useFileStore((s) => s.newDocument);
  const setScreen = useUiStore((s) => s.setScreen);
  const [recents, setRecents] = useState(loadRecentFiles);

  const refreshRecents = () => setRecents(loadRecentFiles());
  const enterEditor = () => setScreen("editor");

  const onNew = () => {
    if (!newDocument()) return;
    enterEditor();
  };

  const onOpen = async (path?: string) => {
    const ok = await openDocument(path);
    if (ok) {
      enterEditor();
    } else if (path) {
      refreshRecents();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      const meta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (meta && key === "n") {
        event.preventDefault();
        onNew();
      }
      if (meta && key === "o") {
        event.preventDefault();
        void onOpen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="flex h-full flex-col items-center justify-center bg-canvas px-6">
      <img src="/kirutma.png" alt="" className="mb-4 h-16 w-16 rounded-xl" />
      <h1 className="text-[24px] font-semibold text-text-primary">Kirutma</h1>
      <p className="mt-2 max-w-md text-center text-[12px] text-text-muted">
        Design with frames, shapes, and text on an infinite canvas.
      </p>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-[12px] font-medium text-white hover:bg-accent-hover"
          onClick={onNew}
        >
          <FilePlus size={16} />
          New file
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border border-border-subtle bg-panel px-4 py-2 text-[12px] text-text-primary hover:bg-white/8"
          onClick={() => onOpen()}
        >
          <FolderOpen size={16} />
          Open file…
        </button>
      </div>

      {recents.length > 0 && (
        <div className="mt-10 w-full max-w-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Recent files</p>
            <button
              type="button"
              className="text-[10px] text-text-muted hover:text-text-primary"
              onClick={() => {
                clearRecentFiles();
                refreshRecents();
              }}
            >
              Clear
            </button>
          </div>
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-md border border-border-subtle bg-panel">
            {recents.map((path) => {
              const { name, folder } = formatRecentFile(path);
              return (
                <li key={path}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-white/8"
                    onClick={() => onOpen(path)}
                  >
                    <span className="block truncate text-[11px] text-text-primary">{name}</span>
                    <span className="block truncate text-[10px] text-text-muted">{folder}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
