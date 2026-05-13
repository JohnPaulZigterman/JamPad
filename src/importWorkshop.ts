import { Clip, ClipEcology, DensityBand, ImportCandidate, Role, SourceLedger } from "./types";

type AudioFeatures = {
  duration: number;
  rms: number;
  peak: number;
  zcr: number;
};

type InternetArchiveDoc = {
  identifier: string;
  title?: string;
  creator?: string | string[];
  licenseurl?: string;
};

type InternetArchiveFile = {
  name: string;
  format?: string;
  size?: string;
};

const ROLE_COLORS: Record<Role, string> = {
  drums: "#d56a44",
  bass: "#609a7b",
  chords: "#c79a52",
  texture: "#6796b6",
  vocal: "#b96f8a",
  percussion: "#a8a24f",
  noise: "#8f80ba",
  fills: "#cf5e67",
};

const audioContext = (() => {
  let context: AudioContext | undefined;
  return () => {
    context ??= new AudioContext();
    return context;
  };
})();

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const inferRole = (name: string): Role => {
  const lower = name.toLowerCase();
  if (/\b(kick|snare|drum|break|beat)\b/.test(lower)) return "drums";
  if (/\b(bass|sub|808)\b/.test(lower)) return "bass";
  if (/\b(chord|organ|rhodes|piano|keys|synth|guitar|riff|lead|pad)\b/.test(lower)) return "chords";
  if (/\b(vocal|voice|spoken|choir|phrase)\b/.test(lower)) return "vocal";
  if (/\b(perc|hat|shaker|conga|tamb|top)\b/.test(lower)) return "percussion";
  if (/\b(noise|vinyl|crackle|hiss|static)\b/.test(lower)) return "noise";
  if (/\b(fill|stab|hit|one.?shot|fx)\b/.test(lower)) return "fills";
  return "texture";
};

const inferBpm = (name: string) => {
  const match = name.match(/(?:^|[^0-9])([6-9][0-9]|1[01][0-9]|12[0-9]|13[0-9])(?:[^0-9]|$)/);
  return match ? Number(match[1]) : undefined;
};

