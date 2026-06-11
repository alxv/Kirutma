import {
  Circle,
  Frame,
  Hand,
  Hexagon,
  Maximize2,
  Minus,
  PenTool,
  MousePointer2,
  Scaling,
  Square,
  Star,
  Triangle,
  Type,
} from "lucide-react";
import { IconButton } from "@/components/ui/primitives";
import { FRAME_PRESETS } from "@/constants/frame-presets";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore, type ToolId } from "@/stores/ui-store";

const TOOLS: { id: ToolId; label: string; shortcut: string; icon: typeof MousePointer2 }[] = [
  { id: "move", label: "Move", shortcut: "V", icon: MousePointer2 },
  { id: "frame", label: "Frame", shortcut: "F", icon: Frame },
  { id: "rectangle", label: "Rectangle", shortcut: "R", icon: Square },
  { id: "ellipse", label: "Ellipse", shortcut: "O", icon: Circle },
  { id: "triangle", label: "Triangle", shortcut: "3", icon: Triangle },
  { id: "polygon", label: "Polygon", shortcut: "P", icon: Hexagon },
  { id: "star", label: "Star", shortcut: "S", icon: Star },
  { id: "pen", label: "Pen", shortcut: "D", icon: PenTool },
  { id: "line", label: "Line", shortcut: "L", icon: Minus },
  { id: "text", label: "Text", shortcut: "T", icon: Type },
  { id: "hand", label: "Hand", shortcut: "H", icon: Hand },
  { id: "scale", label: "Scale", shortcut: "K", icon: Scaling },
];

export function Toolbar() {
  const activeTool = useUiStore((s) => s.activeTool);
  const setActiveTool = useUiStore((s) => s.setActiveTool);
  const framePresetId = useUiStore((s) => s.framePresetId);
  const setFramePresetId = useUiStore((s) => s.setFramePresetId);
  const showPixelGrid = useUiStore((s) => s.showPixelGrid);
  const snapEnabled = useUiStore((s) => s.snapEnabled);
  const toggleSnapEnabled = useUiStore((s) => s.toggleSnapEnabled);
  const togglePixelGrid = useUiStore((s) => s.togglePixelGrid);

  const zoom = useDocumentStore((s) => s.camera.zoom);
  const setCamera = useDocumentStore((s) => s.setCamera);
  const zoomPercent = Math.round(zoom * 100);

  const zoomTo = (action: "zoom-selection" | "zoom-fit") => {
    window.dispatchEvent(new CustomEvent("kirutma:view", { detail: action }));
  };

  return (
    <div className="flex h-toolbar shrink-0 items-center gap-1 border-b border-border-subtle bg-toolbar px-2">
      <div className="flex items-center gap-0.5 rounded-sm bg-white/4 p-0.5">
        {TOOLS.map(({ id, label, shortcut, icon: Icon }) => (
          <IconButton
            key={id}
            label={`${label} (${shortcut})`}
            active={activeTool === id}
            onClick={() => setActiveTool(id)}
          >
            <Icon size={16} strokeWidth={1.75} />
          </IconButton>
        ))}
      </div>

      {activeTool === "frame" && (
        <>
          <div className="mx-2 h-5 w-px bg-border-subtle" />
          <div className="flex items-center gap-1">
            {FRAME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`rounded-sm px-2 py-1 text-[10px] transition-colors ${
                  framePresetId === preset.id
                    ? "bg-white/12 text-text-primary"
                    : "text-text-secondary hover:bg-white/8 hover:text-text-primary"
                }`}
                onClick={() => setFramePresetId(preset.id)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mx-2 h-5 w-px bg-border-subtle" />

      <div className="flex items-center gap-1">
        <IconButton label="Zoom out" onClick={() => setCamera({ zoom: zoom / 1.25 })}>
          <span className="text-[13px] leading-none">−</span>
        </IconButton>
        <button
          type="button"
          className="min-w-[52px] rounded-sm px-2 py-1 text-[11px] text-text-secondary hover:bg-white/8 hover:text-text-primary"
          onClick={() => setCamera({ zoom: 1 })}
        >
          {zoomPercent}%
        </button>
        <IconButton label="Zoom in" onClick={() => setCamera({ zoom: zoom * 1.25 })}>
          <span className="text-[13px] leading-none">+</span>
        </IconButton>
        <IconButton label="Zoom to selection (⇧1)" onClick={() => zoomTo("zoom-selection")}>
          <MousePointer2 size={14} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Zoom to fit (⇧0)" onClick={() => zoomTo("zoom-fit")}>
          <Maximize2 size={14} strokeWidth={1.75} />
        </IconButton>
      </div>

      <div className="mx-2 h-5 w-px bg-border-subtle" />

      <button
        type="button"
        className={`rounded-sm px-2 py-1 text-[11px] transition-colors ${
          snapEnabled
            ? "bg-white/12 text-text-primary"
            : "text-text-secondary hover:bg-white/8 hover:text-text-primary"
        }`}
        onClick={toggleSnapEnabled}
      >
        Snapping
      </button>

      <button
        type="button"
        className={`rounded-sm px-2 py-1 text-[11px] transition-colors ${
          showPixelGrid
            ? "bg-white/12 text-text-primary"
            : "text-text-secondary hover:bg-white/8 hover:text-text-primary"
        }`}
        onClick={togglePixelGrid}
      >
        Pixel grid
      </button>
    </div>
  );
}
