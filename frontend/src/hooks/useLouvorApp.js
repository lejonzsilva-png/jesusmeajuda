import { useState, useCallback } from "react";
import axios from "axios";
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
      const url = `${config.url}/api/external/scales`;
      const res = await axios.get(url, {
        params: { upcoming: upcomingOnly, limit: 50 },
        headers: { "X-API-Key": config.apiKey },
      });
      setScales(res.data);
      setLastFetch(new Date());
    } catch (e) {
      if (e.response) {
        if (e.response.status === 401) {
          setError("API Key inválida. Verifique as credenciais.");
        } else if (e.response.status === 404) {
          setError("URL não encontrado. Verifique o endereço do servidor.");
        } else {
          setError(`Erro do servidor: ${e.response.status}`);
        }
      } else if (e.request) {
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
