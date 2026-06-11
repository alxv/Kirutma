import { create } from "zustand";
import type { UiState } from "./ui-store.types";

export type { LeftPanelTab, ToastVariant, ToolId, UiState } from "./ui-store.types";

export const useUiStore = create<UiState>((set) => ({
  screen: "home",
  activeTool: "move",
  zoom: 1,
  leftPanelOpen: true,
  rightPanelOpen: true,
  leftPanelTab: "layers",
  showPixelGrid: true,
  snapEnabled: true,
  toast: null,
  shortcutsOpen: false,
  framePresetId: "desktop",
  setScreen: (screen) => set({ screen }),
  setFramePresetId: (framePresetId) => set({ framePresetId }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom: Math.min(256, Math.max(0.01, zoom)) }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  togglePixelGrid: () => set((s) => ({ showPixelGrid: !s.showPixelGrid })),
  toggleSnapEnabled: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  showToast: (message, variant = "default") => set({ toast: { text: message, variant } }),
  clearToast: () => set({ toast: null }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
}));
