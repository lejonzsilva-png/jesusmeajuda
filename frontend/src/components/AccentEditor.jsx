import { Volume2, VolumeX, Zap } from "lucide-react";

/**
 * Visual editor for per-beat accent pattern.
 * Each beat cycles: normal (1) -> accent (2) -> mute (0) -> normal (1).
 */
export function AccentEditor({ accents, onChange, currentBeat, isPlaying }) {
  if (!Array.isArray(accents) || accents.length === 0) return null;

  const handleCycle = (idx) => {
    const next = [...accents];
    next[idx] = (next[idx] + 1) % 3;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2" data-testid="accent-editor">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Padrão de Acentos
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          clique para alternar
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {accents.map((value, idx) => {
          const isLive = isPlaying && currentBeat === idx;
          const base = "relative flex flex-col items-center justify-center w-12 h-14 rounded-lg border-2 transition-all select-none text-xs font-bold";
          let style;
          if (value === 2) {
            style = "border-accent bg-accent/20 text-accent";
          } else if (value === 1) {
            style = "border-border bg-muted/40 text-foreground/80";
          } else {
            style = "border-border/50 bg-muted/10 text-muted-foreground/40";
          }
          return (
            <button
              type="button"
              key={idx}
              onClick={() => handleCycle(idx)}
              data-testid={`accent-beat-${idx}`}
              className={`${base} ${style} ${isLive ? "ring-2 ring-primary scale-105" : ""}`}
              title={value === 0 ? "Mute" : value === 1 ? "Normal" : "Acento"}
            >
              <span className="text-[9px] uppercase opacity-60">{idx + 1}</span>
              {value === 2 && <Zap className="w-4 h-4 mt-0.5" />}
              {value === 1 && <Volume2 className="w-4 h-4 mt-0.5" />}
              {value === 0 && <VolumeX className="w-4 h-4 mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
