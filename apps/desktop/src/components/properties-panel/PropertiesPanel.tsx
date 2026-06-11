import { useEffect, useMemo, useState } from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
} from "lucide-react";
import { IconButton, PropertyInput, PropertyRow } from "@/components/ui/primitives";
import { measureTextWidth } from "@/canvas/geometry";
import { useDocumentStore, type AlignMode } from "@/stores/document-store";
import { useFileStore } from "@/stores/file-store";
import { getNodeBounds } from "@/canvas/geometry";
import { FONT_FAMILIES, nodeLabel, type LineDash, type LineEndpointStyle, type LineStyle, type TextAlign } from "@/types/document";
import { LINE_ENDPOINT_OPTIONS } from "@/canvas/lines";
import { DropShadowControls } from "@/components/properties-panel/DropShadowControls";
import { fitImageDisplaySize, pickAndReadImageFile } from "@/lib/image-io";

const ALIGNMENTS: { mode: AlignMode; label: string; icon: typeof AlignStartHorizontal }[] = [
  { mode: "left", label: "Align left", icon: AlignStartHorizontal },
  { mode: "center-h", label: "Align horizontal centers", icon: AlignCenterHorizontal },
  { mode: "right", label: "Align right", icon: AlignEndHorizontal },
  { mode: "top", label: "Align top", icon: AlignStartVertical },
  { mode: "center-v", label: "Align vertical centers", icon: AlignCenterVertical },
  { mode: "bottom", label: "Align bottom", icon: AlignEndVertical },
];

const EFFECT_NODE_TYPES = new Set(["vector", "rectangle", "frame", "ellipse", "polygon", "star"]);

function OpacityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (opacity: number) => void;
}) {
  const percent = Math.round(value * 100);
  return (
    <div className="flex flex-1 items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="h-1 flex-1 accent-accent"
      />
      <span className="w-9 text-right text-[10px] tabular-nums text-text-muted">{percent}%</span>
    </div>
  );
}

