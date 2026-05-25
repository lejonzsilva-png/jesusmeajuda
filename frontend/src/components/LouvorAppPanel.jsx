import { useState, useRef } from "react";
import { useLouvorApp } from "@/hooks/useLouvorApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plug, PlugZap, ChevronDown, ChevronUp, RefreshCw, Settings, X,
  Calendar, Music, Download, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatDate(iso) {
  if (!iso) return "";
  try {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return iso;
  }
}

function ConfigForm({ config, onSave, onCancel }) {
  const [url, setUrl] = useState(config.url || "");
  const [apiKey, setApiKey] = useState(config.apiKey || "");
  const [showKey, setShowKey] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim() || !apiKey.trim()) {
      toast.error("Preencha o URL e a API Key.");
      return;
    }
    onSave(url, apiKey);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 bg-muted/30 rounded-xl border border-border">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Cole o <strong>URL do servidor</strong> e a <strong>API Key</strong> do LouvorApp.
        Encontra a API Key em <em>Perfil → Integração/API</em>.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">URL do servidor</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://meuservidor.onrender.com"
          className="h-8 text-xs font-mono"
          data-testid="input-louvorapp-url"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">API Key</label>
        <div className="relative">
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type={showKey ? "text" : "password"}
            placeholder="lvr_xxxxxxxxxxxx"
            className="h-8 text-xs font-mono pr-16"
            data-testid="input-louvorapp-apikey"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showKey ? "ocultar" : "mostrar"}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1 h-8 text-xs" data-testid="button-louvorapp-save-config">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Ligar
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

