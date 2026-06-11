export interface ShortcutEntry {
  label: string;
  keys: string;
}

export const KEYBOARD_SHORTCUTS: { section: string; items: ShortcutEntry[] }[] = [
  {
    section: "Tools",
    items: [
      { label: "Move", keys: "V" },
      { label: "Frame", keys: "F" },
      { label: "Rectangle", keys: "R" },
      { label: "Ellipse", keys: "O" },
      { label: "Triangle", keys: "3" },
      { label: "Polygon", keys: "P" },
      { label: "Star", keys: "S" },
      { label: "Pen", keys: "D" },
      { label: "Line", keys: "L" },
      { label: "Text", keys: "T" },
      { label: "Hand", keys: "H" },
      { label: "Scale", keys: "K" },
    ],
  },
  {
    section: "File",
    items: [
      { label: "New", keys: "⌘N" },
      { label: "Open", keys: "⌘O" },
      { label: "Save", keys: "⌘S" },
      { label: "Save As", keys: "⇧⌘S" },
    ],
  },
  {
    section: "Edit",
    items: [
      { label: "Undo", keys: "⌘Z" },
      { label: "Redo", keys: "⇧⌘Z" },
      { label: "Duplicate", keys: "⌘D" },
      { label: "Copy", keys: "⌘C" },
      { label: "Paste", keys: "⌘V" },
      { label: "Delete", keys: "Delete" },
      { label: "Group", keys: "⌘G" },
      { label: "Ungroup", keys: "⇧⌘G" },
    ],
  },
  {
    section: "View",
    items: [
      { label: "Zoom in", keys: "⌘+" },
      { label: "Zoom out", keys: "⌘-" },
      { label: "Zoom to 100%", keys: "⌘0" },
      { label: "Zoom to selection", keys: "⇧1" },
      { label: "Zoom to fit", keys: "⇧0" },
      { label: "Pan", keys: "Space + drag" },
      { label: "Constrain proportions", keys: "Shift + drag" },
      { label: "Keyboard shortcuts", keys: "⌘?" },
    ],
  },
];
