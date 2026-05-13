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

export type DensityBand = "low" | "medium" | "high";

export type ClipKind = "pattern" | "sample" | "silence";

export type Clip = {
  id: string;
  name: string;
  role: Role;
  kind: ClipKind;
  bars: number;
  bpm?: number;
  musicalKey?: string;
  oneShot?: boolean;
  probability: number;
  weirdness: number;
  density: DensityBand;
  moods: string[];
  returnToSilenceChance: number;
  color: string;
  locked?: boolean;
  sampleUrl?: string;
};

export type MachineSettings = {
  mode: MachineMode;
  tempo: number;
  homeKey: string;
  keyLock: boolean;
  autoMix: boolean;
  density: number;
  silence: number;
  weirdness: number;
  stability: number;
};

export type RoleState = {
  activeClipId: string;
  isLocked: boolean;
  muted: boolean;
};

export type MachineSnapshot = Record<Role, RoleState>;
