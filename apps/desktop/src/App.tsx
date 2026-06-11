import { useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { HomeScreen } from "@/components/shell/HomeScreen";
import { EditorShell } from "@/components/shell/EditorShell";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Toast } from "@/components/ui/Toast";
import { useFileStore } from "@/stores/file-store";
import { useUiStore } from "@/stores/ui-store";

export default function App() {
  const screen = useUiStore((s) => s.screen);
  const fileName = useFileStore((s) => s.fileName);
  const dirty = useFileStore((s) => s.dirty);

  useEffect(() => {
    if (!isTauri()) return;
    const title =
      screen === "home"
        ? "Kirutma"
        : dirty
          ? `• ${fileName} — Kirutma`
          : `${fileName} — Kirutma`;
    void getCurrentWindow().setTitle(title).catch(() => {});
  }, [screen, fileName, dirty]);

  return (
    <>
      {screen === "home" ? (
        <HomeScreen />
      ) : (
        <ErrorBoundary fallbackTitle="Editor failed to load">
          <EditorShell />
        </ErrorBoundary>
      )}
      <Toast />
    </>
  );
}
