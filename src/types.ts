export type Role =
  | "drums"
  | "bass"
  | "chords"
  | "texture"
  | "vocal"
  | "percussion"
  | "noise"
  | "fills";

export type MachineMode = "sparse" | "groove" | "collapse" | "auto";

export type DirectorMacro = "preserve" | "nudge" | "bloom" | "stinger" | "break" | "recover";

export type DensityBand = "low" | "medium" | "high";

export type ClipKind = "pattern" | "sample" | "silence";

export type ClipEcology =
  | "anchor"
  | "vamp"
  | "riff"
  | "fill"
  | "stinger"
  | "dropout"
  | "bridge"
  | "swell"
  | "ghost"
  | "rupture";

export type Clip = {
  id: string;
  name: string;
  role: Role;
  kind: ClipKind;
  bars: number;
  bpm?: number;
  musicalKey?: string;
  keyConfidence?: "trusted" | "uncertain";
  oneShot?: boolean;
  probability: number;
  weirdness: number;
  density: DensityBand;
  ecology: ClipEcology[];
  moods: string[];
  returnToSilenceChance: number;
  color: string;
  locked?: boolean;
  sampleUrl?: string;
  source?: SourceLedger;
};

export type SourceLedger = {
  source: "manual" | "internet-archive";
  title: string;
  creator?: string;
  originalUrl?: string;
  licenseUrl?: string;
  retrievedAt: string;
  approved: boolean;
  notes: string;
};

export type ImportCandidate = {
  id: string;
  name: string;
  role: Role;
  bpm?: number;
  musicalKey?: string;
  keyConfidence?: "trusted" | "uncertain";
  duration: number;
  weirdness: number;
  density: DensityBand;
  ecology: ClipEcology[];
  moods: string[];
  probability: number;
  color: string;
  sampleUrl: string;
  oneShot: boolean;
  source: SourceLedger;
  analysisNotes: string;
};

export type MachineSettings = {
  mode: MachineMode;
  director: DirectorMacro;
  tempo: number;
  homeKey: string;
  keyLock: boolean;
  autoMix: boolean;
  density: number;
  silence: number;
  weirdness: number;
  stability: number;
  roleControls: Record<Role, RoleControl>;
};

export type RoleControl = {
  randomness: number;
  stickiness: number;
};

export type RoleState = {
  activeClipId: string;
  isLocked: boolean;
  muted: boolean;
};

export type MachineSnapshot = Record<Role, RoleState>;
