import { useMemo, useState } from "react";
import { ChevronDown, Eye, EyeOff, Lock, Plus, Search, Unlock } from "lucide-react";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { InlineRename } from "@/components/ui/InlineRename";
import { AssetsPanel } from "@/components/assets-panel/AssetsPanel";
import { PanelTab } from "@/components/ui/primitives";
import { runPaste } from "@/lib/paste";
import { useDocumentStore, selectPages } from "@/stores/document-store";
import { useFileStore } from "@/stores/file-store";
import { useUiStore } from "@/stores/ui-store";
import type { SceneNode } from "@/types/document";

function matchesSearch(node: SceneNode, query: string) {
  return node.name.toLowerCase().includes(query);
}

function LayerRow({
  node,
  depth,
  selected,
  hasChildren,
  collapsed,
  onToggleCollapse,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  dragging,
  dropTarget,
}: {
  node: SceneNode;
  depth: number;
  selected: boolean;
  hasChildren: boolean;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onSelect: () => void;
  onContextMenu: (event: React.MouseEvent, node: SceneNode) => void;
  onDragStart: (event: React.DragEvent, node: SceneNode) => void;
  onDragOver: (event: React.DragEvent, node: SceneNode) => void;
  onDrop: (event: React.DragEvent, node: SceneNode) => void;
  dragging: boolean;
  dropTarget: boolean;
}) {
  const toggleVisibility = useDocumentStore((s) => s.toggleVisibility);
  const toggleLock = useDocumentStore((s) => s.toggleLock);
  const renameNode = useDocumentStore((s) => s.renameNode);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);

  const chevron = (
    <button
      type="button"
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-text-muted hover:bg-white/8 ${
        !hasChildren ? "pointer-events-none opacity-0" : ""
      }`}
      aria-label={collapsed ? "Expand layer" : "Collapse layer"}
      onClick={(event) => {
        event.stopPropagation();
        onToggleCollapse?.();
      }}
    >
      <ChevronDown size={12} className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} />
    </button>
  );

  if (node.type === "page") {
    return (
      <div
        className="flex items-center gap-1 py-1 pr-2 text-[11px] text-text-secondary"
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {chevron}
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => {
              renameNode(node.id, name);
              setEditing(false);
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                renameNode(node.id, name);
                setEditing(false);
              }
              if (event.key === "Escape") setEditing(false);
            }}
            className="min-w-0 flex-1 rounded-sm bg-input px-1 py-0.5 text-[11px] text-text-primary outline-none"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => setEditing(true)}
            className="min-w-0 flex-1 truncate text-left"
            title="Double-click to rename page"
          >
            {node.name}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      draggable={!editing}
      onDragStart={(event) => onDragStart(event, node)}
      onDragOver={(event) => onDragOver(event, node)}
      onDrop={(event) => onDrop(event, node)}
      className={`group flex items-center gap-1 py-1 pr-2 text-[11px] hover:bg-white/6 ${
        selected ? "bg-accent/15 text-text-primary" : "text-text-secondary"
      } ${!node.visible ? "opacity-50" : ""} ${dragging ? "opacity-40" : ""} ${
        dropTarget ? "ring-1 ring-inset ring-accent/60" : ""
      }`}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      onContextMenu={(event) => onContextMenu(event, node)}
    >
      {chevron}
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => {
            renameNode(node.id, name);
            setEditing(false);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              renameNode(node.id, name);
              setEditing(false);
            }
            if (event.key === "Escape") setEditing(false);
          }}
          className="min-w-0 flex-1 rounded-sm bg-input px-1 py-0.5 text-[11px] text-text-primary outline-none"
        />
      ) : (
        <button type="button" onClick={onSelect} onDoubleClick={() => setEditing(true)} className="min-w-0 flex-1 truncate text-left">
          {node.name}
        </button>
      )}
      <button
        type="button"
        className="opacity-0 group-hover:opacity-100"
        aria-label={node.visible ? "Hide layer" : "Show layer"}
        onClick={() => toggleVisibility(node.id)}
      >
        {node.visible ? <Eye size={12} className="text-text-muted" /> : <EyeOff size={12} className="text-text-muted" />}
      </button>
      <button
        type="button"
        className="opacity-0 group-hover:opacity-100"
        aria-label={node.locked ? "Unlock layer" : "Lock layer"}
        onClick={() => toggleLock(node.id)}
      >
        {node.locked ? <Lock size={12} className="text-text-muted" /> : <Unlock size={12} className="text-text-muted" />}
      </button>
    </div>
  );
}

function LayerTree({
  parentId,
  depth,
  query,
  collapsedIds,
  onToggleCollapse,
  onContextMenu,
  dragId,
  dropId,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  parentId: string;
  depth: number;
  query: string;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, node: SceneNode) => void;
  dragId: string | null;
  dropId: string | null;
  onDragStart: (event: React.DragEvent, node: SceneNode) => void;
  onDragOver: (event: React.DragEvent, node: SceneNode) => void;
  onDrop: (event: React.DragEvent, node: SceneNode) => void;
}) {
  const nodes = useDocumentStore((s) => s.nodes);
  const selectedIds = useDocumentStore((s) => s.selectedIds);
  const selectNode = useDocumentStore((s) => s.selectNode);

  const children = useMemo(
    () =>
      Object.values(nodes)
        .filter((node) => node.parentId === parentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .filter((node) => !query || matchesSearch(node, query) || node.type === "frame" || node.type === "group"),
    [nodes, parentId, query],
  );

  return (
    <>
      {children.map((node) => {
        const hasChildren = Object.values(nodes).some((entry) => entry.parentId === node.id);
        const collapsed = collapsedIds.has(node.id);
        return (
          <div key={node.id}>
            <LayerRow
              node={node}
              depth={depth}
              selected={selectedIds.includes(node.id)}
              hasChildren={hasChildren}
              collapsed={collapsed}
              onToggleCollapse={() => onToggleCollapse(node.id)}
              onSelect={() => selectNode(node.id)}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dragging={dragId === node.id}
              dropTarget={dropId === node.id}
            />
            {!collapsed && (
              <LayerTree
                parentId={node.id}
                depth={depth + 1}
                query={query}
                collapsedIds={collapsedIds}
                onToggleCollapse={onToggleCollapse}
                onContextMenu={onContextMenu}
                dragId={dragId}
                dropId={dropId}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function LayersPanel() {
  const leftPanelTab = useUiStore((s) => s.leftPanelTab);
  const setLeftPanelTab = useUiStore((s) => s.setLeftPanelTab);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const nodes = useDocumentStore((s) => s.nodes);
  const page = nodes[activePageId];
  const pages = useMemo(() => selectPages(nodes), [nodes]);
  const setActivePage = useDocumentStore((s) => s.setActivePage);
  const addPage = useDocumentStore((s) => s.addPage);
  const deletePage = useDocumentStore((s) => s.deletePage);
  const moveLayerOrder = useDocumentStore((s) => s.moveLayerOrder);
  const renameNode = useDocumentStore((s) => s.renameNode);
  const selectNode = useDocumentStore((s) => s.selectNode);
  const reorderNode = useDocumentStore((s) => s.reorderNode);
  const duplicateSelected = useDocumentStore((s) => s.duplicateSelected);
  const copySelected = useDocumentStore((s) => s.copySelected);
  const selectedIds = useDocumentStore((s) => s.selectedIds);
  const deleteSelected = useDocumentStore((s) => s.deleteSelected);
  const createComponentFromSelection = useDocumentStore((s) => s.createComponentFromSelection);
  const detachInstance = useDocumentStore((s) => s.detachInstance);
  const resetInstanceOverrides = useDocumentStore((s) => s.resetInstanceOverrides);
  const toggleVisibility = useDocumentStore((s) => s.toggleVisibility);
  const toggleLock = useDocumentStore((s) => s.toggleLock);
  const markDirty = useFileStore((s) => s.markDirty);

  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  const query = searchQuery.trim().toLowerCase();
  const searchHasMatches = useMemo(() => {
    if (!query) return true;
    return Object.values(nodes).some((node) => node.type !== "page" && matchesSearch(node, query));
  }, [nodes, query]);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openLayerMenu = (event: React.MouseEvent, node: SceneNode) => {
    event.preventDefault();
    if (node.type === "page") return;

    selectNode(node.id);
    const hasSelection = selectedIds.includes(node.id);
    const items: ContextMenuItem[] = [
      { label: "Copy", shortcut: "⌘C", disabled: !hasSelection, onClick: () => { copySelected(); } },
      { label: "Paste", shortcut: "⌘V", onClick: () => { void runPaste().then((pasted) => { if (pasted) markDirty(); }); } },
      { label: "Duplicate", shortcut: "⌘D", disabled: !hasSelection, onClick: () => { duplicateSelected(); markDirty(); } },
    ];

    if (node.type === "frame" || node.type === "group") {
      items.push({
        label: "Create Component",
        onClick: () => {
          createComponentFromSelection();
          markDirty();
        },
      });
    }

    if (node.type === "instance") {
      items.push(
        {
          label: "Detach Instance",
          onClick: () => {
            detachInstance(node.id);
            markDirty();
          },
        },
        {
          label: "Reset Overrides",
          onClick: () => {
            resetInstanceOverrides(node.id);
            markDirty();
          },
        },
      );
    }

    items.push(
      { label: "Bring Forward", onClick: () => { moveLayerOrder(node.id, "forward"); markDirty(); } },
      { label: "Send Backward", onClick: () => { moveLayerOrder(node.id, "backward"); markDirty(); } },
      { label: node.visible ? "Hide" : "Show", onClick: () => { toggleVisibility(node.id); markDirty(); } },
      { label: node.locked ? "Unlock" : "Lock", onClick: () => { toggleLock(node.id); markDirty(); } },
      { label: "Delete", onClick: () => { deleteSelected(); markDirty(); } },
    );

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items,
    });
  };

  const onDragStart = (event: React.DragEvent, node: SceneNode) => {
    setDragId(node.id);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (event: React.DragEvent, node: SceneNode) => {
    event.preventDefault();
    if (dragId && dragId !== node.id) setDropId(node.id);
  };

  const onDrop = (event: React.DragEvent, node: SceneNode) => {
    event.preventDefault();
    if (dragId && dragId !== node.id) {
      reorderNode(dragId, node.id, "before");
      markDirty();
    }
    setDragId(null);
    setDropId(null);
  };

  return (
    <aside
      className="flex w-panel shrink-0 flex-col border-r border-border-subtle bg-panel"
      onContextMenu={(event) => event.preventDefault()}
      onDragEnd={() => {
        setDragId(null);
        setDropId(null);
      }}
    >
      <div className="flex border-b border-border-subtle">
        <PanelTab active={leftPanelTab === "layers"} onClick={() => setLeftPanelTab("layers")}>
          Layers
        </PanelTab>
        <PanelTab active={leftPanelTab === "pages"} onClick={() => setLeftPanelTab("pages")}>
          Pages
        </PanelTab>
        <PanelTab active={leftPanelTab === "assets"} onClick={() => setLeftPanelTab("assets")}>
          Assets
        </PanelTab>
      </div>

      {leftPanelTab === "layers" && (
        <>
          <div className="flex items-center gap-2 border-b border-border-subtle px-2 py-2">
            <Search size={14} className="text-text-muted" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search layers"
              className="w-full bg-transparent text-[11px] text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {query && !searchHasMatches && (
              <p className="px-3 py-6 text-center text-[11px] text-text-muted">
                No layers match &ldquo;{searchQuery.trim()}&rdquo;
              </p>
            )}
            {(!query || searchHasMatches) && page?.type === "page" && (
              <>
                <LayerRow
                  node={page}
                  depth={0}
                  selected={false}
                  hasChildren={Object.values(nodes).some((entry) => entry.parentId === page.id)}
                  collapsed={collapsedIds.has(page.id)}
                  onToggleCollapse={() => toggleCollapse(page.id)}
                  onSelect={() => {}}
                  onContextMenu={openLayerMenu}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDrop={() => {}}
                  dragging={false}
                  dropTarget={false}
                />
                {!collapsedIds.has(page.id) && (
                  <LayerTree
                    parentId={page.id}
                    depth={1}
                    query={query}
                    collapsedIds={collapsedIds}
                    onToggleCollapse={toggleCollapse}
                    onContextMenu={openLayerMenu}
                    dragId={dragId}
                    dropId={dropId}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}

      {leftPanelTab === "pages" && (
        <div className="flex-1 overflow-y-auto py-2">
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Pages</span>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-sm text-text-muted hover:bg-white/8 hover:text-text-primary"
              aria-label="Add page"
              onClick={() => {
                addPage();
                markDirty();
              }}
            >
              <Plus size={14} />
            </button>
          </div>
          <ul className="px-1">
            {pages.map((entry) => {
              const active = entry.id === activePageId;
              return (
                <li key={entry.id}>
                  <div
                    className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-[11px] ${
                      active ? "bg-accent/15 text-text-primary" : "text-text-secondary hover:bg-white/6"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm hover:bg-white/8"
                      aria-label={`Switch to ${entry.name}`}
                      onClick={() => setActivePage(entry.id)}
                    >
                      <span className="inline-block h-2.5 w-2.5 rounded-[1px] border border-white/30 bg-white/10" />
                    </button>
                    <InlineRename
                      value={entry.name}
                      onRename={(name) => {
                        renameNode(entry.id, name);
                        markDirty();
                      }}
                      className="min-w-0 flex-1 truncate"
                      title="Double-click to rename page"
                    />
                    {pages.length > 1 && (
                      <button
                        type="button"
                        className="rounded-sm px-1.5 py-0.5 text-[10px] text-text-muted hover:bg-white/8 hover:text-text-primary"
                        aria-label={`Delete ${entry.name}`}
                        onClick={() => {
                          if (window.confirm(`Delete page "${entry.name}" and all its contents?`)) {
                            deletePage(entry.id);
                            markDirty();
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {leftPanelTab === "assets" && <AssetsPanel />}

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />
      )}
    </aside>
  );
}
