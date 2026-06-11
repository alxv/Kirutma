export interface FramePreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

export const FRAME_PRESETS: FramePreset[] = [
  { id: "iphone", name: "iPhone 15", width: 393, height: 852 },
  { id: "tablet", name: "Tablet", width: 820, height: 1180 },
  { id: "desktop", name: "Desktop", width: 1440, height: 900 },
  { id: "custom", name: "Custom", width: 0, height: 0 },
];

export function getFramePreset(id: string): FramePreset {
  return FRAME_PRESETS.find((preset) => preset.id === id) ?? FRAME_PRESETS[2];
}
