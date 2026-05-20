import { useState, useCallback } from "react";
import { DEFAULT_TIME_SIGNATURE, defaultAccents } from "@/types";

const VERSION = 1;

function normalizeSong(s) {
  const ts = s?.timeSignature && typeof s.timeSignature === "object"
    ? s.timeSignature
    : DEFAULT_TIME_SIGNATURE;
  const beats = Number(ts.beats) || DEFAULT_TIME_SIGNATURE.beats;
  const noteValue = Number(ts.noteValue) || DEFAULT_TIME_SIGNATURE.noteValue;
  const label = ts.label || `${beats}/${noteValue}`;

  let accents = Array.isArray(s.accents) ? s.accents.map((v) => Number(v) || 0) : defaultAccents(beats);
  if (accents.length !== beats) accents = defaultAccents(beats);

  return {
    id: s?.id ?? (Date.now().toString() + Math.random().toString(36).slice(2, 7)),
    title: s?.title ?? "Sem título",
    key: s?.key || undefined,
    bpm: Math.min(300, Math.max(30, Number(s?.bpm) || 120)),
    timeSignature: { beats, noteValue, label },
    subdivision: s?.subdivision ?? "none",
    accents,
    notes: s?.notes || "",
  };
}

export function useSetlist() {
  // Setlist starts empty on every app open (no localStorage persistence).
  // Users can add songs manually or import a .setlist file.
  const [songs, setSongs] = useState([]);

  const addSong = useCallback((data) => {
    const newSong = normalizeSong({ ...data, id: Date.now().toString() + Math.random().toString(36).slice(2, 7) });
    setSongs((prev) => [...prev, newSong]);
    return newSong.id;
  }, []);

  const updateSong = useCallback((id, data) => {
    setSongs((prev) => prev.map((s) => (s.id === id ? normalizeSong({ ...s, ...data }) : s)));
  }, []);

  const removeSong = useCallback((id) => {
    setSongs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const reorderSongs = useCallback((fromIndex, toIndex) => {
    setSongs((prev) => {
      if (fromIndex === toIndex) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const clearSetlist = useCallback(() => {
    setSongs([]);
  }, []);

  const exportSetlist = useCallback((filename) => {
    const payload = { version: VERSION, exportedAt: new Date().toISOString(), songs };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (filename ?? "")
      .trim()
      .replace(/[^\w\s\-áéíóúãõâêôçÁÉÍÓÚÃÕÂÊÔÇ]/g, "")
      .trim();
    a.download = `${safe || `setlist-${new Date().toISOString().slice(0, 10)}`}.setlist`;
    a.click();
    URL.revokeObjectURL(url);
  }, [songs]);

  const importSetlist = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result);
          const imported = Array.isArray(data) ? data : data.songs ?? [];
          if (!Array.isArray(imported)) throw new Error("invalid");
          const normalized = imported.map(normalizeSong);
          setSongs(normalized);
          resolve(normalized.length);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  return {
    songs,
    setSongs,
    addSong,
    updateSong,
    removeSong,
    reorderSongs,
    clearSetlist,
    exportSetlist,
    importSetlist,
  };
}
