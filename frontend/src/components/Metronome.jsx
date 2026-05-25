import { useRef, useCallback, useState, useEffect } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Hand, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_TIME_SIGNATURE,
  SUBDIVISIONS,
  defaultAccents,
} from "@/types";
import { AccentEditor } from "@/components/AccentEditor";

const TAP_TIMEOUT_MS = 2000;
const MAX_TAPS = 8;

export function Metronome({
  playingSong,
  isPlaying,
  onTogglePlay,
  bpmOverride,
  onBpmChange,
  onResetBpm,
  subdivisionId,
  onSubdivisionChange,
  accents,
  onAccentsChange,
  // Metronome state (lifted to parent so it persists across Show Mode toggle)
  currentBeat,
  currentSub,
  isAccent,
  beatTick,
}) {
  const baseBpm = playingSong?.bpm ?? 120;
  const bpm = bpmOverride ?? baseBpm;
  const timeSignature = playingSong?.timeSignature ?? DEFAULT_TIME_SIGNATURE;
  const beats = timeSignature.beats;

  const effectiveAccents =
    accents && accents.length === beats ? accents : defaultAccents(beats);

  const [beatAnimKey, setBeatAnimKey] = useState(0);
  const [beatAccent, setBeatAccent] = useState(false);
  const beatAnimKeyRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentSub !== 0) return;
    beatAnimKeyRef.current += 1;
    setBeatAnimKey(beatAnimKeyRef.current);
    setBeatAccent(isAccent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatTick, isPlaying]);

  // Tap tempo
  const tapTimestampsRef = useRef([]);
  const tapTimeoutRef = useRef(null);
  const [tapCount, setTapCount] = useState(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (
      tapTimestampsRef.current.length > 0 &&
      now - tapTimestampsRef.current[tapTimestampsRef.current.length - 1] > TAP_TIMEOUT_MS
    ) {
      tapTimestampsRef.current = [];
    }
    tapTimestampsRef.current.push(now);
    if (tapTimestampsRef.current.length > MAX_TAPS) {
      tapTimestampsRef.current = tapTimestampsRef.current.slice(-MAX_TAPS);
    }
    setTapCount(tapTimestampsRef.current.length);
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => {
      tapTimestampsRef.current = [];
      setTapCount(0);
    }, TAP_TIMEOUT_MS);
    if (tapTimestampsRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimestampsRef.current.length; i++) {
        intervals.push(tapTimestampsRef.current[i] - tapTimestampsRef.current[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      onBpmChange(Math.min(300, Math.max(30, Math.round(60000 / avg))));
    }
  }, [onBpmChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8" data-testid="metronome">
      {/* LEFT column: BPM + play */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-baseline gap-2">
          <div className="text-8xl font-display font-bold text-accent tabular-nums leading-none drop-shadow-[0_0_20px_hsl(var(--accent)/0.45)]" data-testid="text-bpm">
            {bpm}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-[0.3em]">BPM</div>
        </div>

        <div className="w-full px-1">
          <Slider
            min={30}
            max={300}
            step={1}
            value={[bpm]}
            onValueChange={([val]) => onBpmChange(val)}
            data-testid="slider-bpm"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5 uppercase tracking-widest">
            <span>30</span>
            <span>300</span>
          </div>
        </div>

        {bpmOverride !== null && playingSong && (
          <button
            className="text-[11px] text-muted-foreground underline hover:text-primary transition-colors -mt-1"
            onClick={onResetBpm}
            data-testid="button-reset-bpm"
          >
            Resetar para {baseBpm} BPM
          </button>
        )}

        {/* Time signature + beat dots */}
        <div className="flex items-center gap-4">
          <div className="text-3xl font-display font-bold text-muted-foreground" data-testid="text-time-signature">
            {timeSignature.label}
          </div>
          <div className="flex gap-2 flex-wrap justify-center" data-testid="beat-indicators">
            {Array.from({ length: beats }).map((_, i) => {
              const accent = effectiveAccents[i] ?? 1;
              const isLive = isPlaying && currentBeat === i;
              const isMuted = accent === 0;
              const isMainAccent = accent === 2;
              const size = isMainAccent ? "w-5 h-5" : "w-4 h-4";
              let color = "bg-muted border border-border";
              if (isLive && currentSub === 0) {
                color = isMainAccent
                  ? "bg-accent shadow-[0_0_10px_hsl(var(--accent))] border-accent"
                  : isMuted
                    ? "bg-muted border border-primary/50"
                    : "bg-primary/80 shadow-[0_0_6px_hsl(var(--primary)/0.6)]";
              } else if (isMainAccent) {
                color = "bg-accent/25 border border-accent/40 text-accent";
              } else if (isMuted) {
                color = "bg-transparent border border-dashed border-border";
              }
              return (
                <div
                  key={i}
                  data-testid={`beat-indicator-${i}`}
                  className={`rounded-full transition-all duration-75 ${size} ${color}`}
                />
              );
            })}
          </div>
        </div>

        {/* Play controls */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => onBpmChange(Math.max(30, bpm - 1))}
            data-testid="button-bpm-down"
          >
            <ChevronLeft className="w-7 h-7" />
          </Button>

          <div className="relative flex items-center justify-center">
            {isPlaying && (
              <div
                key={beatAnimKey}
                className={`absolute inset-0 rounded-full pointer-events-none ${
                  beatAccent ? "beat-flash-accent" : "beat-flash"
                }`}
              />
            )}
            <button
              onClick={onTogglePlay}
              className={`w-28 h-28 rounded-full flex items-center justify-center font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isPlaying
                  ? "bg-accent text-accent-foreground hover:bg-accent/90"
                  : "bg-card border-2 border-accent text-accent hover:bg-accent/10"
              }`}
              data-testid="button-play-pause"
              aria-label={isPlaying ? "Pausar" : "Tocar"}
            >
              {isPlaying ? <Pause className="w-11 h-11" /> : <Play className="w-11 h-11 ml-1" />}
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => onBpmChange(Math.min(300, bpm + 1))}
            data-testid="button-bpm-up"
          >
            <ChevronRight className="w-7 h-7" />
          </Button>
        </div>

        {/* Fine BPM nudges */}
        <div className="flex items-center justify-center gap-2 mt-1">
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => onBpmChange(Math.max(30, bpm - 5))} data-testid="button-bpm-down-5">
            <Minus className="w-3 h-3 mr-1" />5
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => onBpmChange(Math.max(30, bpm - 10))} data-testid="button-bpm-down-10">
            <Minus className="w-3 h-3 mr-1" />10
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => onBpmChange(Math.min(300, bpm + 5))} data-testid="button-bpm-up-5">
            <Plus className="w-3 h-3 mr-1" />5
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => onBpmChange(Math.min(300, bpm + 10))} data-testid="button-bpm-up-10">
            <Plus className="w-3 h-3 mr-1" />10
          </Button>
        </div>
      </div>

      {/* RIGHT column: tap tempo, subdivision, accents */}
      <div className="flex flex-col gap-4">
        <Button
          variant="outline"
          onClick={handleTap}
          className="w-full h-11 text-base font-semibold tracking-wide select-none active:scale-95 transition-transform"
          data-testid="button-tap-tempo"
        >
          <Hand className="w-5 h-5 mr-2" />
          Tap Tempo
          {tapCount >= 2 && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">({tapCount} taps)</span>
          )}
        </Button>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Subdivisão</span>
          <Select value={subdivisionId} onValueChange={onSubdivisionChange}>
            <SelectTrigger className="h-10 text-sm" data-testid="select-subdivision">
              <SelectValue placeholder="Subdivisão" />
            </SelectTrigger>
            <SelectContent>
              {SUBDIVISIONS.map((s) => (
                <SelectItem key={s.id} value={s.id} data-testid={`option-subdivision-${s.id}`}>
                  {s.label} ({s.notes}x)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AccentEditor
          accents={effectiveAccents}
          onChange={onAccentsChange}
          currentBeat={currentBeat}
          isPlaying={isPlaying}
        />

        <div className="text-center text-[11px] text-muted-foreground/60 border-t border-border pt-3 mt-auto">
          <p className="leading-relaxed">
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">Espaço</kbd> Tocar &nbsp;
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">↑↓</kbd> Navegar &nbsp;
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">←→</kbd> BPM
          </p>
        </div>
      </div>
    </div>
  );
}