const inferKey = (name: string) => {
  const match = name.match(/(?:^|[^A-Ga-g])([A-Ga-g](?:#|b|sharp|flat)?)(m|min|minor|maj|major)?(?:[^A-Za-z]|$)/);
  if (!match) return undefined;
  const root = match[1].replace("sharp", "#").replace("flat", "b");
  const mode = match[2]?.toLowerCase();
  return `${root[0].toUpperCase()}${root.slice(1)}${mode?.startsWith("m") && !mode.startsWith("maj") ? "m" : ""}`;
};

const densityFrom = (features: AudioFeatures, role: Role): DensityBand => {
  if (features.duration <= 1.3 || role === "fills") return "high";
  if (features.rms > 0.14 || features.zcr > 0.28) return "high";
  if (features.rms < 0.045 && features.zcr < 0.16) return "low";
  return "medium";
};

const ecologyFrom = (role: Role, density: DensityBand, weirdness: number, oneShot: boolean): ClipEcology[] => {
  const ecology = new Set<ClipEcology>();
  if (role === "drums" || role === "bass") ecology.add(density === "low" ? "vamp" : "anchor");
  if (role === "chords") ecology.add(density === "low" ? "vamp" : "riff");
  if (role === "texture") ecology.add(weirdness > 0.52 ? "swell" : "ghost");
  if (role === "vocal") ecology.add(weirdness > 0.55 ? "stinger" : "riff");
  if (role === "percussion") ecology.add("fill");
  if (role === "noise") ecology.add(weirdness > 0.65 ? "rupture" : "ghost");
  if (role === "fills" || oneShot) ecology.add("stinger");
  if (density === "low") ecology.add("ghost");
  return [...ecology];
};

const moodsFrom = (name: string, source: SourceLedger) => {
  const lower = name.toLowerCase();
  const moods = ["imported"];
  if (source.source === "internet-archive") moods.push("internet");
  if (/dust|vinyl|lofi|tape|crackle|scratch/.test(lower)) moods.push("dusty");
  if (/dark|minor|night|black|dirty/.test(lower)) moods.push("dark");
  if (/dream|pad|wash|ambient|room/.test(lower)) moods.push("hazy");
  if (/stab|hit|glitch|fx|siren/.test(lower)) moods.push("rare");
  return moods;
};

const measureAudioBuffer = (buffer: AudioBuffer): AudioFeatures => {
  const data = buffer.getChannelData(0);
  const stride = Math.max(1, Math.floor(data.length / 48000));
  let peak = 0;
  let squareSum = 0;
  let sampleCount = 0;
  let crossings = 0;
  let previous = 0;

  for (let index = 0; index < data.length; index += stride) {
    const value = data[index];
    peak = Math.max(peak, Math.abs(value));
    squareSum += value * value;
    if (sampleCount > 0 && (value >= 0) !== (previous >= 0)) crossings += 1;
    previous = value;
    sampleCount += 1;
  }

  return {
    duration: buffer.duration,
    rms: Math.sqrt(squareSum / Math.max(1, sampleCount)),
    peak,
    zcr: crossings / Math.max(1, sampleCount - 1),
  };
};

export const analyzeArrayBuffer = async (arrayBuffer: ArrayBuffer): Promise<AudioFeatures> => {
  const decoded = await audioContext().decodeAudioData(arrayBuffer.slice(0));
  return measureAudioBuffer(decoded);
};

const fallbackFeatures = (name: string): AudioFeatures => ({
  duration: /\.(wav|aiff?|flac)$/i.test(name) ? 8 : 4,
  rms: 0.08,
  peak: 0.6,
  zcr: /noise|hiss|crackle|siren|fx/i.test(name) ? 0.32 : 0.14,
});

export const createCandidate = ({
  id,
  name,
  sampleUrl,
  source,
  features,
}: {
  id: string;
  name: string;
  sampleUrl: string;
  source: SourceLedger;
  features: AudioFeatures;
}): ImportCandidate => {
  const role = inferRole(name);
  const oneShot = features.duration <= 1.3 || /\b(hit|stab|one.?shot|shot|fx)\b/i.test(name);
  const weirdness = clamp(0.18 + features.zcr * 1.25 + (oneShot ? 0.18 : 0) + (role === "noise" ? 0.22 : 0));
  const density = densityFrom(features, role);
  const ecology = ecologyFrom(role, density, weirdness, oneShot);
  const moods = moodsFrom(name, source);
  const bpm = oneShot ? undefined : inferBpm(name);
  const musicalKey = inferKey(name);

  return {
    id,
    name,
    role,
    bpm,
    musicalKey,
    keyConfidence: musicalKey ? "uncertain" : undefined,
    duration: features.duration,
    weirdness,
    density,
    ecology,
    moods,
    probability: source.source === "manual" ? 0.42 : 0.28,
    color: ROLE_COLORS[role],
    sampleUrl,
    oneShot,
    source,
    analysisNotes: `${role} / ${density} / ${features.duration.toFixed(1)}s / ${ecology.join(", ")}`,
  };
};

export const candidateToClip = (candidate: ImportCandidate): Clip => ({
  id: candidate.id,
  name: candidate.name,
  role: candidate.role,
  kind: "sample",
  bars: candidate.bpm && candidate.bpm >= 130 ? 1 : 2,
  bpm: candidate.bpm,
  musicalKey: candidate.musicalKey,
  keyConfidence: candidate.keyConfidence,
  oneShot: candidate.oneShot,
  probability: candidate.probability,
  weirdness: candidate.weirdness,
  density: candidate.density,
  ecology: candidate.ecology,
  moods: candidate.moods,
  returnToSilenceChance: candidate.role === "texture" || candidate.role === "noise" ? 0.28 : 0.34,
  color: candidate.color,
  sampleUrl: candidate.sampleUrl,
  source: candidate.source,
});

export const createManualCandidates = async (files: File[]) => {
  const candidates = await Promise.all(files.filter((file) => file.type.startsWith("audio/") || /\.(wav|mp3|flac|ogg|m4a|aiff?)$/i.test(file.name)).map(async (file, index) => {
    const source: SourceLedger = {
      source: "manual",
      title: file.name,
      retrievedAt: new Date().toISOString(),
      approved: false,
      notes: "User-selected local file.",
    };
    const sampleUrl = URL.createObjectURL(file);
    let features = fallbackFeatures(file.name);
    try {
      features = await analyzeArrayBuffer(await file.arrayBuffer());
    } catch {
      source.notes = "User-selected local file. Browser analysis failed; filename heuristics used.";
    }

    return createCandidate({
      id: `manual-${Date.now()}-${index}-${slugify(file.name)}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      sampleUrl,
      source,
      features,
    });
  }));

  return candidates;
};

const audioFileScore = (file: InternetArchiveFile) => {
  const name = file.name.toLowerCase();
  if (/\.(wav|flac|mp3|ogg|m4a)$/i.test(file.name) === false) return 0;
  if (/64kb|vbr|spectrogram|png|jpg|txt|xml|sqlite|meta/i.test(file.name)) return 0;
  if (/\.wav$/i.test(file.name)) return 8;
  if (/\.flac$/i.test(file.name)) return 7;
  if (/\.mp3$/i.test(file.name)) return 5;
  if (/\.ogg$/i.test(file.name)) return 4;
  return name.includes("sample") || name.includes("loop") ? 3 : 2;
};

const internetArchiveDownloadUrl = (identifier: string, fileName: string) => (
  `https://archive.org/download/${encodeURIComponent(identifier)}/${fileName.split("/").map(encodeURIComponent).join("/")}`
);

export const searchInternetArchive = async (query: string) => {
  const search = new URL("https://archive.org/advancedsearch.php");
  search.searchParams.set("q", `mediatype:audio AND (${query || "lofi trip hop jazz drums"})`);
  ["identifier", "title", "creator", "licenseurl"].forEach((field) => search.searchParams.append("fl[]", field));
  search.searchParams.set("rows", "8");
  search.searchParams.set("page", "1");
  search.searchParams.set("output", "json");

  const response = await fetch(search.toString());
  if (!response.ok) throw new Error("Internet Archive search failed.");
  const payload = await response.json() as { response: { docs: InternetArchiveDoc[] } };

  const candidates: ImportCandidate[] = [];
  for (const doc of payload.response.docs.slice(0, 6)) {
    const metadataResponse = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`);
    if (!metadataResponse.ok) continue;
    const metadata = await metadataResponse.json() as { files?: InternetArchiveFile[]; metadata?: InternetArchiveDoc };
    const chosen = [...(metadata.files ?? [])].sort((a, b) => audioFileScore(b) - audioFileScore(a))[0];
    if (!chosen || audioFileScore(chosen) <= 0) continue;

    const title = metadata.metadata?.title ?? doc.title ?? doc.identifier;
    const creatorValue = metadata.metadata?.creator ?? doc.creator;
    const creator = Array.isArray(creatorValue) ? creatorValue.join(", ") : creatorValue;
    const licenseUrl = metadata.metadata?.licenseurl ?? doc.licenseurl;
    const sampleUrl = internetArchiveDownloadUrl(doc.identifier, chosen.name);
    const source: SourceLedger = {
      source: "internet-archive",
      title,
      creator,
      originalUrl: `https://archive.org/details/${doc.identifier}`,
      licenseUrl,
      retrievedAt: new Date().toISOString(),
      approved: false,
      notes: licenseUrl ? "Internet Archive candidate with license metadata." : "Internet Archive candidate; review rights before export.",
    };

    const features = fallbackFeatures(chosen.name);

    candidates.push(createCandidate({
      id: `ia-${doc.identifier}-${slugify(chosen.name)}`,
      name: `${title}`.slice(0, 58),
      sampleUrl,
      source,
      features,
    }));
  }

  return candidates;
};