function TextContentField({
  nodeId,
  value,
  fontSize,
}: {
  nodeId: string;
  value: string;
  fontSize: number;
}) {
  const updateNode = useDocumentStore((s) => s.updateNode);
  const recordHistory = useDocumentStore((s) => s.recordHistory);
  const markDirty = useFileStore((s) => s.markDirty);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [nodeId, value]);

  const commit = () => {
    if (draft === value) return;
    recordHistory();
    const text = draft.trim();
    if (!text) return;
    updateNode(nodeId, {
      text,
      name: text.slice(0, 24),
      width: measureTextWidth(text, fontSize),
    });
    markDirty();
  };

  return (
    <textarea
      value={draft}
      rows={2}
      placeholder="Type here"
      className="min-h-[52px] w-full resize-y rounded-sm border border-border-subtle bg-input px-2 py-1.5 text-[11px] text-text-primary outline-none focus:border-accent/60"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

export function PropertiesPanel() {
  const selectedIds = useDocumentStore((s) => s.selectedIds);
  const nodes = useDocumentStore((s) => s.nodes);
  const selected = useMemo(() => {
    const id = selectedIds[0];
    if (!id) return undefined;
    const node = nodes[id];
    if (!node || node.type === "page") return undefined;
    return node;
  }, [selectedIds, nodes]);
  const selectedCount = selectedIds.length;
  const selectedNodes = useMemo(
    () =>
      selectedIds
        .map((id) => nodes[id])
        .filter((node): node is Exclude<typeof node, undefined> => !!node && node.type !== "page"),
    [selectedIds, nodes],
  );
  const allSelectedHaveFill = selectedNodes.length > 0 && selectedNodes.every((node) => "fill" in node);
  const components = useDocumentStore((s) => s.components);
  const colorStyles = useDocumentStore((s) => s.colorStyles);
  const textStyles = useDocumentStore((s) => s.textStyles);
  const updateNodeWithHistory = useDocumentStore((s) => s.updateNodeWithHistory);
  const updateSelectedWithHistory = useDocumentStore((s) => s.updateSelectedWithHistory);
  const applyColorStyleToSelected = useDocumentStore((s) => s.applyColorStyleToSelected);
  const applyTextStyleToSelected = useDocumentStore((s) => s.applyTextStyleToSelected);
  const detachInstance = useDocumentStore((s) => s.detachInstance);
  const resetInstanceOverrides = useDocumentStore((s) => s.resetInstanceOverrides);
  const alignSelected = useDocumentStore((s) => s.alignSelected);
  const markDirty = useFileStore((s) => s.markDirty);

  if (!selected) {
    return (
        <aside className="flex w-panel shrink-0 flex-col border-l border-border-subtle bg-panel" onContextMenu={(event) => event.preventDefault()}>
        <PanelHeader />
        <div className="flex-1 p-3 text-[11px] text-text-muted">
          Select a layer to edit its properties.
        </div>
      </aside>
    );
  }

  const bounds = getNodeBounds(selected);
  const hasSize =
    selected.type === "frame" ||
    selected.type === "rectangle" ||
    selected.type === "ellipse" ||
    selected.type === "polygon" ||
    selected.type === "star" ||
    selected.type === "vector" ||
    selected.type === "image" ||
    selected.type === "group" ||
    selected.type === "instance";

  const component =
    selected.type === "instance" ? components[selected.componentId] : undefined;
  const instanceRoot =
    selected.type === "instance" && component
      ? { ...component.nodes[component.rootNodeId], ...(selected.overrides[component.rootNodeId] ?? {}) }
      : null;
  const fillTarget = "fill" in selected ? selected : instanceRoot && "fill" in instanceRoot ? instanceRoot : null;
  const strokeTarget =
    "stroke" in selected ? selected : instanceRoot && "stroke" in instanceRoot ? instanceRoot : null;

  const setNumber = (key: string, value: string) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return;
    updateNodeWithHistory(selected.id, { [key]: parsed } as Partial<typeof selected>);
    markDirty();
  };

  return (
      <aside className="flex w-panel shrink-0 flex-col border-l border-border-subtle bg-panel" onContextMenu={(event) => event.preventDefault()}>
      <PanelHeader />
      <div className="flex-1 overflow-y-auto py-2">
          {selectedCount > 1 && (
            <section className="px-3 pb-2">
              <p className="text-[10px] text-text-muted">{selectedCount} layers selected</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {ALIGNMENTS.map(({ mode, label, icon: Icon }) => (
                  <IconButton key={mode} label={label} onClick={() => alignSelected(mode)}>
                    <Icon size={14} strokeWidth={1.75} />
                  </IconButton>
                ))}
              </div>
              <div className="mt-3 space-y-1">
                <PropertyRow label="Opacity">
                  <OpacityControl
                    value={selected.opacity}
                    onChange={(opacity) => {
                      updateSelectedWithHistory({ opacity });
                      markDirty();
                    }}
                  />
                </PropertyRow>
                {allSelectedHaveFill && (
                  <PropertyRow label="Fill">
                    <input
                      type="color"
                      value={
                        fillTarget && "fill" in fillTarget && fillTarget.fill?.startsWith("#")
                          ? fillTarget.fill
                          : "#0D99FF"
                      }
                      onChange={(event) => {
                        updateSelectedWithHistory({ fill: event.target.value });
                        markDirty();
                      }}
                      className="h-7 w-full cursor-pointer rounded-sm border border-border-subtle bg-transparent"
                    />
                  </PropertyRow>
                )}
              </div>
            </section>
          )}

          {selectedCount === 1 && (
          <section>
            <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              {nodeLabel(selected.type)}
            </h3>
            {bounds && selected.type !== "line" && (
              <>
                <PropertyRow label="X">
                  <PropertyInput
                    value={Math.round(selected.x)}
                    onChange={(event) => setNumber("x", event.target.value)}
                  />
                </PropertyRow>
                <PropertyRow label="Y">
                  <PropertyInput
                    value={Math.round(selected.y)}
                    onChange={(event) => setNumber("y", event.target.value)}
                  />
                </PropertyRow>
                {hasSize && "width" in selected && (
                  <>
                    <PropertyRow label="W">
                      <PropertyInput
                        value={Math.round(selected.width)}
                        onChange={(event) => setNumber("width", event.target.value)}
                      />
                    </PropertyRow>
                    <PropertyRow label="H">
                      <PropertyInput
                        value={Math.round(selected.height)}
                        onChange={(event) => setNumber("height", event.target.value)}
                      />
                    </PropertyRow>
                  </>
                )}
              </>
            )}
            <PropertyRow label="Rotation">
              <PropertyInput
                value={String(Math.round(selected.rotation))}
                onChange={(event) => setNumber("rotation", event.target.value)}
              />
            </PropertyRow>
            <PropertyRow label="Opacity">
              <OpacityControl
                value={selected.opacity}
                onChange={(opacity) => {
                  updateNodeWithHistory(selected.id, { opacity });
                  markDirty();
                }}
              />
            </PropertyRow>
          </section>
          )}

          {selectedCount === 1 && selected.type === "image" && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Image
                </h3>
                <PropertyRow label="Source">
                  <span className="truncate text-[11px] text-text-muted">
                    {selected.naturalWidth} × {selected.naturalHeight}
                  </span>
                </PropertyRow>
                <div className="px-3 py-1">
                  <button
                    type="button"
                    className="w-full rounded-sm border border-border-subtle bg-input px-2 py-1.5 text-[11px] text-text-primary hover:bg-white/8"
                    onClick={async () => {
                      const image = await pickAndReadImageFile();
                      if (!image) return;
                      const { width, height } = fitImageDisplaySize(
                        image.naturalWidth,
                        image.naturalHeight,
                      );
                      updateNodeWithHistory(selected.id, {
                        src: image.src,
                        naturalWidth: image.naturalWidth,
                        naturalHeight: image.naturalHeight,
                        width,
                        height,
                        name: image.name,
                      });
                      markDirty();
                    }}
                  >
                    Replace image…
                  </button>
                </div>
              </section>
            </>
          )}

          {selectedCount === 1 && selected.type === "instance" && component && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Component
                </h3>
                <PropertyRow label="Source">
                  <span className="truncate text-[11px] text-text-secondary">{component.name}</span>
                </PropertyRow>
                <div className="flex gap-1 px-3 pt-1">
                  <button
                    type="button"
                    className="flex-1 rounded-sm border border-border-subtle px-2 py-1 text-[11px] text-text-secondary hover:bg-white/8"
                    onClick={() => {
                      detachInstance(selected.id);
                      markDirty();
                    }}
                  >
                    Detach
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-sm border border-border-subtle px-2 py-1 text-[11px] text-text-secondary hover:bg-white/8"
                    onClick={() => {
                      resetInstanceOverrides(selected.id);
                      markDirty();
                    }}
                  >
                    Reset overrides
                  </button>
                </div>
              </section>
            </>
          )}

          {selectedCount === 1 && fillTarget && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Fill
                </h3>
                <PropertyRow label="Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fillTarget.fill?.startsWith("#") ? fillTarget.fill : "#0D99FF"}
                      onChange={(event) => {
                        updateNodeWithHistory(selected.id, { fill: event.target.value } as Partial<typeof selected>);
                        markDirty();
                      }}
                      className="h-7 w-7 cursor-pointer rounded-sm border border-border-subtle bg-transparent p-0"
                    />
                    <PropertyInput
                      value={fillTarget.fill ?? ""}
                      className="font-mono"
                      onChange={(event) => {
                        updateNodeWithHistory(selected.id, { fill: event.target.value } as Partial<typeof selected>);
                        markDirty();
                      }}
                    />
                  </div>
                </PropertyRow>
                <PropertyRow label="Style">
                  <select
                    value={selected.colorStyleId ?? ""}
                    onChange={(event) => {
                      const styleId = event.target.value;
                      if (styleId) {
                        applyColorStyleToSelected(styleId);
                      } else {
                        updateNodeWithHistory(selected.id, { colorStyleId: undefined });
                      }
                      markDirty();
                    }}
                    className="h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary outline-none"
                  >
                    <option value="">None</option>
                    {Object.values(colorStyles).map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.name}
                      </option>
                    ))}
                  </select>
                </PropertyRow>
                {"fillGradient" in fillTarget && (
                  <>
                    <PropertyRow label="Gradient">
                      <button
                        type="button"
                        className="h-7 rounded-sm border border-border-subtle px-2 text-[11px] text-text-secondary hover:bg-white/8"
                        onClick={() => {
                          if ("fillGradient" in selected && selected.fillGradient) {
                            updateNodeWithHistory(selected.id, { fillGradient: undefined });
                          } else if ("fillGradient" in fillTarget && fillTarget.fillGradient) {
                            updateNodeWithHistory(selected.id, { fillGradient: undefined } as Partial<typeof selected>);
                          } else {
                            updateNodeWithHistory(selected.id, {
                              fillGradient: { start: fillTarget.fill, end: "#0D99FF", angle: 90 },
                            } as Partial<typeof selected>);
                          }
                          markDirty();
                        }}
                      >
                        {"fillGradient" in fillTarget && fillTarget.fillGradient ? "Disable" : "Enable"}
                      </button>
                    </PropertyRow>
                    {"fillGradient" in fillTarget && fillTarget.fillGradient && (
                      <>
                        <PropertyRow label="Start">
                          <input
                            type="color"
                            value={fillTarget.fillGradient.start}
                            onChange={(event) => {
                              updateNodeWithHistory(selected.id, {
                                fillGradient: { ...fillTarget.fillGradient!, start: event.target.value },
                              } as Partial<typeof selected>);
                              markDirty();
                            }}
                            className="h-7 w-full cursor-pointer rounded-sm border border-border-subtle bg-transparent p-0"
                          />
                        </PropertyRow>
                        <PropertyRow label="End">
                          <input
                            type="color"
                            value={fillTarget.fillGradient.end}
                            onChange={(event) => {
                              updateNodeWithHistory(selected.id, {
                                fillGradient: { ...fillTarget.fillGradient!, end: event.target.value },
                              } as Partial<typeof selected>);
                              markDirty();
                            }}
                            className="h-7 w-full cursor-pointer rounded-sm border border-border-subtle bg-transparent p-0"
                          />
                        </PropertyRow>
                        <PropertyRow label="Angle">
                          <PropertyInput
                            value={String(fillTarget.fillGradient.angle)}
                            onChange={(event) => {
                              const parsed = Number.parseFloat(event.target.value);
                              if (Number.isNaN(parsed)) return;
                              updateNodeWithHistory(selected.id, {
                                fillGradient: { ...fillTarget.fillGradient!, angle: parsed },
                              } as Partial<typeof selected>);
                              markDirty();
                            }}
                          />
                        </PropertyRow>
                      </>
                    )}
                  </>
                )}
              </section>
            </>
          )}

          {selectedCount === 1 && selected.type === "line" && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Line
                </h3>
                <PropertyRow label="Path">
                  <select
                    value={selected.lineStyle ?? "straight"}
                    onChange={(event) => {
                      updateNodeWithHistory(selected.id, { lineStyle: event.target.value as LineStyle });
                      markDirty();
                    }}
                    className="h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary outline-none"
                  >
                    <option value="straight">Straight</option>
                    <option value="curved">Curved</option>
                  </select>
                </PropertyRow>
                {(selected.lineStyle ?? "straight") === "curved" && (
                  <PropertyRow label="Bend">
                    <input
                      type="range"
                      min={-120}
                      max={120}
                      value={selected.curveOffsetY ?? 0}
                      onChange={(event) => {
                        updateNodeWithHistory(selected.id, {
                          curveOffsetY: Number(event.target.value),
                        });
                        markDirty();
                      }}
                      className="h-1 w-full accent-accent"
                    />
                  </PropertyRow>
                )}
                <PropertyRow label="Dash">
                  <select
                    value={selected.lineDash ?? "solid"}
                    onChange={(event) => {
                      updateNodeWithHistory(selected.id, { lineDash: event.target.value as LineDash });
                      markDirty();
                    }}
                    className="h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary outline-none"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </PropertyRow>
                <PropertyRow label="Start">
                  <select
                    value={selected.startEndpoint ?? "none"}
                    onChange={(event) => {
                      updateNodeWithHistory(selected.id, {
                        startEndpoint: event.target.value as LineEndpointStyle,
                      });
                      markDirty();
                    }}
                    className="h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary outline-none"
                  >
                    {LINE_ENDPOINT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </PropertyRow>
                <PropertyRow label="End">
                  <select
                    value={selected.endEndpoint ?? "none"}
                    onChange={(event) => {
                      updateNodeWithHistory(selected.id, {
                        endEndpoint: event.target.value as LineEndpointStyle,
                      });
                      markDirty();
                    }}
                    className="h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary outline-none"
                  >
                    {LINE_ENDPOINT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </PropertyRow>
                {(selected.startAnchor || selected.endAnchor) && (
                  <PropertyRow label="Anchors">
                    <button
                      type="button"
                      className="h-7 w-full rounded-sm border border-border-subtle px-2 text-[11px] text-text-secondary hover:bg-white/8"
                      onClick={() => {
                        updateNodeWithHistory(selected.id, { startAnchor: undefined, endAnchor: undefined });
                        markDirty();
                      }}
                    >
                      Detach from shapes
                    </button>
                  </PropertyRow>
                )}
              </section>
            </>
          )}

          {selectedCount === 1 && strokeTarget && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Stroke
                </h3>
                <PropertyRow label="Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={strokeTarget.stroke?.startsWith("#") ? strokeTarget.stroke : "#FFFFFF"}
                      onChange={(event) => {
                        updateNodeWithHistory(selected.id, { stroke: event.target.value } as Partial<typeof selected>);
                        markDirty();
                      }}
                      className="h-7 w-7 cursor-pointer rounded-sm border border-border-subtle bg-transparent p-0"
                    />
                    <PropertyInput
                      value={strokeTarget.stroke ?? ""}
                      className="font-mono"
                      onChange={(event) => {
                        updateNodeWithHistory(selected.id, { stroke: event.target.value } as Partial<typeof selected>);
                        markDirty();
                      }}
                    />
                  </div>
                </PropertyRow>
                {"strokeWidth" in strokeTarget && (
                  <PropertyRow label="Weight">
                    <PropertyInput
                      value={String(strokeTarget.strokeWidth)}
                      onChange={(event) => setNumber("strokeWidth", event.target.value)}
                    />
                  </PropertyRow>
                )}
              </section>
            </>
          )}

          {selectedCount === 1 && selected.type === "polygon" && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Polygon
                </h3>
                <PropertyRow label="Sides">
                  <PropertyInput
                    value={String(selected.sides)}
                    onChange={(event) => {
                      const parsed = Number.parseInt(event.target.value, 10);
                      if (!Number.isNaN(parsed)) {
                        updateNodeWithHistory(selected.id, { sides: Math.min(12, Math.max(3, parsed)) });
                        markDirty();
                      }
                    }}
                  />
                </PropertyRow>
              </section>
            </>
          )}

          {selectedCount === 1 && selected.type === "star" && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Star
                </h3>
                <PropertyRow label="Points">
                  <PropertyInput
                    value={String(selected.points)}
                    onChange={(event) => {
                      const parsed = Number.parseInt(event.target.value, 10);
                      if (!Number.isNaN(parsed)) {
                        updateNodeWithHistory(selected.id, { points: Math.min(12, Math.max(3, parsed)) });
                        markDirty();
                      }
                    }}
                  />
                </PropertyRow>
                <PropertyRow label="Inner">
                  <PropertyInput
                    value={String(Math.round(selected.innerRadiusRatio * 100))}
                    onChange={(event) => {
                      const parsed = Number.parseFloat(event.target.value);
                      if (!Number.isNaN(parsed)) {
                        updateNodeWithHistory(selected.id, {
                          innerRadiusRatio: Math.min(90, Math.max(10, parsed)) / 100,
                        });
                        markDirty();
                      }
                    }}
                  />
                </PropertyRow>
              </section>
            </>
          )}

          {selectedCount === 1 && EFFECT_NODE_TYPES.has(selected.type) && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Effects
                </h3>
                <DropShadowControls
                  effects={"effects" in selected ? selected.effects : undefined}
                  onChange={(effects) => {
                    updateNodeWithHistory(selected.id, { effects } as Partial<typeof selected>);
                    markDirty();
                  }}
                />
              </section>
            </>
          )}

          {selectedCount === 1 && selected.type === "rectangle" && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Corner radius
                </h3>
                <PropertyRow label="Radius">
                  <PropertyInput
                    value={String(selected.cornerRadius)}
                    onChange={(event) => setNumber("cornerRadius", event.target.value)}
                  />
                </PropertyRow>
              </section>
            </>
          )}

          {selectedCount === 1 && selected.type === "text" && (
            <>
              <div className="my-2 h-px bg-border-subtle" />
              <section>
                <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Text
                </h3>
                <PropertyRow label="Content">
                  <TextContentField nodeId={selected.id} value={selected.text} fontSize={selected.fontSize} />
                </PropertyRow>
                <PropertyRow label="Size">
                  <PropertyInput
                    value={String(selected.fontSize)}
                    onChange={(event) => {
                      const parsed = Number.parseFloat(event.target.value);
                      if (Number.isNaN(parsed)) return;
                      updateNodeWithHistory(selected.id, {
                        fontSize: parsed,
                        width: measureTextWidth(selected.text, parsed),
                      });
                      markDirty();
                    }}
                  />
                </PropertyRow>
                <PropertyRow label="Font">
                  <select
                    value={selected.fontFamily}
                    onChange={(event) => {
                      updateNodeWithHistory(selected.id, { fontFamily: event.target.value });
                      markDirty();
                    }}
                    className="h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary outline-none"
                  >
                    {FONT_FAMILIES.map((family) => (
                      <option key={family} value={family}>
                        {family.split(",")[0]}
                      </option>
                    ))}
                  </select>
                </PropertyRow>
                <PropertyRow label="Weight">
                  <select
                    value={String(selected.fontWeight)}
                    onChange={(event) => {
                      updateNodeWithHistory(selected.id, { fontWeight: Number(event.target.value) });
                      markDirty();
                    }}
                    className="h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary outline-none"
                  >
                    <option value="400">Regular</option>
                    <option value="600">Semibold</option>
                    <option value="700">Bold</option>
                  </select>
                </PropertyRow>
                <PropertyRow label="Align">
                  <select
                    value={selected.textAlign}
                    onChange={(event) => {
                      updateNodeWithHistory(selected.id, { textAlign: event.target.value as TextAlign });
                      markDirty();
                    }}
                    className="h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary outline-none"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </PropertyRow>
                <PropertyRow label="Style">
                  <select
                    value={selected.textStyleId ?? ""}
                    onChange={(event) => {
                      const styleId = event.target.value;
                      if (styleId) {
                        applyTextStyleToSelected(styleId);
                      } else {
                        updateNodeWithHistory(selected.id, { textStyleId: undefined });
                      }
                      markDirty();
                    }}
                    className="h-7 w-full rounded-sm border border-border-subtle bg-input px-2 text-[11px] text-text-primary outline-none"
                  >
                    <option value="">None</option>
                    {Object.values(textStyles).map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.name}
                      </option>
                    ))}
                  </select>
                </PropertyRow>
                <PropertyRow label="Line H">
                  <PropertyInput
                    value={String(selected.lineHeight)}
                    onChange={(event) => {
                      const parsed = Number.parseFloat(event.target.value);
                      if (Number.isNaN(parsed)) return;
                      updateNodeWithHistory(selected.id, { lineHeight: parsed });
                      markDirty();
                    }}
                  />
                </PropertyRow>
              </section>
            </>
          )}
        </div>
    </aside>
  );
}

function PanelHeader() {
  return (
    <div className="border-b border-border-subtle px-3 py-2 text-[11px] font-medium text-text-secondary">
      Design
    </div>
  );
}
