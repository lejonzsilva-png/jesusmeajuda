import { useEffect } from "react";
import { Play, Pause, X, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_TIME_SIGNATURE, defaultAccents } from "@/types";

/**
 * Fullscreen "Show Mode" — minimal layout for live performance.
 * Receives the metronome state as props (lifted to the parent) so the
 * scheduler keeps running uninterrupted when entering/leaving Show Mode.
 * Setlist navigation has been intentionally removed — Show Mode is read-only.
 */
export function ShowMode({
  song,
  isPlaying,
  onTogglePlay,
  onClose,
  bpmOverride,
  onBpmChange,
  // Metronome state (lifted)
  currentBeat,
  currentSub,
  isAccent,
  beatTick,
}) {
  const baseBpm = song?.bpm ?? 120;
  const bpm = bpmOverride ?? baseBpm;
  const timeSignature = song?.timeSignature ?? DEFAULT_TIME_SIGNATURE;
  const beats = timeSignature.beats;
  const accents = (song?.accents && song.accents.length === beats) ? song.accents : defaultAccents(beats);

  // Touch unused-but-needed dependencies for linter
  void isAccent; void beatTick;

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col select-none"
      data-testid="show-mode"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="w-7 h-7 object-contain opacity-90" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Modo Show
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-exit-show"
        >
          <Minimize className="w-4 h-4 mr-1.5" />
          Sair (ESC)
          <X className="w-4 h-4 ml-1.5" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 gap-6 overflow-hidden">
        {song && song.id !== "__free__" ? (
          <div className="text-center w-full">
            <p
              className="text-5xl sm:text-7xl md:text-8xl font-display font-bold text-foreground leading-[0.95] tracking-wide truncate"
              style={{
                textShadow:
                  "0 0 30px hsl(var(--primary) / 0.55), 0 0 10px hsl(var(--primary) / 0.4)",
              }}
              data-testid="show-title"
            >
              {song.title}
            </p>
            {song.key && (
              <p className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-primary mt-2" data-testid="show-key">
                <span className="text-xl sm:text-3xl text-muted-foreground font-semibold mr-2">TOM:</span>
                {song.key}
              </p>
            )}
            {song.notes && (
              <p className="text-sm sm:text-base text-muted-foreground/80 italic mt-3 max-w-3xl mx-auto truncate">
                {song.notes}
              </p>
            )}
          </div>
        ) : (
          <p className="text-4xl sm:text-6xl font-display font-semibold text-muted-foreground italic tracking-[0.25em] uppercase">
            Free Play
          </p>
        )}

        {/* BPM + time sig */}
        <div className="flex items-end gap-5 sm:gap-8">
          <div className="text-6xl sm:text-8xl md:text-9xl font-display font-bold text-accent tabular-nums leading-none drop-shadow-[0_0_24px_hsl(var(--accent)/0.5)]" data-testid="show-bpm">
            {bpm}
          </div>
          <div className="flex flex-col items-start pb-1 sm:pb-2">
            <span className="text-sm sm:text-lg uppercase tracking-[0.3em] text-muted-foreground">BPM</span>
            <span className="text-3xl sm:text-5xl font-display font-bold text-muted-foreground mt-1" data-testid="show-ts">
              {timeSignature.label}
            </span>
          </div>
        </div>

        {/* Beat dots */}
        <div className="flex gap-3 sm:gap-4" data-testid="show-beats">
          {Array.from({ length: beats }).map((_, i) => {
            const accent = accents[i] ?? 1;
            const isLive = isPlaying && currentBeat === i && currentSub === 0;
            const isMainAccent = accent === 2;
            const isMuted = accent === 0;
            const size = isMainAccent ? "w-6 h-6 sm:w-8 sm:h-8" : "w-5 h-5 sm:w-7 sm:h-7";
            let color = "bg-muted border-2 border-border";
            if (isLive) {
              color = isMainAccent
                ? "bg-accent shadow-[0_0_22px_hsl(var(--accent))] border-accent"
                : isMuted
                  ? "bg-muted border-2 border-primary/60"
                  : "bg-primary/80 shadow-[0_0_14px_hsl(var(--primary)/0.7)]";
            } else if (isMainAccent) {
              color = "bg-accent/25 border-2 border-accent/40 text-accent";
            } else if (isMuted) {
              color = "bg-transparent border-2 border-dashed border-border";
            }
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-75 ${size} ${color}`}
                data-testid={`show-beat-${i}`}
              />
            );
          })}
        </div>

        {/* Play / pause */}
        <button
          onClick={onTogglePlay}
          className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            isPlaying
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "bg-card border-4 border-accent text-accent hover:bg-accent/10"
          }`}
          data-testid="show-play-pause"
          aria-label={isPlaying ? "Pausar" : "Tocar"}
        >
          {isPlaying ? <Pause className="w-14 h-14 sm:w-20 sm:h-20" /> : <Play className="w-14 h-14 sm:w-20 sm:h-20 ml-2" />}
        </button>

        {/* BPM nudges */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => onBpmChange(Math.max(30, bpm - 1))} data-testid="show-bpm-minus">
            BPM −1
          </Button>
          <Button variant="outline" size="sm" onClick={() => onBpmChange(Math.min(300, bpm + 1))} data-testid="show-bpm-plus">
            BPM +1
          </Button>
        </div>
      </div>

      <div className="text-center pb-3 text-[11px] text-muted-foreground/60">
        <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">Espaço</kbd> Tocar &nbsp;
        <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">←→</kbd> BPM &nbsp;
        <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">ESC</kbd> Sair
      </div>
    </div>
  );
}
