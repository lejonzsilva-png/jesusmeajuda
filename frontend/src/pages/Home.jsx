import { useState, useEffect, useCallback, useRef } from "react";
import { useSetlist } from "@/hooks/useSetlist";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useMetronome } from "@/hooks/useMetronome";
import { SetlistPanel } from "@/components/SetlistPanel";
import { LouvorAppPanel } from "@/components/LouvorAppPanel";
import { Metronome } from "@/components/Metronome";
import { ShowMode } from "@/components/ShowMode";
import { Button } from "@/components/ui/button";
import { Maximize2, Lightbulb, LightbulbOff } from "lucide-react";
import { DEFAULT_TIME_SIGNATURE, defaultAccents, getSubdivisionById } from "@/types";

export default function Home() {
  const {
    songs,
    addSong, updateSong, removeSong, reorderSongs, clearSetlist,
    exportSetlist, importSetlist, loadSongs,
  } = useSetlist();

  const [browsingId, setBrowsingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMode, setShowMode] = useState(false);

  // Free-play state (no song selected)
  const [freeBpm, setFreeBpm] = useState(120);
  const [freeSubdivision, setFreeSubdivision] = useState("none");
  const [freeAccents, setFreeAccents] = useState(defaultAccents(DEFAULT_TIME_SIGNATURE.beats));

  // Overrides for the currently active song
  const [bpmOverride, setBpmOverride] = useState(null);
  const [subdivisionOverride, setSubdivisionOverride] = useState(null);
  const [accentsOverride, setAccentsOverride] = useState(null);

  // Keep wake lock while metronome is playing
  const { supported: wakeSupported, held: wakeHeld } = useWakeLock(isPlaying);

  const songsRef = useRef(songs);
  songsRef.current = songs;
  const browsingIdRef = useRef(browsingId);
  browsingIdRef.current = browsingId;
  const playingIdRef = useRef(playingId);
  playingIdRef.current = playingId;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const browsingSong = songs.find((s) => s.id === browsingId) ?? null;
  const playingSong = songs.find((s) => s.id === playingId) ?? null;

  useEffect(() => {
    setBpmOverride(null);
    setSubdivisionOverride(null);
    setAccentsOverride(null);
  }, [playingId]);

  const activeSong = playingSong ?? browsingSong;
  const effectiveSong = activeSong
    ? {
        ...activeSong,
        bpm: bpmOverride ?? activeSong.bpm,
        subdivision: subdivisionOverride ?? activeSong.subdivision ?? "none",
        accents:
          accentsOverride && accentsOverride.length === activeSong.timeSignature.beats
            ? accentsOverride
            : (activeSong.accents && activeSong.accents.length === activeSong.timeSignature.beats
                ? activeSong.accents
                : defaultAccents(activeSong.timeSignature.beats)),
      }
    : {
        id: "__free__",
        title: "Free Play",
        bpm: freeBpm,
        timeSignature: DEFAULT_TIME_SIGNATURE,
        subdivision: freeSubdivision,
        accents: freeAccents,
      };

  // Single metronome instance lifted to the parent so it keeps running
  // when entering/leaving Show Mode without restarting the click.
  const effectiveSubdivision = getSubdivisionById(effectiveSong.subdivision);
  const { currentBeat, currentSub, isAccent, beatTick } = useMetronome({
    bpm: effectiveSong.bpm,
    timeSignature: effectiveSong.timeSignature,
    isPlaying,
    subdivision: effectiveSubdivision,
    accents: effectiveSong.accents,
  });

  const handleRemoveSong = useCallback((id) => {
    removeSong(id);
    if (browsingId === id) setBrowsingId(null);
    if (playingId === id) { setPlayingId(null); setIsPlaying(false); }
  }, [removeSong, browsingId, playingId]);

  const handleAddSong = useCallback((data) => {
    const newId = addSong(data);
    setBrowsingId(newId);
  }, [addSong]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      setIsPlaying(false);
    } else {
      const target = browsingIdRef.current ?? playingIdRef.current;
      if (target) setPlayingId(target);
      setIsPlaying(true);
    }
  }, []);

  const browseNext = useCallback(() => {
    const s = songsRef.current;
    if (s.length === 0) return;
    const idx = s.findIndex((x) => x.id === browsingIdRef.current);
    if (idx === -1) setBrowsingId(s[0].id);
    else if (idx < s.length - 1) setBrowsingId(s[idx + 1].id);
  }, []);

  const browsePrev = useCallback(() => {
    const s = songsRef.current;
    if (s.length === 0) return;
    const idx = s.findIndex((x) => x.id === browsingIdRef.current);
    if (idx === -1) setBrowsingId(s[s.length - 1].id);
    else if (idx > 0) setBrowsingId(s[idx - 1].id);
  }, []);

  const handleBpmChange = useCallback((bpm) => {
    const clamped = Math.min(300, Math.max(30, Math.round(bpm)));
    if (activeSong) setBpmOverride(clamped);
    else setFreeBpm(clamped);
  }, [activeSong]);

  const handleResetBpm = useCallback(() => { setBpmOverride(null); }, []);

  const handleSubdivisionChange = useCallback((id) => {
    if (activeSong) setSubdivisionOverride(id);
    else setFreeSubdivision(id);
  }, [activeSong]);

  const handleAccentsChange = useCallback((next) => {
    if (activeSong) setAccentsOverride(next);
    else setFreeAccents(next);
  }, [activeSong]);

  const enteringFullscreenRef = useRef(false);

  const enterShowMode = useCallback(async () => {
    setShowMode(true);
    enteringFullscreenRef.current = true;
    // Try to also engage browser fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* user cancelled */ }
    // Release the guard shortly after the request settles
    setTimeout(() => { enteringFullscreenRef.current = false; }, 500);
  }, []);

  const exitShowMode = useCallback(async () => {
    setShowMode(false);
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* noop */ }
    }
  }, []);

  // If user exits fullscreen via browser UI, also exit show mode.
  // Ignore the transient fullscreenchange that fires while we are *entering*.
  useEffect(() => {
    function onFs() {
      if (enteringFullscreenRef.current) return;
      if (!document.fullscreenElement && showMode) {
        setShowMode(false);
      }
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [showMode]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e) {
      const tag = (e.target).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target).isContentEditable) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowUp":
          e.preventDefault();
          browsePrev();
          break;
        case "ArrowDown":
          e.preventDefault();
          browseNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleBpmChange((effectiveSong?.bpm ?? 120) - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleBpmChange((effectiveSong?.bpm ?? 120) + 1);
          break;
        case "s":
        case "S":
          if (!showMode) {
            e.preventDefault();
            enterShowMode();
          }
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, browsePrev, browseNext, handleBpmChange, effectiveSong?.bpm, showMode, enterShowMode]);

  // Register Service Worker (PWA) and clear any legacy persisted setlist
  useEffect(() => {
    try { localStorage.removeItem("setlist-metronome:setlist"); } catch { /* noop */ }
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Render fullscreen Show Mode instead of normal layout when active
  if (showMode) {
    return (
      <ShowMode
        song={effectiveSong}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onClose={exitShowMode}
        bpmOverride={bpmOverride}
        onBpmChange={handleBpmChange}
        currentBeat={currentBeat}
        currentSub={currentSub}
        isAccent={isAccent}
        beatTick={beatTick}
      />
    );
  }

  return (
    <div className="relative z-10 h-screen flex flex-col overflow-hidden" data-testid="home-page">
      <header className="border-b border-border px-4 sm:px-6 py-2.5 flex items-center gap-3 backdrop-blur-sm shrink-0">
        <img
          src="/logo.png"
          alt="Setlist Metrônomo"
          className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_0_8px_hsl(var(--primary)/0.25)]"
          data-testid="app-logo"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-base font-display font-bold tracking-wide text-foreground leading-none uppercase">
            Setlist Metrônomo
          </h1>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
            Metrônomo sincronizado com setlist · subdivisões e acentos
          </p>
        </div>

        {wakeSupported && (
          <div
            className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] uppercase tracking-widest ${
              wakeHeld ? "bg-primary/10 border-primary/40 text-primary" : "bg-muted/40 border-border text-muted-foreground/60"
            }`}
            title={wakeHeld ? "Tela mantida acesa (Wake Lock ativo)" : "Wake Lock disponível, ativa ao tocar"}
            data-testid="wake-indicator"
          >
            {wakeHeld ? <Lightbulb className="w-3 h-3" /> : <LightbulbOff className="w-3 h-3" />}
            {wakeHeld ? "Acesa" : "Wake"}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5"
          onClick={enterShowMode}
          data-testid="button-show-mode"
          title="Modo Show (atalho: S)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Modo Show
          <kbd className="hidden sm:inline bg-muted/60 px-1 rounded text-[9px] ml-1">S</kbd>
        </Button>

        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-muted/40 border border-border text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Local
        </div>
      </header>

      <main className="flex-1 grid grid-cols-[340px_1fr] sm:grid-cols-[380px_1fr] lg:grid-cols-[420px_1fr] overflow-hidden min-h-0">
        <div className="border-r border-border p-3 sm:p-4 flex flex-col overflow-hidden min-h-0 gap-4">
          <SetlistPanel
            songs={songs}
            browsingId={browsingId}
            playingId={playingId}
            isPlaying={isPlaying}
            onSelect={setBrowsingId}
            onAdd={handleAddSong}
            onUpdate={updateSong}
            onRemove={handleRemoveSong}
            onReorder={reorderSongs}
            onClear={clearSetlist}
            onExport={exportSetlist}
            onImport={importSetlist}
          />
          {/* LouvorApp integration — import scales as setlist */}
          <div className="shrink-0 border-t border-border pt-3">
            <LouvorAppPanel onLoadSetlist={loadSongs} />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 gap-5 overflow-y-auto">
          <div className="text-center w-full px-2 overflow-hidden animate-fade-in-up">
            {playingSong ? (
              <>
                <p
                  className="text-6xl sm:text-8xl font-display font-bold text-foreground leading-tight truncate"
                  style={{
                    textShadow:
                      "0 0 18px hsl(var(--primary) / 0.55), 0 0 6px hsl(var(--primary) / 0.35)",
                  }}
                  data-testid="text-playing-title"
                >
                  {playingSong.title}
                </p>
                {playingSong.key && (
                  <p className="text-5xl sm:text-7xl font-display font-bold text-primary mt-1" data-testid="text-playing-key">
                    <span className="text-2xl sm:text-4xl text-muted-foreground font-semibold mr-2">TOM:</span>
                    {playingSong.key}
                  </p>
                )}
                {playingSong.notes && (
                  <p className="text-xs sm:text-sm text-muted-foreground/80 mt-2 italic max-w-md mx-auto">
                    {playingSong.notes}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xl sm:text-2xl font-display font-semibold text-muted-foreground italic tracking-[0.25em] uppercase">
                {browsingSong ? `▶ ${browsingSong.title}` : "Free Play"}
              </p>
            )}
          </div>

          <div className="w-full max-w-3xl bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/30">
            <Metronome
              playingSong={effectiveSong}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              bpmOverride={activeSong ? bpmOverride : null}
              onBpmChange={handleBpmChange}
              onResetBpm={handleResetBpm}
              subdivisionId={effectiveSong.subdivision}
              onSubdivisionChange={handleSubdivisionChange}
              accents={effectiveSong.accents}
              onAccentsChange={handleAccentsChange}
              currentBeat={currentBeat}
              currentSub={currentSub}
              isAccent={isAccent}
              beatTick={beatTick}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
