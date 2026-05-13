const NOTE_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const INDEX_NOTE = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

type ParsedKey = {
  root: number;
  mode: "major" | "minor";
};

const parseKey = (key?: string): ParsedKey | null => {
  if (!key) return null;
  const match = key.trim().match(/^([A-G](?:#|b)?)(m|maj|minor|major)?$/i);
  if (!match) return null;

  const rawRoot = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  const root = NOTE_INDEX[rawRoot];
  if (root === undefined) return null;

  const modeText = match[2]?.toLowerCase();
  return {
    root,
    mode: modeText === "m" || modeText === "minor" ? "minor" : "major",
  };
};

const circularDistance = (a: number, b: number) => {
  const distance = Math.abs(a - b) % 12;
  return Math.min(distance, 12 - distance);
};

const relativeRoot = (key: ParsedKey) => (key.mode === "minor" ? (key.root + 3) % 12 : (key.root + 9) % 12);

export const getKeyMatchWeight = (clipKey: string | undefined, homeKey: string, strict: boolean) => {
  const clip = parseKey(clipKey);
  const home = parseKey(homeKey);

  if (!clip || !home) return 1;
  if (clip.root === home.root && clip.mode === home.mode) return 1.8;
  if (clip.root === relativeRoot(home) && clip.mode !== home.mode) return 1.55;
  if (clip.root === home.root) return 1.28;

  const distance = circularDistance(clip.root, home.root);
  if (distance === 5 || distance === 7) return 1.14;
  if (distance === 2 || distance === 10) return strict ? 0.46 : 0.76;
  if (distance === 3 || distance === 4 || distance === 8 || distance === 9) return strict ? 0.34 : 0.64;

  return strict ? 0.22 : 0.5;
};

export const getClosestTempoRatio = (sourceBpm: number | undefined, targetBpm: number) => {
  if (!sourceBpm || sourceBpm <= 0) return 1;

  const sourceCandidates = [sourceBpm / 2, sourceBpm, sourceBpm * 2];
  const closestSource = sourceCandidates.reduce((best, candidate) => (
    Math.abs(candidate - targetBpm) < Math.abs(best - targetBpm) ? candidate : best
  ), sourceBpm);

  return targetBpm / closestSource;
};

export const getTempoMatchWeight = (sourceBpm: number | undefined, targetBpm: number) => {
  if (!sourceBpm || sourceBpm <= 0) return 0.86;

  const ratio = getClosestTempoRatio(sourceBpm, targetBpm);
  const distance = Math.abs(Math.log2(ratio));
  return Math.max(0.18, 1.25 - distance * 1.9);
};

export const formatKey = (key?: string) => {
  const parsed = parseKey(key);
  if (!parsed) return "Free";
  return `${INDEX_NOTE[parsed.root]}${parsed.mode === "minor" ? "m" : ""}`;
};

