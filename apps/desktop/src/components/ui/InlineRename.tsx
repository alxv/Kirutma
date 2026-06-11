import clsx from "clsx";
import { useEffect, useState } from "react";

interface InlineRenameProps {
  value: string;
  onRename: (name: string) => void;
  className?: string;
  inputClassName?: string;
  title?: string;
  activateOnClick?: boolean;
}

export function InlineRename({
  value,
  onRename,
  className,
  inputClassName,
  title = "Double-click to rename",
  activateOnClick = false,
}: InlineRenameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    onRename(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") commit();
          if (event.key === "Escape") cancel();
        }}
        className={clsx(
          "min-w-0 rounded-sm bg-input px-1.5 py-0.5 text-[11px] text-text-primary outline-none focus:ring-1 focus:ring-accent/60",
          inputClassName,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      title={title}
      onClick={activateOnClick ? () => setEditing(true) : undefined}
      onDoubleClick={() => setEditing(true)}
      className={clsx("min-w-0 truncate text-left", className)}
    >
      {value}
    </button>
  );
}
