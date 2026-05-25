import { useState, useEffect } from "react";
import { useLouvorApp } from "@/hooks/useLouvorApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlugZap, RefreshCw, Settings, X, Loader2, AlertCircle, Download,
} from "lucide-react";
import { toast } from "sonner";

function formatScaleLabel(scale) {
  if (!scale) return "";
  const date = scale.date
    ? new Date(scale.date + "T12:00:00").toLocaleDateString("pt-PT", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "";
  const count = scale.setlist?.length ?? 0;
  return `${date} — ${scale.title} (${count} música${count !== 1 ? "s" : ""})`;
}

export function LouvorAppPanel({ onLoadSetlist }) {
  const {
    config, isConfigured, updateConfig, clearConfig,
    scales, loading, error, fetchScales, convertScaleToSongs,
  } = useLouvorApp();

  const [showConfig, setShowConfig] = useState(!isConfigured);
  const [urlInput, setUrlInput]     = useState(config.url || "");
  const [keyInput, setKeyInput]     = useState(config.apiKey || "");
  const [showKey, setShowKey]       = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  /* Auto-fetch once when configured */
  useEffect(() => {
    if (isConfigured && !hasFetched) {
      setHasFetched(true);
      fetchScales(true);
    }
  }, [isConfigured, hasFetched, fetchScales]);

  /* Keep input fields in sync if config changes externally */
  useEffect(() => {
    setUrlInput(config.url || "");
    setKeyInput(config.apiKey || "");
  }, [config]);

  /* Reset selection when scales reload */
  useEffect(() => {
    setSelectedId("");
  }, [scales]);

  function handleSave(e) {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      toast.error("Preencha o URL e a API Key.");
      return;
    }
    updateConfig(urlInput, keyInput);
    setShowConfig(false);
    setHasFetched(false); // trigger auto-fetch on next render
    toast.success("Ligado ao Worship Manager!");
  }

  function handleDisconnect() {
    clearConfig();
    setShowConfig(true);
    setHasFetched(false);
    setSelectedId("");
    toast.success("Desligado.");
  }

  function handleRefresh() {
    fetchScales(true);
  }

  function handleLoad() {
    const scale = scales.find((s) => s.id === selectedId);
    if (!scale) { toast.error("Seleciona uma escala primeiro."); return; }
    const songs = convertScaleToSongs(scale);
    if (songs.length === 0) { toast.error("Esta escala não tem músicas."); return; }
    onLoadSetlist(songs, scale.title);
    toast.success(`"${scale.title}" carregado — ${songs.length} música${songs.length !== 1 ? "s" : ""}!`);
    setSelectedId("");
  }

  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/20 p-3"
      data-testid="louvorapp-panel"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <PlugZap className={`w-3.5 h-3.5 shrink-0 ${isConfigured ? "text-primary" : "text-muted-foreground"}`} />
        <span className="flex-1 text-[11px] font-bold uppercase tracking-wider text-foreground/70">
          Worship Manager
        </span>
        {isConfigured && !showConfig && (
          <>
            <button
              onClick={handleRefresh}
              disabled={loading}
              title="Atualizar escalas"
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              data-testid="button-louvorapp-refresh"
            >
              {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShowConfig(true)}
              title="Configurações"
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-louvorapp-settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        {isConfigured && showConfig && (
          <button
            onClick={() => setShowConfig(false)}
            className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Config form ── */}
      {showConfig && (
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Cole o <strong>URL do servidor</strong> e a <strong>API Key</strong> do Worship Manager
            (encontra em <em>Perfil → Integração/API</em>).
          </p>
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://meu-servidor.onrender.com"
            className="h-7 text-[11px] font-mono"
            data-testid="input-louvorapp-url"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="relative">
            <Input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              type={showKey ? "text" : "password"}
              placeholder="lvr_xxxxxxxxxxxx"
              className="h-7 text-[11px] font-mono pr-14"
              data-testid="input-louvorapp-apikey"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground"
            >
              {showKey ? "ocultar" : "mostrar"}
            </button>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1 h-7 text-xs" data-testid="button-louvorapp-save">
              Ligar
            </Button>
            {isConfigured && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={handleDisconnect}
                data-testid="button-louvorapp-disconnect"
              >
                Desligar
              </Button>
            )}
          </div>
        </form>
      )}

      {/* ── Selector + Load ── */}
      {isConfigured && !showConfig && (
        <>
          {/* Error */}
          {error && (
            <div className="flex items-start gap-1.5 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">{error}</p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && scales.length === 0 && (
            <div className="h-7 bg-muted/50 rounded animate-pulse" />
          )}

          {/* SELECT — caixa de seleção de escalas */}
          {!loading && scales.length === 0 && !error && (
            <p className="text-[10px] text-muted-foreground text-center py-1">
              Nenhuma escala futura encontrada.
            </p>
          )}

          {scales.length > 0 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-8 rounded-md border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              data-testid="select-louvorapp-scale"
            >
              <option value="" disabled>
                {loading ? "A carregar escalas..." : "Selecionar escala…"}
              </option>
              {scales.map((scale) => (
                <option key={scale.id} value={scale.id}>
                  {formatScaleLabel(scale)}
                </option>
              ))}
            </select>
          )}

          {/* Load button */}
          <Button
            size="sm"
            className="w-full h-8 text-xs gap-1.5 bg-white hover:bg-white/90 text-black border border-border shadow-sm font-semibold disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleLoad}
            disabled={!selectedId || loading}
            data-testid="button-louvorapp-load"
          >
            <Download className="w-3.5 h-3.5" />
            Carregar Setlist
          </Button>
        </>
      )}
    </div>
  );
}
