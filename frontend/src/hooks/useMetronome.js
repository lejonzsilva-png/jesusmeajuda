import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Web Audio API metronome with subdivisions and custom accents per beat.
 * Uses a scheduler-on-rAF approach (lookahead) for tight timing accuracy.
 *
 * Props:
 *  - bpm: number  (30..300)  beats-per-minute of the main beat
 *  - timeSignature: { beats, noteValue }
 *  - isPlaying: boolean
 *  - subdivision: { id, notes }  number of sub-clicks per beat (1..4)
 *  - accents: number[]  per-beat accent value (0 mute / 1 normal / 2 accent)
 *
 * Returns:
 *  - currentBeat: number  (0..beats-1)
 *  - currentSub: number   (0..subdivision.notes-1)
 *  - isAccent: boolean    true on beat 0 OR accent==2
 *  - beatTick: number     monotonically increasing tick counter (animation key)
 */
export function useMetronome({
  bpm,
  timeSignature,
  isPlaying,
  subdivision,
  accents,
}) {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentSub, setCurrentSub] = useState(0);
  const [isAccent, setIsAccent] = useState(false);
  const [beatTick, setBeatTick] = useState(0);

  const audioCtxRef = useRef(null);
  const schedulerIdRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const currentSubRef = useRef(0);
  const tickCounterRef = useRef(0);

  // Snapshot mutable props to avoid stale closures inside scheduler
  const stateRef = useRef({ bpm, timeSignature, subdivision, accents });
  stateRef.current = { bpm, timeSignature, subdivision, accents };

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Schedule a single click at audio context time `when`.
  // type: 'accent' | 'normal' | 'sub' | 'mute'
  const scheduleClick = useCallback((when, type) => {
    if (type === "mute") return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    let freq = 800;
    let peak = 0.5;
    if (type === "accent") { freq = 1500; peak = 0.85; }
    else if (type === "normal") { freq = 1000; peak = 0.55; }
    else if (type === "sub") { freq = 700; peak = 0.28; }

    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
    osc.start(when);
    osc.stop(when + 0.09);
  }, []);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    // Use a larger lookahead when the document is hidden so the metronome keeps
    // running even when setTimeout is throttled in background tabs.
    const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    const LOOKAHEAD = isHidden ? 1.5 : 0.25;
    while (nextNoteTimeRef.current < ctx.currentTime + LOOKAHEAD) {
      const s = stateRef.current;
      const beats = s.timeSignature.beats;
      const subNotes = Math.max(1, s.subdivision?.notes ?? 1);
      const noteValueFactor = 4 / s.timeSignature.noteValue;
      const secondsPerBeat = (60 / s.bpm) * noteValueFactor;
      const secondsPerSub = secondsPerBeat / subNotes;

      const beatIdx = currentBeatRef.current;
      const subIdx = currentSubRef.current;
      const accentValue = s.accents?.[beatIdx] ?? 1;

      let clickType;
      if (subIdx === 0) {
        if (accentValue === 0) clickType = "mute";
        else if (accentValue === 2) clickType = "accent";
        else clickType = "normal";
      } else {
        // Sub-clicks: skip if main beat is muted
        clickType = accentValue === 0 ? "mute" : "sub";
      }

      scheduleClick(nextNoteTimeRef.current, clickType);

      // Schedule UI update at the audio time using setTimeout
      const delayMs = Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000);
      const capturedBeat = beatIdx;
      const capturedSub = subIdx;
      const capturedAccent = accentValue;
      setTimeout(() => {
        tickCounterRef.current += 1;
        setCurrentBeat(capturedBeat);
        setCurrentSub(capturedSub);
        setIsAccent(capturedSub === 0 && capturedAccent === 2);
        setBeatTick(tickCounterRef.current);
      }, delayMs);

      // Advance counters
      nextNoteTimeRef.current += secondsPerSub;
      currentSubRef.current = (subIdx + 1) % subNotes;
      if (currentSubRef.current === 0) {
        currentBeatRef.current = (beatIdx + 1) % beats;
      }
    }
    schedulerIdRef.current = setTimeout(scheduler, 25);
  }, [scheduleClick]);

  // Keep audio context alive in background by playing a silent buffer loop.
  // Some browsers suspend AudioContext when the tab is backgrounded; an
  // ongoing audio source prevents this in most engines.
  const silentNodeRef = useRef(null);
  const startSilentKeepAlive = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || silentNodeRef.current) return;
    try {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0.0001; // effectively silent
      src.connect(gain).connect(ctx.destination);
      src.start(0);
      silentNodeRef.current = src;
    } catch { /* noop */ }
  }, []);
  const stopSilentKeepAlive = useCallback(() => {
    if (silentNodeRef.current) {
      try { silentNodeRef.current.stop(); } catch { /* noop */ }
      silentNodeRef.current = null;
    }
  }, []);

  // Re-resume audio context when document becomes visible again (some
  // mobile browsers suspend it on background).
  useEffect(() => {
    function onVis() {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (document.visibilityState === "visible" && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (schedulerIdRef.current) {
        clearTimeout(schedulerIdRef.current);
        schedulerIdRef.current = null;
      }
      stopSilentKeepAlive();
      currentBeatRef.current = 0;
      currentSubRef.current = 0;
      setCurrentBeat(0);
      setCurrentSub(0);
      setIsAccent(false);
      return;
    }
    const ctx = getCtx();
    startSilentKeepAlive();
    currentBeatRef.current = 0;
    currentSubRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    scheduler();
    return () => {
      if (schedulerIdRef.current) {
        clearTimeout(schedulerIdRef.current);
        schedulerIdRef.current = null;
      }
    };
  }, [isPlaying, getCtx, scheduler, startSilentKeepAlive, stopSilentKeepAlive]);

  // Reset position when time signature changes (avoid weird indexes)
  useEffect(() => {
    currentBeatRef.current = 0;
    currentSubRef.current = 0;
  }, [timeSignature.beats, timeSignature.noteValue]);

  return { currentBeat, currentSub, isAccent, beatTick };
}
