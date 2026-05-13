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

export const getKeyMatchWeight = (
  clipKey: string | undefined,
  homeKey: string,
  strict: boolean,
  confidence: "trusted" | "uncertain" = "trusted",
) => {
  const clip = parseKey(clipKey);
  const home = parseKey(homeKey);

  if (!clip || !home) return 1;
  let weight = 1;
  if (clip.root === home.root && clip.mode === home.mode) weight = 1.8;
  else if (clip.root === relativeRoot(home) && clip.mode !== home.mode) weight = 1.55;
  else if (clip.root === home.root) weight = 1.28;
  else {
    const distance = circularDistance(clip.root, home.root);
    if (distance === 5 || distance === 7) weight = 1.14;
    else if (distance === 2 || distance === 10) weight = strict ? 0.46 : 0.76;
    else if (distance === 3 || distance === 4 || distance === 8 || distance === 9) weight = strict ? 0.34 : 0.64;
    else weight = strict ? 0.22 : 0.5;
  }

  return confidence === "uncertain" ? 1 + (weight - 1) * 0.45 : weight;
};

export const getClosestTempoSync = (sourceBpm: number | undefined, targetBpm: number) => {
  if (!sourceBpm || sourceBpm <= 0) {
    return {
      ratio: 1,
      interpretedSourceBpm: targetBpm,
      feel: "free" as const,
    };
  }

  const candidates = [
    { interpretedSourceBpm: sourceBpm / 2, feel: "half" as const },
    { interpretedSourceBpm: sourceBpm, feel: "normal" as const },
    { interpretedSourceBpm: sourceBpm * 2, feel: "double" as const },
  ];
  const closest = candidates.reduce((best, candidate) => (
    Math.abs(candidate.interpretedSourceBpm - targetBpm) < Math.abs(best.interpretedSourceBpm - targetBpm)
      ? candidate
      : best
  ), candidates[1]);

  return {
    ...closest,
    ratio: targetBpm / closest.interpretedSourceBpm,
  };
};

export const getClosestTempoRatio = (sourceBpm: number | undefined, targetBpm: number) => {
  return getClosestTempoSync(sourceBpm, targetBpm).ratio;
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
