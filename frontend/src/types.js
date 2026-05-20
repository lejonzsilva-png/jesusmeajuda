export const TIME_SIGNATURES = [
  { beats: 1, noteValue: 4, label: "1/4" },
  { beats: 2, noteValue: 4, label: "2/4" },
  { beats: 3, noteValue: 4, label: "3/4" },
  { beats: 4, noteValue: 4, label: "4/4" },
  { beats: 5, noteValue: 4, label: "5/4" },
  { beats: 6, noteValue: 8, label: "6/8" },
  { beats: 7, noteValue: 8, label: "7/8" },
  { beats: 12, noteValue: 8, label: "12/8" },
];

export const DEFAULT_TIME_SIGNATURE = TIME_SIGNATURES[3]; // 4/4

export const MUSICAL_KEYS = [
  // Maiores
  "C", "C# / D♭", "D", "D# / E♭", "E", "F",
  "F# / G♭", "G", "G# / A♭", "A", "A# / B♭", "B",
  // Menores
  "Am", "A#m / B♭m", "Bm", "Cm", "C#m / D♭m", "Dm",
  "D#m / E♭m", "Em", "Fm", "F#m / G♭m", "Gm", "G#m / A♭m",
];

// Subdivisions per beat
export const SUBDIVISIONS = [
  { id: "none",      label: "Tempo",        notes: 1 },
  { id: "eighth",    label: "Colcheias",    notes: 2 },
  { id: "triplet",   label: "Tercinas",     notes: 3 },
  { id: "sixteenth", label: "Semicolcheias", notes: 4 },
];

export const DEFAULT_SUBDIVISION = SUBDIVISIONS[0];

// Accent values per beat: 0 = mute, 1 = normal, 2 = accent
export const ACCENT_LEVELS = [0, 1, 2];

export function defaultAccents(beats) {
  const arr = Array(beats).fill(1);
  if (arr.length > 0) arr[0] = 2;
  return arr;
}

export function getTimeSignatureByLabel(label) {
  return TIME_SIGNATURES.find((t) => t.label === label) ?? DEFAULT_TIME_SIGNATURE;
}

export function getSubdivisionById(id) {
  return SUBDIVISIONS.find((s) => s.id === id) ?? DEFAULT_SUBDIVISION;
}
