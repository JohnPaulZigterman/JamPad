import { Clip, MachineSettings, MachineSnapshot, Role } from "./types";
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

export const generateNextSnapshot = (
  clips: Clip[],
  current: MachineSnapshot,
  settings: MachineSettings,
  bar: number,
  memory: Memory,
): MachineSnapshot => {
  const resolvedMode = settings.mode === "auto" ? chooseAutoMode(bar) : settings.mode;
  const profile = modeProfile[resolvedMode];
  const targetDensity = clamp((settings.density + profile.density) / 2);
  const silenceBias = clamp((settings.silence + profile.silence) / 2);
  const weirdnessBias = clamp((settings.weirdness + profile.weirdness) / 2);

  const next = { ...current } as MachineSnapshot;

  for (const role of ROLES) {
    const roleState = current[role];
    if (roleState.isLocked || roleState.muted) continue;

    const active = clips.find((clip) => clip.id === roleState.activeClipId);
    const keepChance = active?.kind !== "silence"
      ? clamp(settings.stability * (profile.stableRoles.includes(role) ? 1.25 : 0.85))
      : 0;

    if (active && active.kind !== "silence" && Math.random() < keepChance) {
      next[role] = { ...roleState, activeClipId: active.id };
      continue;
    }

    const roleClips = clips.filter((clip) => clip.role === role);
    const silenceClip = roleClips.find((clip) => clip.kind === "silence")!;
    const wantsSilence =
      Math.random() < silenceBias ||
      (active !== undefined && active.kind !== "silence" && Math.random() < active.returnToSilenceChance);

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
      const keyFit = getKeyMatchWeight(clip.musicalKey, settings.homeKey, settings.keyLock);
      const tempoFit = clip.kind === "sample" ? getTempoMatchWeight(clip.bpm, settings.tempo) : 1;

      return {
        clip,
        weight: Math.max(
          0.02,
          clip.probability * densityFit * weirdFit * memoryPenalty * modeBoost * crateBoost * keyFit * tempoFit,
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
