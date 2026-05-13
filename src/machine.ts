import { Clip, ClipEcology, DirectorMacro, MachineSettings, MachineSnapshot, Role } from "./types";
import { ROLES } from "./clips";
import { getKeyMatchWeight, getTempoMatchWeight } from "./musicTheory";

type Memory = Record<string, number>;

const densityRank = {
  low: 0.25,
  medium: 0.58,
  high: 0.9,
};

const modeProfile = {
  sparse: {
    density: 0.22,
    silence: 0.72,
    weirdness: 0.22,
    stableRoles: ["texture", "drums"] as Role[],
  },
  groove: {
    density: 0.62,
    silence: 0.22,
    weirdness: 0.24,
    stableRoles: ["drums", "bass", "chords"] as Role[],
  },
  collapse: {
    density: 0.76,
    silence: 0.42,
    weirdness: 0.86,
    stableRoles: ["noise", "fills", "vocal"] as Role[],
  },
};

const directorProfile: Record<DirectorMacro, {
  density: number;
  silence: number;
  weirdness: number;
  stability: number;
  ecology: Partial<Record<ClipEcology, number>>;
}> = {
  preserve: {
    density: -0.08,
    silence: 0.06,
    weirdness: -0.16,
    stability: 0.22,
    ecology: { anchor: 1.45, vamp: 1.35, ghost: 1.12, stinger: 0.45, rupture: 0.34 },
  },
  nudge: {
    density: 0.02,
    silence: 0,
    weirdness: 0,
    stability: 0.08,
    ecology: { riff: 1.16, fill: 1.08, swell: 1.08 },
  },
  bloom: {
    density: 0.14,
    silence: -0.12,
    weirdness: 0.08,
    stability: 0.04,
    ecology: { swell: 1.45, riff: 1.22, bridge: 1.16, dropout: 0.52 },
  },
  stinger: {
    density: 0.04,
    silence: -0.04,
    weirdness: 0.18,
    stability: -0.04,
    ecology: { stinger: 1.85, fill: 1.32, rupture: 1.16, anchor: 0.72 },
  },
  break: {
    density: 0.18,
    silence: 0.06,
    weirdness: 0.32,
    stability: -0.18,
    ecology: { rupture: 1.72, stinger: 1.46, dropout: 1.28, ghost: 1.16, anchor: 0.58 },
  },
  recover: {
    density: -0.1,
    silence: 0.18,
    weirdness: -0.12,
    stability: 0.16,
    ecology: { dropout: 1.52, bridge: 1.42, anchor: 1.25, vamp: 1.14, rupture: 0.46 },
  },
};

export const createInitialSnapshot = (): MachineSnapshot =>
  ROLES.reduce((snapshot, role) => {
    snapshot[role] = {
      activeClipId: `${role}-silence`,
      isLocked: false,
      muted: false,
    };
    return snapshot;
  }, {} as MachineSnapshot);

export const chooseAutoMode = (bar: number): Exclude<MachineSettings["mode"], "auto"> => {
  const cycle = bar % 32;
  if (cycle < 10) return "sparse";
  if (cycle < 24) return "groove";
  return "collapse";
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const weightedPick = (items: Array<{ clip: Clip; weight: number }>): Clip => {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;

  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item.clip;
  }

  return items[items.length - 1].clip;
};

const ecologyWeight = (clip: Clip, director: DirectorMacro, activeClipCount: number) => {
  const profile = directorProfile[director];
  const base = clip.ecology.reduce((weight, ecology) => weight * (profile.ecology[ecology] ?? 1), 1);
  const overcrowdedDropout = activeClipCount >= 5 && clip.ecology.some((ecology) => ecology === "dropout" || ecology === "bridge")
    ? 1.32
    : 1;
  const quietStinger = activeClipCount <= 2 && clip.ecology.includes("stinger") ? 0.72 : 1;

  return clamp(base * overcrowdedDropout * quietStinger, 0.2, 2.4);
};

