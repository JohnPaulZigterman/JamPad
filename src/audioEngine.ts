import * as Tone from "tone";
import { Clip, MachineSnapshot } from "./types";
import { ROLES } from "./clips";
import { getClosestTempoRatio } from "./musicTheory";

type PatternDisposer = () => void;

const activeParts = new Map<string, PatternDisposer>();
const players = new Map<string, Tone.Player>();

type AudioGraph = {
  master: Tone.Volume;
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hat: Tone.NoiseSynth;
  bass: Tone.MonoSynth;
  keys: Tone.PolySynth;
  pad: Tone.PolySynth;
  pluck: Tone.PluckSynth;
  noise: Tone.NoiseSynth;
};

let audioGraph: AudioGraph | null = null;

const getAudioGraph = (): AudioGraph => {
  if (audioGraph) return audioGraph;

  const master = new Tone.Volume(-8).toDestination();
  const reverb = new Tone.Reverb({ decay: 4, wet: 0.18 }).connect(master);
  const delay = new Tone.FeedbackDelay("8n.", 0.26).connect(reverb);

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.025,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.34, sustain: 0.01, release: 0.18 },
  }).connect(master);

  const snare = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.08 },
  }).connect(master);

  const hat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.035, sustain: 0, release: 0.02 },
  }).connect(master);

  const bass = new Tone.MonoSynth({
    oscillator: { type: "fatsquare" },
    filter: { Q: 3, type: "lowpass", rolloff: -24 },
    envelope: { attack: 0.01, decay: 0.18, sustain: 0.35, release: 0.25 },
    filterEnvelope: { attack: 0.03, decay: 0.3, sustain: 0.12, release: 0.5, baseFrequency: 90, octaves: 2.1 },
  }).connect(master);

  const keys = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle8" },
    envelope: { attack: 0.02, decay: 0.25, sustain: 0.42, release: 1.4 },
  }).connect(delay);

  const pad = new Tone.PolySynth(Tone.AMSynth, {
    envelope: { attack: 0.5, decay: 0.2, sustain: 0.45, release: 2.5 },
  }).connect(reverb);

  const pluck = new Tone.PluckSynth({ dampening: 2600, resonance: 0.78 }).connect(delay);
  const noise = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0, release: 0.2 },
  }).connect(reverb);

  audioGraph = { master, kick, snare, hat, bass, keys, pad, pluck, noise };
  return audioGraph;
};

const addEvent = (events: Tone.ToneEvent[], time: Tone.Unit.Time, callback: Tone.ToneEventCallback<unknown>) => {
  const event = new Tone.ToneEvent(callback);
  event.start(time);
  events.push(event);
};

const applySampleTiming = (player: Tone.Player, clip: Clip, tempo: number) => {
  player.loop = !clip.oneShot;
  player.playbackRate = getClosestTempoRatio(clip.bpm, tempo);
};

const startSamplePlayer = (player: Tone.Player, clip: Clip, isDisposed: () => boolean) => {
  Tone.loaded().then(() => {
    if (isDisposed()) return;

    const stretchedDuration = player.buffer.duration / player.playbackRate;
    const offset = clip.oneShot || stretchedDuration <= 0
      ? 0
      : (Tone.Transport.seconds % stretchedDuration) * player.playbackRate;

    player.start(undefined, offset);
  });
};