export function LouvorAppPanel({ onLoadSetlist }) {
  const {
    config, isConfigured, updateConfig, clearConfig,
    scales, loading, error, lastFetch, fetchScales, convertScaleToSongs,
  } = useLouvorApp();

  const [expanded, setExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [confirmLoad, setConfirmLoad] = useState(null); // scale object to load
  const hasFetchedRef = useRef(false);

  function handleToggleExpand() {
    const next = !expanded;
    setExpanded(next);
    // Auto-fetch when first opening if configured and never fetched
    if (next && isConfigured && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchScales(true);
    }
  }

  function handleSaveConfig(url, apiKey) {
    updateConfig(url, apiKey);
    setShowConfig(false);
    hasFetchedRef.current = false;
    // Auto-fetch after config saved
    setTimeout(() => {
      hasFetchedRef.current = true;
      fetchScales(true);
    }, 100);
    toast.success("Ligado ao LouvorApp!");
  }

  function handleDisconnect() {
    clearConfig();
    hasFetchedRef.current = false;
    toast.success("Desligado do LouvorApp.");
  }

  function handleRefresh() {
    fetchScales(true);
  }

  function handleLoadScale(scale) {
    // If there are already songs, ask for confirmation
    setConfirmLoad(scale);
  }

  function confirmLoadScale() {
    if (!confirmLoad) return;
    const songs = convertScaleToSongs(confirmLoad);
    if (songs.length === 0) {
      toast.error("Esta escala não tem músicas no setlist.");
      setConfirmLoad(null);
      return;
    }
    onLoadSetlist(songs);
    toast.success(`Setlist "${confirmLoad.title}" carregado — ${songs.length} música${songs.length !== 1 ? "s" : ""}!`);
    setConfirmLoad(null);
  }

  return (
    <div className="flex flex-col gap-2" data-testid="louvorapp-panel">
      {/* Header toggle */}
      <button
        onClick={handleToggleExpand}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border transition-all text-left
          ${expanded
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-border/80"
          }`}
        data-testid="button-louvorapp-toggle"
      >
        {isConfigured
          ? <PlugZap className="w-4 h-4 shrink-0" />
          : <Plug className="w-4 h-4 shrink-0" />
        }
        <span className="flex-1 text-xs font-bold uppercase tracking-wider">LouvorApp</span>
        {isConfigured && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Ligado" />
        )}
        {expanded ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {/* Panel body */}
      {expanded && (
        <div className="flex flex-col gap-3">
          {/* Not configured yet */}
          {!isConfigured && !showConfig && (
            <div className="flex flex-col gap-2 items-center py-4 text-center text-muted-foreground">
              <Plug className="w-8 h-8 opacity-30" />
              <p className="text-xs">Ligue ao LouvorApp para importar escalas diretamente.</p>
              <Button
                size="sm"
                className="h-7 text-xs mt-1"
                onClick={() => setShowConfig(true)}
                data-testid="button-louvorapp-connect"
              >
                <Settings className="w-3.5 h-3.5 mr-1" />
                Configurar ligação
              </Button>
            </div>
          )}

          {/* Config form (for first time or editing) */}
          {showConfig && (
            <ConfigForm
              config={config}
              onSave={handleSaveConfig}
              onCancel={isConfigured ? () => setShowConfig(false) : null}
            />
          )}

          {/* Connected state */}
          {isConfigured && !showConfig && (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-1.5">
                <span className="flex-1 text-[10px] text-muted-foreground">
                  {lastFetch
                    ? `Atualizado ${lastFetch.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`
                    : "Pronto para carregar"}
                </span>
                <button
                  onClick={() => setShowConfig(true)}
                  className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                  title="Editar configuração"
                  data-testid="button-louvorapp-edit-config"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDisconnect}
                  className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-destructive transition-colors"
                  title="Desligar"
                  data-testid="button-louvorapp-disconnect"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] gap-1"
                  onClick={handleRefresh}
                  disabled={loading}
                  data-testid="button-louvorapp-refresh"
                >
                  {loading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <RefreshCw className="w-3 h-3" />
                  }
                  {loading ? "A carregar..." : "Atualizar"}
                </Button>
              </div>

              {/* Error state */}
              {error && (
                <div className="flex items-start gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive leading-relaxed">{error}</p>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && scales.length === 0 && (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {/* Empty */}
              {!loading && !error && scales.length === 0 && lastFetch && (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Nenhuma escala futura encontrada.</p>
                </div>
              )}

              {/* Scales list */}
              {scales.length > 0 && (
                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5">
                  {scales.map((scale) => {
                    const songCount = scale.setlist?.length ?? 0;
                    return (
                      <div
                        key={scale.id}
                        className="flex items-start gap-2.5 p-2.5 bg-muted/20 hover:bg-muted/40 border border-border rounded-lg transition-colors group"
                        data-testid={`louvorapp-scale-${scale.id}`}
                      >
                        {/* Date block */}
                        <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md px-2 py-1 shrink-0 min-w-[36px]">
                          <span className="text-base font-bold text-primary leading-none">
                            {scale.date?.split("-")[2] ?? "--"}
                          </span>
                          <span className="text-[9px] font-bold text-primary/70 uppercase tracking-wide">
                            {scale.date
                              ? new Date(scale.date + "T12:00:00").toLocaleString("pt-PT", { month: "short" })
                              : "---"}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate leading-tight">{scale.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Music className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground">
                              {songCount} música{songCount !== 1 ? "s" : ""}
                            </span>
                            {scale.time && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{scale.time}</Badge>
                            )}
                          </div>
                          {/* Mini setlist preview */}
                          {songCount > 0 && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                              {scale.setlist.slice(0, 3).map((s) => s.title).join(" · ")}
                              {songCount > 3 ? ` +${songCount - 3}` : ""}
                            </p>
                          )}
                        </div>

                        {/* Load button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px] gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleLoadScale(scale)}
                          disabled={songCount === 0}
                          title={songCount === 0 ? "Sem músicas nesta escala" : "Carregar setlist"}
                          data-testid={`button-louvorapp-load-${scale.id}`}
                        >
                          <Download className="w-3 h-3" />
                          Carregar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Confirm load dialog */}
      <AlertDialog open={!!confirmLoad} onOpenChange={(o) => { if (!o) setConfirmLoad(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Carregar setlist?</AlertDialogTitle>
            <AlertDialogDescription>
              O setlist atual será substituído pelas{" "}
              <strong>{confirmLoad?.setlist?.length ?? 0} músicas</strong> da escala{" "}
              <strong>"{confirmLoad?.title}"</strong> ({formatDate(confirmLoad?.date)}).
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-louvorapp-cancel-load">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLoadScale} data-testid="button-louvorapp-confirm-load">
              <Download className="w-4 h-4 mr-1" />
              Carregar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