export const generateNextSnapshot = (
  clips: Clip[],
  current: MachineSnapshot,
  settings: MachineSettings,
  bar: number,
  memory: Memory,
): MachineSnapshot => {
  const resolvedMode = settings.mode === "auto" ? chooseAutoMode(bar) : settings.mode;
  const profile = modeProfile[resolvedMode];
  const director = directorProfile[settings.director];
  const targetDensity = clamp((settings.density + profile.density) / 2 + director.density);
  const silenceBias = clamp((settings.silence + profile.silence) / 2 + director.silence);
  const weirdnessBias = clamp((settings.weirdness + profile.weirdness) / 2 + director.weirdness);
  const stabilityBias = clamp(settings.stability + director.stability);
  const activeClipCount = ROLES.filter((role) => {
    const active = clips.find((clip) => clip.id === current[role].activeClipId);
    return active && active.kind !== "silence" && !current[role].muted;
  }).length;

  const next = { ...current } as MachineSnapshot;

  for (const role of ROLES) {
    const roleState = current[role];
    if (roleState.isLocked || roleState.muted) continue;

    const active = clips.find((clip) => clip.id === roleState.activeClipId);
    const isStableRole = profile.stableRoles.includes(role);
    const keepChance = active?.kind !== "silence"
      ? clamp(0.28 + stabilityBias * (isStableRole ? 0.82 : 0.62) - weirdnessBias * 0.14)
      : 0;
    const silenceHoldChance = active?.kind === "silence"
      ? clamp(0.38 + stabilityBias * 0.42 + silenceBias * 0.25 - weirdnessBias * 0.12)
      : 0;

    if (active?.kind === "silence" && Math.random() < silenceHoldChance) {
      next[role] = { ...roleState, activeClipId: active.id };
      continue;
    }

    if (active && active.kind !== "silence" && Math.random() < keepChance) {
      next[role] = { ...roleState, activeClipId: active.id };
      continue;
    }

    const roleClips = clips.filter((clip) => clip.role === role);
    const silenceClip = roleClips.find((clip) => clip.kind === "silence")!;
    const wantsSilence =
      Math.random() < silenceBias * 0.72 ||
      (active !== undefined && active.kind !== "silence" && Math.random() < active.returnToSilenceChance * 0.72);

    if (wantsSilence) {
      next[role] = { ...roleState, activeClipId: silenceClip.id };
      continue;
    }

    const weighted = roleClips.map((clip) => {
      if (clip.kind === "silence") {
        return { clip, weight: 0.08 + silenceBias };
      }

      const densityFit = 1 - Math.abs(targetDensity - densityRank[clip.density]);
      const weirdFit = 1 - Math.abs(weirdnessBias - clip.weirdness);
      const memoryPenalty = memory[clip.id] ? 0.28 : 1;
      const modeBoost = profile.stableRoles.includes(role) ? 1.18 : 1;
      const crateBoost = clip.kind === "sample" ? 1.75 : 0.62;
      const keyFit = getKeyMatchWeight(clip.musicalKey, settings.homeKey, settings.keyLock, clip.keyConfidence);
      const tempoFit = clip.kind === "sample" ? getTempoMatchWeight(clip.bpm, settings.tempo) : 1;
      const ecologyFit = ecologyWeight(clip, settings.director, activeClipCount);

      return {
        clip,
        weight: Math.max(
          0.02,
          clip.probability * densityFit * weirdFit * memoryPenalty * modeBoost * crateBoost * keyFit * tempoFit * ecologyFit,
        ),
      };
    });

    next[role] = { ...roleState, activeClipId: weightedPick(weighted).id };
  }

  return next;
};

export const decayMemory = (memory: Memory) => {
  for (const key of Object.keys(memory)) {
    memory[key] -= 1;
    if (memory[key] <= 0) delete memory[key];
  }
};

export const rememberSnapshot = (snapshot: MachineSnapshot, memory: Memory) => {
  for (const role of ROLES) {
    const clipId = snapshot[role].activeClipId;
    if (!clipId.endsWith("-silence")) memory[clipId] = 4;
  }
};
