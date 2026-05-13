import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Activity,
  AudioLines,
  ChevronDown,
  ChevronUp,
  CircleStop,
  Gamepad2,
  KeyRound,
  Lock,
  SlidersHorizontal,
  Play,
  RefreshCcw,
  Unlock,
  Volume2,
  VolumeX,
} from "lucide-react";
import { DEFAULT_CLIPS, ROLE_LABELS, ROLES } from "./clips";
import {
  scheduleMachineTick,
  setTempo,
  startAudio,
  stopAudio,
  syncAudioSnapshot,
} from "./audioEngine";
import { chooseAutoMode, createInitialSnapshot, decayMemory, generateNextSnapshot, rememberSnapshot } from "./machine";
import { formatKey } from "./musicTheory";
import { Clip, DirectorMacro, MachineMode, MachineSettings, MachineSnapshot, Role, RoleControl } from "./types";

const modeCopy: Record<MachineMode, string> = {
  sparse: "Sparse",
  groove: "Groove",
  collapse: "Collapse",
  auto: "Auto",
};

const directorCopy: Record<DirectorMacro, string> = {
  preserve: "Preserve",
  nudge: "Nudge",
  bloom: "Bloom",
  stinger: "Stinger",
  break: "Break",
  recover: "Recover",
};

const directorTell: Record<DirectorMacro, string> = {
  preserve: "rules favor anchors and vamps",
  nudge: "small changes are allowed",
  bloom: "swells and riffs can gather",
  stinger: "interruptions are armed",
  break: "rupture rules are awake",
  recover: "dropouts and bridges can clear space",
};

const defaultRoleControls: Record<Role, RoleControl> = {
  drums: { randomness: 0.32, stickiness: 0.78 },
  bass: { randomness: 0.34, stickiness: 0.72 },
  chords: { randomness: 0.42, stickiness: 0.64 },
  texture: { randomness: 0.46, stickiness: 0.7 },
  vocal: { randomness: 0.66, stickiness: 0.42 },
  percussion: { randomness: 0.58, stickiness: 0.48 },
  noise: { randomness: 0.72, stickiness: 0.36 },
  fills: { randomness: 0.76, stickiness: 0.28 },
};

const defaultSettings: MachineSettings = {
  mode: "auto",
  director: "preserve",
  tempo: 78,
  homeKey: "Cm",
  keyLock: true,
  autoMix: true,
  density: 0.56,
  silence: 0.42,
  weirdness: 0.34,
  stability: 0.62,
  roleControls: defaultRoleControls,
};

const memoryRef: { current: Record<string, number> } = { current: {} };

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
const HOME_KEYS = ["Cm", "C", "Dm", "Eb", "Em", "F", "Gm", "G", "Am", "A", "Bb", "B"];

const clipMeta = (clip?: Clip) => {
  if (!clip || clip.kind === "silence") return "rest";
  const parts: string[] = [clip.kind];
  if (clip.oneShot) parts.push("one-shot");
  if (clip.musicalKey) parts.push(`${formatKey(clip.musicalKey)}${clip.keyConfidence === "uncertain" ? "?" : ""}`);
  if (clip.bpm) parts.push(`${clip.bpm} BPM`);
  return parts.join(" / ");
};

const primaryEcology = (clip?: Clip) => clip?.ecology?.[0] ?? "rest";

const getConfidenceTell = (
  settings: MachineSettings,
  resolvedMode: Exclude<MachineMode, "auto">,
  activeClips: Clip[],
) => {
  const activeCount = activeClips.length;
  if (settings.director === "break") return "hidden rule: overcrowding may rupture";
  if (settings.director === "stinger") return "hidden rule: a sharp event is armed";
  if (settings.director === "recover") return "hidden rule: space clears the board";
  if (activeCount <= 2) return "holding air; waiting for a useful entrance";
  if (activeCount >= 6) return "crowded field; dropouts gain gravity";
  if (resolvedMode === "groove") return "groove is stable; vamps get extra weight";
  return directorTell[settings.director];
};

