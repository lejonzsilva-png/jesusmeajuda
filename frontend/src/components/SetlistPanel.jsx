import { useState, useRef } from "react";
import {
  Plus, Pencil, Trash2, GripVertical, Music, Download, Upload, Play,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SongForm } from "@/components/SongForm";

export function SetlistPanel({
  songs,
  name,
  browsingId,
  playingId,
  isPlaying,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  onClear,
  onExport,
  onImport,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportName, setExportName] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  function openExportDialog() {
    setExportName(`setlist-${new Date().toISOString().slice(0, 10)}`);
    setShowExportDialog(true);
  }

  function handleExportConfirm() {
    onExport(exportName);
    setShowExportDialog(false);
    toast.success("Setlist exportado com sucesso");
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const count = await onImport(file);
      toast.success(`${count} música${count !== 1 ? "s" : ""} carregada${count !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Arquivo inválido. Use um arquivo .setlist exportado por este app.");
    }
  }

  function handleAdd(data) {
    onAdd(data);
    setShowAdd(false);
    toast.success("Música adicionada");
  }

  function handleEdit(data) {
    if (editingSong) {
      onUpdate(editingSong.id, data);
      setEditingSong(null);
      toast.success("Música atualizada");
    }
  }

  function confirmDelete(id) {
    onRemove(id);
    setConfirmDeleteId(null);
    toast.success("Música removida");
  }

  function handleDragStart(index) {
    setDragFrom(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    setDragOver(index);
  }

  function handleDrop(toIndex) {
    if (dragFrom !== null && dragFrom !== toIndex) {
      onReorder(dragFrom, toIndex);
    }
    setDragFrom(null);
    setDragOver(null);
  }

  return (
    <div className="flex flex-col h-full gap-3" data-testid="setlist-panel">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Music className="w-5 h-5 text-primary shrink-0" />
            <span className="font-display tracking-wider uppercase truncate">Setlist</span>
            <Badge variant="secondary" className="text-xs shrink-0">{songs.length}</Badge>
          </h2>
          {name && (
            <p className="text-[10px] text-primary font-medium tracking-wider uppercase truncate pl-7" title={name} data-testid="setlist-name-subtitle">
              {name}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleImportClick}
            title="Importar setlist"
            data-testid="button-import-setlist"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={openExportDialog}
            disabled={songs.length === 0}
            title="Exportar setlist"
            data-testid="button-export-setlist"
          >
            <Download className="w-4 h-4" />
          </Button>
          {songs.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmClear(true)}
              title="Limpar tudo"
              data-testid="button-clear-setlist"
              className="hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            data-testid="button-add-song"
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".setlist,.json,application/json"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-import-file"
      />

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {songs.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12" data-testid="text-empty-setlist">
            <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="mb-1">Nenhuma música no setlist.</p>
            <p>
              Clique em <strong>Adicionar</strong> para começar
            </p>
            <p className="mt-2">
              ou{" "}
              <button className="underline hover:text-primary" onClick={handleImportClick}>
                carregue um setlist salvo
              </button>
              .
            </p>
          </div>
        )}

        {songs.map((song, index) => {
          const isBrowsing = browsingId === song.id;
          const isCurrentlyPlaying = playingId === song.id;
          return (
            <div
              key={song.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
              onClick={() => onSelect(song.id)}
              data-testid={`song-item-${song.id}`}
              className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer border transition-all
                ${isBrowsing
                  ? "border-primary bg-accent/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                  : isCurrentlyPlaying
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:border-border hover:bg-muted/40"}
                ${dragOver === index ? "border-primary/60 scale-[1.01]" : ""}
              `}
            >
              <div className="text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4" />
              </div>

              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: isBrowsing
                    ? "hsl(var(--primary))"
                    : isCurrentlyPlaying
                      ? "hsl(var(--primary) / 0.3)"
                      : "hsl(var(--muted))",
                  color: isBrowsing
                    ? "hsl(var(--primary-foreground))"
                    : "hsl(var(--muted-foreground))",
                }}
              >
                {isCurrentlyPlaying && isPlaying
                  ? <Play className="w-3.5 h-3.5" />
                  : index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-foreground" data-testid={`text-song-title-${song.id}`}>
                  {song.title}
                </p>
                {song.key && (
                  <p className="text-xs text-primary/80 truncate" data-testid={`text-song-key-${song.id}`}>
                    Tom: {song.key}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="outline" className="text-xs font-mono tabular-nums px-1.5" data-testid={`badge-bpm-${song.id}`}>
                  {song.bpm}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono px-1.5" data-testid={`badge-ts-${song.id}`}>
                  {song.timeSignature.label}
                </Badge>
              </div>

              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={(e) => { e.stopPropagation(); setEditingSong(song); }}
                  data-testid={`button-edit-song-${song.id}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(song.id); }}
                  data-testid={`button-delete-song-${song.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export filename dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Exportar Setlist</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="export-name">Nome do arquivo</Label>
            <Input
              id="export-name"
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleExportConfirm(); }}
              autoFocus
              data-testid="input-export-name"
            />
            <p className="text-xs text-muted-foreground">
              Será salvo como{" "}
              <span className="font-mono text-primary">
                {(exportName.trim() || `setlist-${new Date().toISOString().slice(0, 10)}`)}.setlist
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowExportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExportConfirm} data-testid="button-export-confirm">
              <Download className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Música</DialogTitle>
          </DialogHeader>
          <SongForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingSong} onOpenChange={(open) => { if (!open) setEditingSong(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Música</DialogTitle>
          </DialogHeader>
          {editingSong && (
            <SongForm
              initial={editingSong}
              onSubmit={handleEdit}
              onCancel={() => setEditingSong(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm clear */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todo o setlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove todas as músicas. Considere exportar antes de limpar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onClear(); toast.success("Setlist limpo"); }}
              data-testid="button-confirm-clear"
            >
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete song */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => { if (!o) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover música?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete(confirmDeleteId)}
              data-testid="button-confirm-delete-song"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
