import { useFileStore } from "@/stores/file-store";

export function confirmDiscardUnsavedChanges(): boolean {
  const { dirty } = useFileStore.getState();
  if (!dirty) return true;
  return window.confirm("You have unsaved changes. Discard them?");
}
