import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SymbolLibrarySection } from "@/components/assets-panel/SymbolLibrarySection";
import { useDocumentStore } from "@/stores/document-store";
import { useFileStore } from "@/stores/file-store";
import { FONT_FAMILIES } from "@/types/document";

function StyleSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded-sm border border-border-subtle"
      style={{ background: color.startsWith("#") ? color : "#888" }}
    />
  );
}

export function AssetsPanel() {
  const colorStylesMap = useDocumentStore((s) => s.colorStyles);
  const textStylesMap = useDocumentStore((s) => s.textStyles);
  const componentsMap = useDocumentStore((s) => s.components);
  const colorStyles = useMemo(() => Object.values(colorStylesMap), [colorStylesMap]);
  const textStyles = useMemo(() => Object.values(textStylesMap), [textStylesMap]);
  const components = useMemo(() => Object.values(componentsMap), [componentsMap]);
  const createColorStyle = useDocumentStore((s) => s.createColorStyle);
  const updateColorStyle = useDocumentStore((s) => s.updateColorStyle);
  const deleteColorStyle = useDocumentStore((s) => s.deleteColorStyle);
  const createTextStyle = useDocumentStore((s) => s.createTextStyle);
  const updateTextStyle = useDocumentStore((s) => s.updateTextStyle);
  const deleteTextStyle = useDocumentStore((s) => s.deleteTextStyle);
  const applyColorStyleToSelected = useDocumentStore((s) => s.applyColorStyleToSelected);
  const applyTextStyleToSelected = useDocumentStore((s) => s.applyTextStyleToSelected);
  const createInstance = useDocumentStore((s) => s.createInstance);
  const markDirty = useFileStore((s) => s.markDirty);

  const [newColorName, setNewColorName] = useState("");

  const markAndDirty = () => markDirty();

  const placeComponent = (componentId: string) => {
    const { camera } = useDocumentStore.getState();
    const viewport = document.querySelector("[data-canvas-viewport]");
    const rect = viewport?.getBoundingClientRect();
    const x = rect ? (rect.width / 2 - camera.x) / camera.zoom : 200;
    const y = rect ? (rect.height / 2 - camera.y) / camera.zoom : 200;
    createInstance(componentId, { x, y });
    markAndDirty();
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto py-2">
      <SymbolLibrarySection />

      <div className="mx-3 my-2 h-px bg-border-subtle" />

      <section className="px-3 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Color styles</h3>
          <button
            type="button"
            className="rounded-sm p-1 text-text-muted hover:bg-white/8 hover:text-text-primary"
            aria-label="Add color style"
            onClick={() => {
              const name = newColorName.trim() || `Color ${colorStyles.length + 1}`;
              createColorStyle(name, "#0D99FF");
              setNewColorName("");
              markAndDirty();
            }}
          >
            <Plus size={12} />
          </button>
        </div>
        <ul className="mt-1 space-y-0.5">
          {colorStyles.map((style) => (
            <li key={style.id} className="group flex items-center gap-2 rounded-sm px-1 py-1 hover:bg-white/6">
              <StyleSwatch color={style.color} />
              <input
                value={style.name}
                onChange={(event) => {
                  updateColorStyle(style.id, { name: event.target.value });
                  markAndDirty();
                }}
                className="min-w-0 flex-1 bg-transparent text-[11px] text-text-primary outline-none"
              />
              <input
                type="color"
                value={style.color.startsWith("#") ? style.color : "#0D99FF"}
                onChange={(event) => {
                  updateColorStyle(style.id, { color: event.target.value });
                  markAndDirty();
                }}
                className="h-5 w-5 cursor-pointer rounded-sm border border-border-subtle bg-transparent p-0 opacity-0 group-hover:opacity-100"
                aria-label={`Edit ${style.name} color`}
              />
              <button
                type="button"
                className="rounded-sm px-1.5 py-0.5 text-[10px] text-text-secondary opacity-0 hover:bg-white/8 group-hover:opacity-100"
                onClick={() => {
                  applyColorStyleToSelected(style.id);
                  markAndDirty();
                }}
              >
                Apply
              </button>
              <button
                type="button"
                className="rounded-sm p-0.5 text-text-muted opacity-0 hover:text-red-400 group-hover:opacity-100"
                aria-label={`Delete ${style.name}`}
                onClick={() => {
                  deleteColorStyle(style.id);
                  markAndDirty();
                }}
              >
                <Trash2 size={11} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-3 h-px bg-border-subtle" />

      <section className="px-3 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Text styles</h3>
          <button
            type="button"
            className="rounded-sm p-1 text-text-muted hover:bg-white/8 hover:text-text-primary"
            aria-label="Add text style"
            onClick={() => {
              createTextStyle(`Text ${textStyles.length + 1}`);
              markAndDirty();
            }}
          >
            <Plus size={12} />
          </button>
        </div>
        <ul className="mt-1 space-y-2">
          {textStyles.map((style) => (
            <li key={style.id} className="group rounded-sm border border-transparent px-1 py-1 hover:border-border-subtle hover:bg-white/6">
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-medium text-text-primary"
                  style={{ fontSize: Math.min(style.fontSize, 14), color: style.fill }}
                >
                  Aa
                </span>
                <input
                  value={style.name}
                  onChange={(event) => {
                    updateTextStyle(style.id, { name: event.target.value });
                    markAndDirty();
                  }}
                  className="min-w-0 flex-1 bg-transparent text-[11px] text-text-secondary outline-none"
                />
                <button
                  type="button"
                  className="rounded-sm px-1.5 py-0.5 text-[10px] text-text-secondary opacity-0 hover:bg-white/8 group-hover:opacity-100"
                  onClick={() => {
                    applyTextStyleToSelected(style.id);
                    markAndDirty();
                  }}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="rounded-sm p-0.5 text-text-muted opacity-0 hover:text-red-400 group-hover:opacity-100"
                  aria-label={`Delete ${style.name}`}
                  onClick={() => {
                    deleteTextStyle(style.id);
                    markAndDirty();
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1 pl-6">
                <select
                  value={style.fontFamily}
                  onChange={(event) => {
                    updateTextStyle(style.id, { fontFamily: event.target.value });
                    markAndDirty();
                  }}
                  className="h-6 rounded-sm border border-border-subtle bg-input px-1 text-[10px] text-text-primary outline-none"
                >
                  {FONT_FAMILIES.map((family) => (
                    <option key={family} value={family}>
                      {family.split(",")[0]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={8}
                  max={120}
                  value={style.fontSize}
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (!Number.isNaN(parsed)) {
                      updateTextStyle(style.id, { fontSize: parsed });
                      markAndDirty();
                    }
                  }}
                  className="h-6 rounded-sm border border-border-subtle bg-input px-1 text-[10px] text-text-primary outline-none"
                />
                <select
                  value={String(style.fontWeight)}
                  onChange={(event) => {
                    updateTextStyle(style.id, { fontWeight: Number(event.target.value) });
                    markAndDirty();
                  }}
                  className="h-6 rounded-sm border border-border-subtle bg-input px-1 text-[10px] text-text-primary outline-none"
                >
                  <option value="400">Regular</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                </select>
                <input
                  type="color"
                  value={style.fill.startsWith("#") ? style.fill : "#000000"}
                  onChange={(event) => {
                    updateTextStyle(style.id, { fill: event.target.value });
                    markAndDirty();
                  }}
                  className="h-6 w-full cursor-pointer rounded-sm border border-border-subtle bg-transparent p-0"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-3 h-px bg-border-subtle" />

      <section className="px-3 py-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Components</h3>
        {components.length === 0 ? (
          <p className="mt-2 text-[11px] text-text-muted">
            Select a frame or group, then use Object → Create Component.
          </p>
        ) : (
          <ul className="mt-1 space-y-0.5">
            {components.map((component) => (
              <li key={component.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[11px] text-text-secondary hover:bg-white/6 hover:text-text-primary"
                  onClick={() => placeComponent(component.id)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-canvas text-[9px] text-text-muted">
                    {Math.round(component.width)}×{Math.round(component.height)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{component.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
