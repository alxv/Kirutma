import { useEffect } from "react";
import { KEYBOARD_SHORTCUTS } from "@/constants/shortcuts";

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-border-subtle bg-panel shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-[13px] font-semibold text-text-primary">Keyboard shortcuts</h2>
          <button
            type="button"
            className="rounded-sm px-2 py-1 text-[11px] text-text-secondary hover:bg-white/8 hover:text-text-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          {KEYBOARD_SHORTCUTS.map((group) => (
            <section key={group.section}>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                {group.section}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">{item.label}</span>
                    <kbd className="rounded-sm bg-input px-1.5 py-0.5 font-mono text-[10px] text-text-primary">
                      {item.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
