import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";

export function Toast() {
  const toast = useUiStore((s) => s.toast);
  const clearToast = useUiStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 2500);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const isError = toast.variant === "error";

  return (
    <div
      className={`pointer-events-none fixed bottom-6 left-1/2 z-[100] max-w-md -translate-x-1/2 rounded-md border px-4 py-2 text-[11px] shadow-xl ${
        isError
          ? "border-red-500/40 bg-panel text-red-200"
          : "border-border-subtle bg-panel text-text-primary"
      }`}
    >
      {toast.text}
    </div>
  );
}
