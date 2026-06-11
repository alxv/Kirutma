export type ToolId =
  | "move"
  | "hand"
  | "frame"
  | "rectangle"
  | "ellipse"
  | "triangle"
  | "polygon"
  | "star"
  | "pen"
  | "line"
  | "text"
  | "scale";

export type LeftPanelTab = "layers" | "pages" | "assets";
export type AppScreen = "home" | "editor";
export type ToastVariant = "default" | "error";

export interface ToastMessage {
  text: string;
  variant: ToastVariant;
}

export interface UiState {
  screen: AppScreen;
  activeTool: ToolId;
  zoom: number;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  leftPanelTab: LeftPanelTab;
  showPixelGrid: boolean;
  snapEnabled: boolean;
  toast: ToastMessage | null;
  shortcutsOpen: boolean;
  setScreen: (screen: AppScreen) => void;
  framePresetId: string;
  setFramePresetId: (id: string) => void;
  setActiveTool: (tool: ToolId) => void;
  setZoom: (zoom: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  togglePixelGrid: () => void;
  toggleSnapEnabled: () => void;
  showToast: (message: string, variant?: ToastVariant) => void;
  clearToast: () => void;
  setShortcutsOpen: (open: boolean) => void;
}
