import { useState, useCallback } from "react";
import { DEFAULT_TIME_SIGNATURE, defaultAccents } from "@/types";

const STORAGE_KEY = "louvorapp:config";

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { url: "", apiKey: "" };
    return JSON.parse(raw);
  } catch {
    return { url: "", apiKey: "" };
  }
}

function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

/**
 * Converts a LouvorApp song object into the jesusmeajuda internal format.
 */
function convertSong(song) {
  const bpm = song.bpm && song.bpm >= 30 && song.bpm <= 300 ? song.bpm : 120;
  const beats = DEFAULT_TIME_SIGNATURE.beats;
  return {
    id: song.id ?? (Date.now().toString() + Math.random().toString(36).slice(2, 7)),
    title: song.title ?? "Sem título",
    key: song.key || undefined,
    bpm,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    subdivision: "none",
    accents: defaultAccents(beats),
    notes: song.artist ? `Artista: ${song.artist}` : "",
  };
}

export function useLouvorApp() {
  const [config, setConfig] = useState(() => loadConfig());
  const [scales, setScales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const isConfigured = Boolean(config.url && config.apiKey);

  const updateConfig = useCallback((url, apiKey) => {
    const trimmedUrl = url.trim().replace(/\/$/, ""); // remove trailing slash
    const next = { url: trimmedUrl, apiKey: apiKey.trim() };
    setConfig(next);
    saveConfig(next);
    // Reset previous results when config changes
    setScales([]);
    setError(null);
    setLastFetch(null);
  }, []);

  const clearConfig = useCallback(() => {
    const empty = { url: "", apiKey: "" };
    setConfig(empty);
    saveConfig(empty);
    setScales([]);
    setError(null);
    setLastFetch(null);
  }, []);

  const fetchScales = useCallback(async (upcomingOnly = true) => {
    if (!config.url || !config.apiKey) {
      setError("Configuração incompleta. Insira o URL e a API Key.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${config.url}/api/external/scales?upcoming=${upcomingOnly}&limit=50`;
      const res = await fetch(url, {
        headers: { "X-API-Key": config.apiKey },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("API Key inválida. Verifique as credenciais.");
        if (res.status === 404) throw new Error("URL não encontrado. Verifique o endereço do servidor.");
        throw new Error(`Erro do servidor: ${res.status}`);
      }
      const data = await res.json();
      setScales(data);
      setLastFetch(new Date());
    } catch (e) {
      if (e.name === "TypeError") {
        setError("Não foi possível ligar ao servidor. Verifique o URL e se o servidor está online.");
      } else {
        setError(e.message || "Erro desconhecido.");
      }
    } finally {
      setLoading(false);
    }
  }, [config]);

  /**
   * Converts a fetched LouvorApp scale's setlist into jesusmeajuda songs array.
   */
  const convertScaleToSongs = useCallback((scale) => {
    const setlist = scale.setlist ?? [];
    if (setlist.length === 0) return [];
    return setlist.map(convertSong);
  }, []);

  return {
    config,
    isConfigured,
    updateConfig,
    clearConfig,
    scales,
    loading,
    error,
    lastFetch,
    fetchScales,
    convertScaleToSongs,
  };
}
