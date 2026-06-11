import { Plus, X } from "lucide-react";
import { useMemo } from "react";
import { InlineRename } from "@/components/ui/InlineRename";
import { selectPages, useDocumentStore } from "@/stores/document-store";
import { useFileStore } from "@/stores/file-store";

export function PageTabs() {
  const nodes = useDocumentStore((s) => s.nodes);
  const pages = useMemo(() => selectPages(nodes), [nodes]);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const setActivePage = useDocumentStore((s) => s.setActivePage);
  const addPage = useDocumentStore((s) => s.addPage);
  const deletePage = useDocumentStore((s) => s.deletePage);
  const renameNode = useDocumentStore((s) => s.renameNode);
  const markDirty = useFileStore((s) => s.markDirty);

  return (
    <div className="flex h-[36px] shrink-0 items-center gap-1 overflow-x-auto border-t border-border-subtle bg-panel px-2">
      {pages.map((page) => {
        const active = page.id === activePageId;
        return (
          <div
            key={page.id}
            className={`flex max-w-[200px] items-center gap-1 rounded-sm py-1 pl-1 pr-2 text-[11px] ${
              active ? "bg-white/10 text-text-primary" : "text-text-secondary hover:bg-white/6 hover:text-text-primary"
            }`}
          >
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-white/8"
              aria-label={`Switch to ${page.name}`}
              onClick={() => setActivePage(page.id)}
            >
              <span className="inline-block h-2.5 w-2.5 rounded-[1px] border border-white/30 bg-white/10" />
            </button>
            <InlineRename
              value={page.name}
              onRename={(name) => {
                renameNode(page.id, name);
                markDirty();
              }}
              className="min-w-0 flex-1 truncate"
              title="Double-click to rename page"
            />
            {pages.length > 1 && (
              <button
                type="button"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-text-muted hover:bg-white/8 hover:text-text-primary"
                aria-label={`Delete ${page.name}`}
                onClick={() => {
                  if (window.confirm(`Delete page "${page.name}" and all its contents?`)) {
                    deletePage(page.id);
                    markDirty();
                  }
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-text-muted hover:bg-white/8 hover:text-text-primary"
        aria-label="Add page"
        onClick={() => {
          addPage();
          markDirty();
        }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
