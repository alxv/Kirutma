import { useEffect, useRef, type ReactNode } from "react";

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[100] cursor-default"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        data-context-menu
        className="fixed z-[101] min-w-[180px] rounded-md border border-border-subtle bg-panel py-1 shadow-xl"
        style={{ left: x, top: y }}
        onContextMenu={(event) => event.preventDefault()}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-text-secondary hover:bg-white/8 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              if (item.disabled) return;
              item.onClick();
              onClose();
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="text-text-muted">{item.shortcut}</span>}
          </button>
        ))}
      </div>
    </>
  );
}

export function ContextMenuSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} onContextMenu={(event) => event.preventDefault()}>
      {children}
    </div>
  );
}
