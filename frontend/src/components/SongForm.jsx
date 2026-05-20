import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TIME_SIGNATURES,
  DEFAULT_TIME_SIGNATURE,
  MUSICAL_KEYS,
  SUBDIVISIONS,
  defaultAccents,
  getTimeSignatureByLabel,
} from "@/types";
import { AccentEditor } from "@/components/AccentEditor";

export function SongForm({ initial, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [bpm, setBpm] = useState(String(initial?.bpm ?? 120));
  const [songKey, setSongKey] = useState(initial?.key ?? "__none__");
  const [tsLabel, setTsLabel] = useState(initial?.timeSignature?.label ?? DEFAULT_TIME_SIGNATURE.label);
  const [subdivision, setSubdivision] = useState(initial?.subdivision ?? "none");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [accents, setAccents] = useState(
    initial?.accents ?? defaultAccents(initial?.timeSignature?.beats ?? DEFAULT_TIME_SIGNATURE.beats)
  );
  const [errors, setErrors] = useState({});

  // Sync accents length with time signature when it changes
  useEffect(() => {
    const ts = getTimeSignatureByLabel(tsLabel);
    setAccents((prev) => {
      if (prev.length === ts.beats) return prev;
      const next = defaultAccents(ts.beats);
      // copy over preserved values where they exist
      for (let i = 0; i < Math.min(prev.length, next.length); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  }, [tsLabel]);

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!title.trim()) errs.title = "Título é obrigatório";
    const bpmNum = Number(bpm);
    if (!bpmNum || bpmNum < 30 || bpmNum > 300) errs.bpm = "BPM entre 30 e 300";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const ts = getTimeSignatureByLabel(tsLabel);
    onSubmit({
      title: title.trim(),
      key: songKey && songKey !== "__none__" ? songKey : undefined,
      bpm: bpmNum,
      timeSignature: ts,
      subdivision,
      accents,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="song-form">
      <div className="space-y-1.5">
        <Label htmlFor="song-title">Título</Label>
        <Input
          id="song-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome da música"
          data-testid="input-song-title"
          autoFocus
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="song-bpm">BPM</Label>
          <Input
            id="song-bpm"
            type="number"
            min={30}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            data-testid="input-song-bpm"
          />
          {errors.bpm && <p className="text-xs text-destructive">{errors.bpm}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Compasso</Label>
          <Select value={tsLabel} onValueChange={setTsLabel}>
            <SelectTrigger data-testid="select-time-signature">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SIGNATURES.map((ts) => (
                <SelectItem key={ts.label} value={ts.label} data-testid={`option-ts-${ts.label}`}>
                  {ts.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tom</Label>
          <Select value={songKey} onValueChange={setSongKey}>
            <SelectTrigger data-testid="select-song-key">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" data-testid="option-key-none">
                Sem tom
              </SelectItem>
              {MUSICAL_KEYS.map((k) => (
                <SelectItem key={k} value={k} data-testid={`option-key-${k}`}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Subdivisão</Label>
          <Select value={subdivision} onValueChange={setSubdivision}>
            <SelectTrigger data-testid="select-song-subdivision">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBDIVISIONS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <AccentEditor accents={accents} onChange={setAccents} currentBeat={-1} isPlaying={false} />

      <div className="space-y-1.5">
        <Label htmlFor="song-notes">Observações</Label>
        <Textarea
          id="song-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas sobre a música, dica de intro, etc."
          rows={2}
          data-testid="input-song-notes"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" data-testid="button-save-song">
          {initial ? "Salvar" : "Adicionar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-song">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