function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="control">
      <span>
        {label}
        <strong>{max === 1 ? formatPercent(value) : Math.round(value)}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function RoleLane({
  role,
  clips,
  snapshot,
  controls,
  isExpanded,
  onToggleLock,
  onToggleMute,
  onToggleExpand,
  onControlChange,
}: {
  role: Role;
  clips: Clip[];
  snapshot: MachineSnapshot;
  controls: RoleControl;
  isExpanded: boolean;
  onToggleLock: (role: Role) => void;
  onToggleMute: (role: Role) => void;
  onToggleExpand: (role: Role) => void;
  onControlChange: (role: Role, partial: Partial<RoleControl>) => void;
}) {
  const roleState = snapshot[role];
  const activeClip = clips.find((clip) => clip.id === roleState.activeClipId);
  const roleClips = clips.filter((clip) => clip.role === role);
  const sampleCount = roleClips.filter((clip) => clip.kind === "sample").length;

  return (
    <section
      className={`lane ${roleState.muted ? "is-muted" : ""} ${activeClip?.kind !== "silence" ? "is-speaking" : ""}`}
      style={{ "--active-color": activeClip?.color ?? "#f2c744" } as CSSProperties}
    >
      <div className="laneHeader">
        <div className="laneIdentity">
          <p>{ROLE_LABELS[role]}</p>
          <span>{activeClip?.name ?? "Rest"}</span>
        </div>
        <div className="laneMeter" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, index) => (
            <i
              key={index}
              className={
                activeClip?.kind !== "silence" && index < Math.ceil(((activeClip?.weirdness ?? 0) + 0.25) * 7)
                  ? "on"
                  : ""
              }
            />
          ))}
        </div>
        <div className="laneActions">
          <button
            className={roleState.isLocked ? "iconButton is-active" : "iconButton"}
            onClick={() => onToggleLock(role)}
            aria-label={`${roleState.isLocked ? "Unlock" : "Lock"} ${ROLE_LABELS[role]}`}
            title={`${roleState.isLocked ? "Unlock" : "Lock"} ${ROLE_LABELS[role]}`}
          >
            {roleState.isLocked ? <Lock size={17} /> : <Unlock size={17} />}
          </button>
          <button
            className={roleState.muted ? "iconButton is-active" : "iconButton"}
            onClick={() => onToggleMute(role)}
            aria-label={`${roleState.muted ? "Unmute" : "Mute"} ${ROLE_LABELS[role]}`}
            title={`${roleState.muted ? "Unmute" : "Mute"} ${ROLE_LABELS[role]}`}
          >
            {roleState.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button
            className={isExpanded ? "iconButton is-active" : "iconButton"}
            onClick={() => onToggleExpand(role)}
            aria-label={`${isExpanded ? "Hide" : "Show"} ${ROLE_LABELS[role]} crate`}
            title={`${isExpanded ? "Hide" : "Show"} ${ROLE_LABELS[role]} crate`}
          >
            {isExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
        </div>
      </div>
      <div className="laneFooter">
        <span>{activeClip?.kind === "sample" ? "Crate" : activeClip?.kind === "silence" ? "Resting" : "Synth"}</span>
        <span>{activeClip?.kind === "silence" ? `${sampleCount} samples` : primaryEcology(activeClip)}</span>
      </div>
      <div className="laneMicroControls" aria-label={`${ROLE_LABELS[role]} behavior controls`}>
        <label>
          <span>RND</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={controls.randomness}
            onChange={(event) => onControlChange(role, { randomness: Number(event.currentTarget.value) })}
          />
        </label>
        <label>
          <span>STK</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={controls.stickiness}
            onChange={(event) => onControlChange(role, { stickiness: Number(event.currentTarget.value) })}
          />
        </label>
      </div>
      {isExpanded && (
        <div className="clips">
          {roleClips.map((clip) => (
            <div
              className={clip.id === activeClip?.id ? "clip is-active" : "clip"}
              key={clip.id}
              style={{ "--clip-color": clip.color } as CSSProperties}
            >
              <span>{clip.name}</span>
              <small>{clip.kind === "silence" ? "rest" : `${clipMeta(clip)} / ${clip.density} / ${clip.ecology.join(", ")}`}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function App() {
  const [clips] = useState(DEFAULT_CLIPS);
  const [settings, setSettings] = useState<MachineSettings>(defaultSettings);
  const [snapshot, setSnapshot] = useState(createInitialSnapshot);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bar, setBar] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Set<Role>>(new Set());
  const tickDisposer = useRef<null | (() => void)>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const resolvedMode = useMemo(
    () => (settings.mode === "auto" ? chooseAutoMode(bar) : settings.mode),
    [settings.mode, bar],
  );

  useEffect(() => {
    setTempo(settings.tempo);
  }, [settings.tempo]);

  useEffect(() => {
    if (isPlaying) syncAudioSnapshot(snapshot, clips, settings.tempo, settings.autoMix);
  }, [clips, isPlaying, settings.autoMix, settings.tempo, snapshot]);

  const updateSettings = (partial: Partial<MachineSettings>) => {
    setSettings((current) => ({ ...current, ...partial }));
  };

  const advanceMachine = () => {
    setBar((currentBar) => {
      const nextBar = currentBar + 1;
      setSnapshot((currentSnapshot) => {
        decayMemory(memoryRef.current);
        const nextSnapshot = generateNextSnapshot(clips, currentSnapshot, settingsRef.current, nextBar, memoryRef.current);
        rememberSnapshot(nextSnapshot, memoryRef.current);
        return nextSnapshot;
      });
      return nextBar;
    });
  };

  const start = async () => {
    await startAudio(settings.tempo);
    setIsPlaying(true);
    advanceMachine();
    tickDisposer.current = scheduleMachineTick(advanceMachine);
  };

  const stop = () => {
    tickDisposer.current?.();
    tickDisposer.current = null;
    stopAudio();
    setIsPlaying(false);
  };

  const regenerate = () => {
    memoryRef.current = {};
    const next = generateNextSnapshot(clips, snapshot, settings, bar + 1, memoryRef.current);
    rememberSnapshot(next, memoryRef.current);
    setSnapshot(next);
    setBar((current) => current + 1);
  };

  const toggleLock = (role: Role) => {
    setSnapshot((current) => ({
      ...current,
      [role]: { ...current[role], isLocked: !current[role].isLocked },
    }));
  };

  const toggleMute = (role: Role) => {
    setSnapshot((current) => ({
      ...current,
      [role]: { ...current[role], muted: !current[role].muted },
    }));
  };

  const toggleExpand = (role: Role) => {
    setExpandedRoles((current) => {
      const next = new Set(current);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const updateRoleControl = (role: Role, partial: Partial<RoleControl>) => {
    updateSettings({
      roleControls: {
        ...settings.roleControls,
        [role]: {
          ...settings.roleControls[role],
          ...partial,
        },
      },
    });
  };

  const sampleClipCount = clips.filter((clip) => clip.kind === "sample").length;
  const activeSampleCount = ROLES.filter((role) => {
    const active = clips.find((clip) => clip.id === snapshot[role].activeClipId);
    return active?.kind === "sample";
  }).length;
  const activeClips = ROLES
    .map((role) => clips.find((clip) => clip.id === snapshot[role].activeClipId))
    .filter((clip): clip is Clip => Boolean(clip && clip.kind !== "silence"));
  const confidenceTell = getConfidenceTell(settings, resolvedMode, activeClips);

  return (
    <main className="instrumentShell">
      <header className="topbar">
        <div className="brandBlock">
          <p className="eyebrow">JamPad TH-01</p>
          <h1>Trip Hop Machine</h1>
          <div className="crateBadge">
            <span>Loopcloud Crate</span>
            <strong>{sampleClipCount}</strong>
          </div>
          <a className="philosophyLink" href="/philosophy.html" target="_blank" rel="noreferrer">
            Field Guide
          </a>
        </div>
        <div className="transport">
          <button className="transportButton playButton" onClick={isPlaying ? stop : start} aria-label={isPlaying ? "Stop" : "Play"}>
            {isPlaying ? <CircleStop size={22} /> : <Play size={22} />}
            <span>{isPlaying ? "Stop" : "Play"}</span>
          </button>
          <button className="transportButton" onClick={regenerate} aria-label="Regenerate">
            <RefreshCcw size={20} />
            <span>Next</span>
          </button>
          <button className={showAdvanced ? "transportButton is-active" : "transportButton"} onClick={() => setShowAdvanced((current) => !current)} aria-label="Toggle controls">
            <SlidersHorizontal size={20} />
            <span>Ctrl</span>
          </button>
        </div>
      </header>

      <section className="machineStatus">
        <div className="statusTile">
          <Activity size={18} />
          <span>Mode</span>
          <strong>{modeCopy[resolvedMode]}</strong>
        </div>
        <div className="statusTile">
          <AudioLines size={18} />
          <span>Bar</span>
          <strong>{bar}</strong>
        </div>
        <div className="statusTile">
          <Volume2 size={18} />
          <span>Crate</span>
          <strong>{activeSampleCount}/{ROLES.length}</strong>
        </div>
        <div className="statusTile">
          <KeyRound size={18} />
          <span>Key</span>
          <strong>{formatKey(settings.homeKey)}</strong>
        </div>
        <div className="statusTile statusTileWide">
          <Gamepad2 size={18} />
          <span>Hidden Rule</span>
          <strong>{confidenceTell}</strong>
        </div>
      </section>

      <section className="directorStrip" aria-label="Director macro">
        {(Object.keys(directorCopy) as DirectorMacro[]).map((director) => (
          <button
            className={settings.director === director ? "directorButton is-active" : "directorButton"}
            key={director}
            onClick={() => updateSettings({ director })}
            title={directorTell[director]}
          >
            <span>{directorCopy[director]}</span>
            <small>{directorTell[director]}</small>
          </button>
        ))}
      </section>

      <section className="modeStrip" aria-label="Machine modes">
        {(Object.keys(modeCopy) as MachineMode[]).map((mode) => (
          <button
            className={settings.mode === mode ? "modeButton is-active" : "modeButton"}
            key={mode}
            onClick={() => updateSettings({ mode })}
          >
            {modeCopy[mode]}
          </button>
        ))}
      </section>

      <section className={showAdvanced ? "workbench has-panel" : "workbench"}>
        <div className="lanes">
          {ROLES.map((role) => (
            <RoleLane
              key={role}
              role={role}
              clips={clips}
              snapshot={snapshot}
              controls={settings.roleControls[role]}
              isExpanded={expandedRoles.has(role)}
              onToggleLock={toggleLock}
              onToggleMute={toggleMute}
              onToggleExpand={toggleExpand}
              onControlChange={updateRoleControl}
            />
          ))}
        </div>

        {showAdvanced && (
          <aside className="panel">
            <h2>Controls</h2>
            <Slider
              label="Tempo"
              value={settings.tempo}
              min={58}
              max={104}
              step={1}
              onChange={(tempo) => updateSettings({ tempo })}
            />
            <label className="control">
              <span>
                Key
                <strong>{settings.keyLock ? "Match" : "Loose"}</strong>
              </span>
              <select value={settings.homeKey} onChange={(event) => updateSettings({ homeKey: event.currentTarget.value })}>
                {HOME_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {formatKey(key)}
                  </option>
                ))}
              </select>
            </label>
            <label className="toggleControl">
              <input
                type="checkbox"
                checked={settings.keyLock}
                onChange={(event) => updateSettings({ keyLock: event.currentTarget.checked })}
              />
              <span>Key Lock</span>
            </label>
            <label className="toggleControl">
              <input
                type="checkbox"
                checked={settings.autoMix}
                onChange={(event) => updateSettings({ autoMix: event.currentTarget.checked })}
              />
              <span>Auto Mix</span>
            </label>
            <Slider label="Density" value={settings.density} onChange={(density) => updateSettings({ density })} />
            <Slider label="Silence" value={settings.silence} onChange={(silence) => updateSettings({ silence })} />
            <Slider label="Weird" value={settings.weirdness} onChange={(weirdness) => updateSettings({ weirdness })} />
            <Slider label="Hold" value={settings.stability} onChange={(stability) => updateSettings({ stability })} />
          </aside>
        )}
      </section>
    </main>
  );
}
