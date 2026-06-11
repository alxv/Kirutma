import { PropertyInput, PropertyRow } from "@/components/ui/primitives";
import type { DropShadowEffect, VectorEffects } from "@/types/document";

const DEFAULT_SHADOW: DropShadowEffect = {
  enabled: false,
  offsetX: 4,
  offsetY: 4,
  blur: 8,
  color: "rgba(0,0,0,0.25)",
};

export function DropShadowControls({
  effects,
  onChange,
}: {
  effects?: VectorEffects;
  onChange: (effects: VectorEffects) => void;
}) {
  const shadow = effects?.dropShadow ?? DEFAULT_SHADOW;

  return (
    <>
      <PropertyRow label="Shadow">
        <button
          type="button"
          className={`rounded-sm px-2 py-1 text-[10px] transition-colors ${
            shadow.enabled
              ? "bg-white/12 text-text-primary"
              : "text-text-secondary hover:bg-white/8 hover:text-text-primary"
          }`}
          onClick={() => {
            onChange({
              ...effects,
              dropShadow: { ...shadow, enabled: !shadow.enabled },
            });
          }}
        >
          {shadow.enabled ? "On" : "Off"}
        </button>
      </PropertyRow>
      {shadow.enabled && (
        <>
          <PropertyRow label="X offset">
            <PropertyInput
              value={String(shadow.offsetX)}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value);
                if (Number.isNaN(parsed)) return;
                onChange({ ...effects, dropShadow: { ...shadow, offsetX: parsed } });
              }}
            />
          </PropertyRow>
          <PropertyRow label="Y offset">
            <PropertyInput
              value={String(shadow.offsetY)}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value);
                if (Number.isNaN(parsed)) return;
                onChange({ ...effects, dropShadow: { ...shadow, offsetY: parsed } });
              }}
            />
          </PropertyRow>
          <PropertyRow label="Blur">
            <PropertyInput
              value={String(shadow.blur)}
              onChange={(event) => {
                const parsed = Number.parseFloat(event.target.value);
                if (Number.isNaN(parsed)) return;
                onChange({ ...effects, dropShadow: { ...shadow, blur: Math.max(0, parsed) } });
              }}
            />
          </PropertyRow>
        </>
      )}
    </>
  );
}