const schedulePattern = (clip: Clip, tempo: number): PatternDisposer => {
  const { master, kick, snare, hat, bass, keys, pad, pluck, noise } = getAudioGraph();

  if (clip.kind === "sample" && clip.sampleUrl) {
    const player = new Tone.Player({ url: clip.sampleUrl, loop: !clip.oneShot }).connect(master);
    let disposed = false;
    applySampleTiming(player, clip, tempo);
    players.set(clip.id, player);
    startSamplePlayer(player, clip, () => disposed);
    return () => {
      disposed = true;
      player.stop();
      player.dispose();
      players.delete(clip.id);
    };
  }

  const events: Tone.ToneEvent[] = [];

  switch (clip.id) {
    case "drums-dusty-pocket":
      addEvent(events, "0:0:0", (time) => kick.triggerAttackRelease("C1", "8n", time, 0.95));
      addEvent(events, "0:1:2", (time) => hat.triggerAttackRelease("32n", time, 0.18));
      addEvent(events, "0:2:0", (time) => snare.triggerAttackRelease("16n", time, 0.5));
      addEvent(events, "0:3:1", (time) => hat.triggerAttackRelease("32n", time, 0.24));
      addEvent(events, "1:0:2", (time) => kick.triggerAttackRelease("G0", "16n", time, 0.5));
      addEvent(events, "1:2:0", (time) => snare.triggerAttackRelease("16n", time, 0.46));
      break;
    case "drums-ghost-step":
      addEvent(events, "0:0:0", (time) => kick.triggerAttackRelease("C1", "8n", time, 0.72));
      addEvent(events, "0:2:0", (time) => snare.triggerAttackRelease("16n", time, 0.34));
      addEvent(events, "0:3:2", (time) => hat.triggerAttackRelease("32n", time, 0.16));
      break;
    case "bass-window-rattle":
      ["C1", "C1", "Eb1", "Bb0", "G0"].forEach((note, index) => {
        addEvent(events, `0:${index % 4}:0`, (time) => bass.triggerAttackRelease(note, "8n", time, 0.62));
      });
      addEvent(events, "1:3:2", (time) => bass.triggerAttackRelease("Bb0", "16n", time, 0.38));
      break;
    case "chords-late-bus":
      addEvent(events, "0:0:0", (time) => keys.triggerAttackRelease(["C3", "Eb3", "Bb3"], "2n.", time, 0.24));
      addEvent(events, "2:0:0", (time) => keys.triggerAttackRelease(["Ab2", "C3", "G3"], "2n.", time, 0.22));
      break;
    case "texture-tape-room":
      addEvent(events, "0:0:0", (time) => pad.triggerAttackRelease(["C2", "G2", "D3"], "1m", time, 0.12));
      addEvent(events, "2:0:0", (time) => pad.triggerAttackRelease(["Bb1", "F2", "C3"], "1m", time, 0.1));
      break;
    case "vocal-window-phrase":
      addEvent(events, "0:1:0", (time) => pluck.triggerAttackRelease("G4", "8n", time, 0.24));
      addEvent(events, "0:1:3", (time) => pluck.triggerAttackRelease("Bb4", "16n", time, 0.2));
      addEvent(events, "1:2:1", (time) => pluck.triggerAttackRelease("Eb4", "8n", time, 0.18));
      break;
    case "percussion-matchbox":
      addEvent(events, "0:0:3", (time) => hat.triggerAttackRelease("64n", time, 0.16));
      addEvent(events, "0:1:2", (time) => hat.triggerAttackRelease("64n", time, 0.13));
      addEvent(events, "0:3:1", (time) => hat.triggerAttackRelease("64n", time, 0.18));
      break;
    case "noise-bitcrush-door":
      addEvent(events, "0:0:0", (time) => noise.triggerAttackRelease("8n", time, 0.24));
      addEvent(events, "0:2:3", (time) => noise.triggerAttackRelease("16n", time, 0.16));
      break;
    case "fills-stumble":
      addEvent(events, "0:0:0", (time) => kick.triggerAttackRelease("C1", "16n", time, 0.56));
      addEvent(events, "0:0:2", (time) => snare.triggerAttackRelease("32n", time, 0.34));
      addEvent(events, "0:1:0", (time) => snare.triggerAttackRelease("32n", time, 0.32));
      addEvent(events, "0:3:3", (time) => noise.triggerAttackRelease("32n", time, 0.15));
      break;
  }

  return () => events.forEach((event) => event.dispose());
};

export const startAudio = async (tempo: number) => {
  await Tone.start();
  getAudioGraph();
  Tone.Transport.bpm.value = tempo;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = 0;
  Tone.Transport.loopEnd = "4m";
  Tone.Transport.start();
};

export const stopAudio = () => {
  Tone.Transport.stop();
  for (const dispose of activeParts.values()) dispose();
  activeParts.clear();
};

export const setTempo = (tempo: number) => {
  Tone.Transport.bpm.rampTo(tempo, 0.1);
};

export const syncAudioSnapshot = (snapshot: MachineSnapshot, clips: Clip[], tempo: number) => {
  const desired = new Set<string>();

  for (const role of ROLES) {
    const roleState = snapshot[role];
    if (roleState.muted) continue;

    const clip = clips.find((item) => item.id === roleState.activeClipId);
    if (!clip || clip.kind === "silence") continue;

    desired.add(clip.id);
    const activePlayer = players.get(clip.id);
    if (activePlayer) applySampleTiming(activePlayer, clip, tempo);

    if (!activeParts.has(clip.id)) {
      activeParts.set(clip.id, schedulePattern(clip, tempo));
    }
  }

  for (const [clipId, dispose] of activeParts.entries()) {
    if (!desired.has(clipId)) {
      dispose();
      activeParts.delete(clipId);
    }
  }
};

export const scheduleMachineTick = (callback: () => void) => {
  const id = Tone.Transport.scheduleRepeat(callback, "1m");
  return () => Tone.Transport.clear(id);
};
