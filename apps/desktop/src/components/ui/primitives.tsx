import clsx from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
  children: ReactNode;
}

export function IconButton({
  active = false,
  label,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        "flex h-7 w-7 items-center justify-center rounded-sm text-text-secondary transition-colors duration-150",
        "hover:bg-white/8 hover:text-text-primary",
        active && "bg-white/12 text-text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface PanelTabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function PanelTab({ active = false, className, children, ...props }: PanelTabProps) {
  return (
    <button
      type="button"
      className={clsx(
        "relative px-3 py-2 text-[11px] font-medium text-text-secondary transition-colors",
        "hover:text-text-primary",
        active && "text-text-primary",
        className,
      )}
      {...props}
    >
      {children}
      {active && (
        <span className="absolute inset-x-2 bottom-0 h-px bg-accent" aria-hidden />
      )}
    </button>
  );
}

interface PropertyRowProps {
  label: string;
  children: ReactNode;
}

export function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-2 px-3 py-1.5">
      <span className="text-[11px] text-text-muted">{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function PropertyInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary",
        "outline-none focus:border-accent/60",
        className,
      )}
      {...props}
    />
  );
}
