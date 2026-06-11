import { useMemo, useState } from "react";
import {
  SYMBOL_CATEGORIES,
  searchSymbols,
  type SymbolCategory,
  type LibrarySymbol,
} from "@/constants/symbol-library";
import { useDocumentStore } from "@/stores/document-store";
import { useFileStore } from "@/stores/file-store";

function SymbolPreview({ symbol }: { symbol: LibrarySymbol }) {
  return (
    <svg
      viewBox={`0 0 ${symbol.viewBox} ${symbol.viewBox}`}
      className="h-5 w-5 shrink-0 text-text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {symbol.paths.map((path, index) => (
        <path key={`${symbol.id}-${index}`} d={path.d} />
      ))}
    </svg>
  );
}

export function SymbolLibrarySection() {
  const insertLibrarySymbol = useDocumentStore((s) => s.insertLibrarySymbol);
  const markDirty = useFileStore((s) => s.markDirty);
  const [category, setCategory] = useState<SymbolCategory | "all">("all");
  const [query, setQuery] = useState("");

  const symbols = useMemo(() => searchSymbols(query, category), [query, category]);

  const placeSymbol = (symbolId: string) => {
    const { camera } = useDocumentStore.getState();
    const viewport = document.querySelector("[data-canvas-viewport]");
    const rect = viewport?.getBoundingClientRect();
    const x = rect ? (rect.width / 2 - camera.x) / camera.zoom : 200;
    const y = rect ? (rect.height / 2 - camera.y) / camera.zoom : 200;
    insertLibrarySymbol(symbolId, { x, y });
    markDirty();
  };

  return (
    <section className="px-3 pb-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Library</h3>
      <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
        Icons, stamps, symbols, buildings, and signs. Click to insert at canvas center.
      </p>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search library…"
        className="mt-2 w-full rounded-sm border border-border-subtle bg-input px-2 py-1.5 text-[11px] text-text-primary outline-none focus:border-accent/60"
      />

      <div className="mt-2 flex flex-wrap gap-1">
        <button
          type="button"
          className={`rounded-sm px-2 py-0.5 text-[10px] transition-colors ${
            category === "all"
              ? "bg-white/12 text-text-primary"
              : "text-text-secondary hover:bg-white/8 hover:text-text-primary"
          }`}
          onClick={() => setCategory("all")}
        >
          All
        </button>
        {SYMBOL_CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`rounded-sm px-2 py-0.5 text-[10px] transition-colors ${
              category === id
                ? "bg-white/12 text-text-primary"
                : "text-text-secondary hover:bg-white/8 hover:text-text-primary"
            }`}
            onClick={() => setCategory(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1">
        {symbols.map((symbol) => (
          <button
            key={symbol.id}
            type="button"
            title={symbol.name}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-sm border border-border-subtle bg-canvas px-1 py-1.5 text-text-secondary transition-colors hover:border-accent/40 hover:bg-white/6 hover:text-text-primary"
            onClick={() => placeSymbol(symbol.id)}
          >
            <SymbolPreview symbol={symbol} />
            <span className="w-full truncate text-center text-[9px] leading-none">{symbol.name}</span>
          </button>
        ))}
      </div>

      {symbols.length === 0 && (
        <p className="mt-2 text-[11px] text-text-muted">No symbols match your search.</p>
      )}
    </section>
  );
}
