import { Clip, ClipEcology, DensityBand, Role } from "./types";

const ecologyFor = (role: Role, density: DensityBand, weirdness: number, moods: string[]): ClipEcology[] => {
  const ecology = new Set<ClipEcology>();

  if (role === "drums" || role === "bass") ecology.add(density === "low" ? "vamp" : "anchor");
  if (role === "chords") ecology.add(density === "low" ? "vamp" : "riff");
  if (role === "texture") ecology.add(weirdness > 0.52 ? "swell" : "ghost");
  if (role === "vocal") ecology.add(weirdness > 0.56 ? "stinger" : "riff");
  if (role === "percussion") ecology.add(density === "high" ? "fill" : "riff");
  if (role === "noise") ecology.add(weirdness > 0.72 ? "rupture" : "ghost");
  if (role === "fills") ecology.add(weirdness > 0.68 ? "stinger" : "fill");

  if (moods.some((mood) => ["anchor", "groove", "bed", "slow", "sparse"].includes(mood))) ecology.add("anchor");
  if (moods.some((mood) => ["rare", "glitch", "collapse", "siren", "stabs"].includes(mood))) ecology.add("stinger");
  if (moods.some((mood) => ["fx", "one-shot", "faded"].includes(mood))) ecology.add("dropout");
  if (moods.some((mood) => ["lift", "pretty", "dreamy", "lavender"].includes(mood))) ecology.add("swell");
  if (moods.some((mood) => ["lofi", "vinyl", "scratch", "dusty"].includes(mood))) ecology.add("ghost");

  return [...ecology];
};

const sample = (
  id: string,
  name: string,
  file: string,
  role: Role,
  bpm: number,
  key: string | undefined,
  density: DensityBand,
  weirdness: number,
  probability: number,
  color: string,
  moods: string[],
): Clip => ({
  id,
  name,
  role,
  kind: "sample",
  sampleUrl: `/samples/${file}`,
  bars: bpm >= 130 ? 1 : 2,
  bpm: bpm > 0 ? bpm : undefined,
  musicalKey: key,
  oneShot: bpm === 0,
  probability,
  weirdness,
  density,
  ecology: ecologyFor(role, density, weirdness, moods),
  moods: key ? [...moods, key] : moods,
  returnToSilenceChance: role === "texture" || role === "noise" ? 0.28 : 0.34,
  color,
});

const exportedSample = (
  id: string,
  name: string,
  file: string,
  role: Role,
  bpm: number,
  key: string | undefined,
  density: DensityBand,
  weirdness: number,
  probability: number,
  color: string,
  moods: string[],
): Clip => ({
  ...sample(id, name, `imported/${file}`, role, bpm, key, density, weirdness, probability, color, moods),
  keyConfidence: key ? "uncertain" : undefined,
});

const IMPORTED_SAMPLE_CLIPS: Clip[] = [
  exportedSample("lcx-bass-dream-em", "Dream Em Bass Guitar", "Aim15_96_Dream_Em_Bass_Guitar_Phaser.wav", "bass", 96, "Em", "medium", 0.3, 0.54, "#609a7b", ["exported", "lofi", "guitar"]),
  exportedSample("lcx-bass-dirty-am", "Dirty Am Synth Bass", "DM2_106_AMIN_SYNTH_BASS_DIRTY.wav", "bass", 106, "Am", "medium", 0.44, 0.5, "#609a7b", ["exported", "dirty", "synth"]),
  exportedSample("lcx-bass-pal-e", "E Synth Bass 77", "PAL_120_E_Synth_Bass_77.wav", "bass", 120, "E", "medium", 0.34, 0.48, "#609a7b", ["exported", "synth"]),
  exportedSample("lcx-bass-pal-fm", "Fm Synth Bass", "PAL_120_Fm_Synth_Bass.wav", "bass", 120, "Fm", "medium", 0.34, 0.48, "#609a7b", ["exported", "synth", "minor"]),
  exportedSample("lcx-bass-red-c", "C Red Elec Bass", "VAC_110_C_Red_Elec_Bass_7.wav", "bass", 110, "C", "medium", 0.28, 0.5, "#609a7b", ["exported", "electric"]),
  exportedSample("lcx-bass-fretless-dm", "Dm Fretless Bass Phrase", "YJR_116_Dm_DoS_Fretless_Elec_Bass_Phrase_1.wav", "bass", 116, "Dm", "medium", 0.28, 0.48, "#609a7b", ["exported", "fretless"]),
  exportedSample("lcx-bass-circus-gm", "Gm Circus Synth Bass", "YOV_95_Gm_Circus_Stereo_Bass_Synth.wav", "bass", 95, "Gm", "low", 0.42, 0.46, "#609a7b", ["exported", "circus", "synth"]),
  exportedSample("lcx-bass-dirty-cm", "Cm Dirty Synth Bass", "YFZ_90_Cm_Synth_Bass_Dirty.wav", "bass", 90, "Cm", "low", 0.38, 0.54, "#609a7b", ["exported", "dirty", "synth"]),
  exportedSample("lcx-bass-limited-fm", "Fm Limited Elec Bass", "VYG_88_Fm_Limited_Elec_Bass.wav", "bass", 88, "Fm", "low", 0.25, 0.5, "#609a7b", ["exported", "electric", "limited"]),
  exportedSample("lcx-chords-bbm-organ", "Bbm Organ Groove", "117_Bbm_Organ_Groove_6.wav", "chords", 117, "Bbm", "medium", 0.22, 0.44, "#c79a52", ["exported", "organ"]),
  exportedSample("lcx-chords-bbm-rhodes", "Bbm Rhodes Pads", "117_Bbm_Rhodes_Pads_3.wav", "chords", 117, "Bbm", "medium", 0.18, 0.46, "#d0aa61", ["exported", "rhodes", "pad"]),
  exportedSample("lcx-chords-fsm-flute", "F#m Flute Scratch", "Aim30_86_Fsharpm_Flute_2_Scratch.wav", "chords", 86, "F#m", "low", 0.42, 0.42, "#d0aa61", ["exported", "flute", "scratch"]),
  exportedSample("lcx-chords-gm-organ", "Gm Organ Scratch", "Aim30_87_Gm_Organ_2_1_Scratch_4.wav", "chords", 87, "Gm", "low", 0.4, 0.44, "#c79a52", ["exported", "organ", "scratch"]),
  exportedSample("lcx-chords-cm-cello", "Cm Cello Pads Scratch", "Aim7_88_Cm_Cello_Pads_Scratch_1.wav", "chords", 88, "Cm", "low", 0.34, 0.42, "#d0aa61", ["exported", "cello", "pad"]),
  exportedSample("lcx-chords-am-wonk-horn", "Am Wonk Horn Scratch", "AIM9_65_Am_Sail_Wonk_Horn_Scratch_2_LoFi.wav", "chords", 65, "Am", "low", 0.58, 0.38, "#d0aa61", ["exported", "horn", "scratch", "lofi"]),
  exportedSample("lcx-chords-gm-sax", "Gm Shineye Sax Delay", "AIM9_73_Gm_Shineye_Sax_Delay_Scratch_6_LoFi.wav", "chords", 73, "Gm", "low", 0.5, 0.42, "#d0aa61", ["exported", "sax", "scratch", "lofi"]),
  exportedSample("lcx-chords-csm-piano", "C#m Piano Soul Riff", "FSK_100_Csharpmin_Piano_Soul_Riff_2.wav", "chords", 100, "C#m", "medium", 0.24, 0.5, "#d0aa61", ["exported", "piano", "soul"]),
  exportedSample("lcx-chords-bbm-rhodes-dusty", "Bbm Dusty Rhodes", "LVD_95_Bbm_Dusty_Rhodes_5.wav", "chords", 95, "Bbm", "low", 0.2, 0.52, "#d0aa61", ["exported", "dusty", "rhodes"]),
  exportedSample("lcx-chords-gm-organ-lofi", "Gm Organ Lofi Riff", "R1_92_Gm_GoingOver_Organ_Lofi_Riff.wav", "chords", 92, "Gm", "low", 0.24, 0.54, "#c79a52", ["exported", "organ", "lofi"]),
  exportedSample("lcx-chords-dm-organic-lead", "Dm Organic Lead", "SFC_lead_organic_Dm_105_dry.wav", "chords", 105, "Dm", "medium", 0.34, 0.44, "#c79a52", ["exported", "lead", "organic"]),
  exportedSample("lcx-chords-am-lavender", "Am Lavender Organ", "R3_84_Am_Lavender_Organ.wav", "chords", 84, "Am", "low", 0.24, 0.48, "#c79a52", ["exported", "organ", "lavender"]),
  exportedSample("lcx-chords-g-dreaming", "G Keep Dreaming Organ", "YNT_85_G_KeepDreaming_Organ.wav", "chords", 85, "G", "low", 0.22, 0.48, "#c79a52", ["exported", "organ", "dreamy"]),
  exportedSample("lcx-drums-ruff-verb", "Ruff Drums Verb", "Aim10_88_Ruff_Drums_Full_Verb.wav", "drums", 88, undefined, "medium", 0.28, 0.62, "#d56a44", ["exported", "ruff", "verb"]),
  exportedSample("lcx-drums-ruff-scratch", "Ruff Drums Scratch Lofi", "Aim10_88_Ruff_Drums_Full_Scratch_LoFi.wav", "drums", 88, undefined, "medium", 0.36, 0.64, "#d56a44", ["exported", "scratch", "lofi"]),
  exportedSample("lcx-drums-dub-75", "75 Drum Groove", "Aim16_75_Drum_Groove_3.wav", "drums", 75, undefined, "medium", 0.2, 0.58, "#bc8257", ["exported", "dub", "slow"]),
  exportedSample("lcx-drums-lofi-89", "89 Lofi Drum Groove", "Aim16_89_Drum_Groove_2_LoFi.wav", "drums", 89, undefined, "medium", 0.24, 0.62, "#bc8257", ["exported", "lofi"]),
  exportedSample("lcx-drums-fall-top", "The Fall Top", "Aim21_68_The_Fall_Top.wav", "drums", 68, undefined, "low", 0.18, 0.42, "#bc8257", ["exported", "top", "sparse"]),
  exportedSample("lcx-drums-smokin-snare", "Smokin Snare Groove", "Aim26_65_Smokin_Snare_Groove_1_Scratch.wav", "drums", 65, undefined, "low", 0.36, 0.42, "#bc8257", ["exported", "scratch", "smoky"]),
  exportedSample("lcx-drums-ar1-full", "AR1 Drums Full", "AR1_85_Drums_Full.wav", "drums", 85, undefined, "medium", 0.22, 0.58, "#d56a44", ["exported", "full"]),
  exportedSample("lcx-drums-ar1-break", "AR1 Drum Break", "AR1_90_Drum_Break.wav", "drums", 90, undefined, "medium", 0.26, 0.62, "#d56a44", ["exported", "break"]),
  exportedSample("lcx-drums-ljm-slow", "LJM Slow Drums", "LJM_70_Drums_Full_03.wav", "drums", 70, undefined, "low", 0.18, 0.48, "#bc8257", ["exported", "slow"]),
  exportedSample("lcx-drums-mfth-reverb", "MFTH Reverb Drums", "MFTH_84_Drums_Full_4_Reverb.wav", "drums", 84, undefined, "medium", 0.24, 0.56, "#d56a44", ["exported", "reverb"]),
  exportedSample("lcx-perc-conga-echo", "Conga Groove Echo", "117_Conga_Groove_3_LoFiEcho.wav", "percussion", 117, undefined, "medium", 0.34, 0.42, "#a8a24f", ["exported", "conga", "echo"]),
  exportedSample("lcx-perc-kaos-hat", "Kaos Hat Scratch", "Aim10_92_Kaos_Hat_Scratch_3_Verb.wav", "percussion", 92, undefined, "medium", 0.44, 0.38, "#a8a24f", ["exported", "hat", "scratch"]),
  exportedSample("lcx-perc-phantom-top", "Phantom Top Scratch", "Aim24_81_Phantom_Top_2_Scratch_1.wav", "percussion", 81, undefined, "low", 0.4, 0.4, "#a8a24f", ["exported", "top", "scratch"]),
  exportedSample("lcx-perc-tambourine", "Just Tambourine", "LOA_90_BeatA_Just_Tambourine.wav", "percussion", 90, undefined, "medium", 0.28, 0.42, "#a8a24f", ["exported", "tambourine"]),
  exportedSample("lcx-texture-am-organ-fx", "Am Organ FX", "AED_85_Am_Afrofunk1_Organ_Fx.wav", "texture", 85, "Am", "low", 0.48, 0.34, "#6796b6", ["exported", "organ", "fx"]),
  exportedSample("lcx-texture-one-moment", "C One Moment Scratch", "Aim13_78_C_1_One_Moment_Scratch_1.wav", "texture", 78, "C", "low", 0.46, 0.34, "#6796b6", ["exported", "scratch", "moment"]),
  exportedSample("lcx-texture-b-siren", "B Synth Siren", "BLE5_85_B_Synth_Siren_02.wav", "texture", 85, "B", "low", 0.62, 0.28, "#6796b6", ["exported", "siren", "synth"]),
  exportedSample("lcx-texture-dub-siren", "F Dub Siren", "E1_ROOTS_115_F_Dub_Siren_02.wav", "texture", 115, "F", "medium", 0.56, 0.32, "#6796b6", ["exported", "dub", "siren"]),
  exportedSample("lcx-texture-wah-em", "Em Wah Guitar", "XVT_80_Em_Yallahs_Wah_Elec_Gtr.wav", "texture", 80, "Em", "low", 0.36, 0.38, "#6796b6", ["exported", "wah", "guitar"]),
  exportedSample("lcx-texture-skank-bm", "Bm Skank Guitar", "XVT_82_Bm_Boscobel_Skank_Elec_Gtr_2_Verb.wav", "texture", 82, "Bm", "low", 0.34, 0.38, "#6796b6", ["exported", "skank", "guitar"]),
  exportedSample("lcx-texture-dub-fx", "Dub Siren FX", "D1S_Dub_Siren_FX_21.wav", "texture", 0, undefined, "high", 0.7, 0.18, "#6796b6", ["exported", "dub", "siren", "fx"]),
  exportedSample("lcx-vocal-em-vocoder", "Em Male Vocoder", "RA_JPV1_90_Em_Joe_Publik_Male_Vocals_Chorus_Variation_Layer_1_Vocoder.wav", "vocal", 90, "Em", "medium", 0.5, 0.34, "#b96f8a", ["exported", "vocoder", "male"]),
  exportedSample("lcx-vocal-gm-filter", "Gm Female Vocal Filter", "USV_120_Gm_RewindTime_Female_Vocal_Filter.wav", "vocal", 120, "Gm", "medium", 0.44, 0.34, "#b96f8a", ["exported", "female", "filter"]),
  exportedSample("lcx-vocal-am-phrase", "Am Dry Vocal Phrase", "VR_HBAA_86_Am_Dry_Vocal_Phrase_Female_Shut_Up.wav", "vocal", 86, "Am", "low", 0.62, 0.24, "#b96f8a", ["exported", "phrase", "dry"]),
  exportedSample("lcx-vocal-spoken-psychedelic", "Psychedelic Spoken Phrase", "YAK_84_Male_Vocal_Spoken_Phrase_PsycedelicFunk.wav", "vocal", 84, undefined, "low", 0.58, 0.26, "#b96f8a", ["exported", "spoken", "psychedelic"]),
  exportedSample("lcx-vocal-scratch-vocoder", "Scratch Vocoder", "Aim3_90_5_Stand_Fem_Voc_Scratch_1_Vocoder2.wav", "vocal", 90, undefined, "medium", 0.54, 0.28, "#b96f8a", ["exported", "scratch", "vocoder"]),
  exportedSample("lcx-fill-ruff-scratch", "Ruff Drum Fill Scratch", "Aim10_88_Ruff_Drums_Fill_Scratch_2_Verb.wav", "fills", 88, undefined, "medium", 0.66, 0.24, "#cf5e67", ["exported", "drum-fill", "scratch"]),
  exportedSample("lcx-fill-fm-stabs", "Fm Spacey Organ Stabs", "R1_82_Fm_Spacey_Organ_Lofi_Stabs.wav", "fills", 82, "Fm", "low", 0.5, 0.26, "#cf5e67", ["exported", "stabs", "lofi"]),
];

export const SAMPLE_CLIPS: Clip[] = [
  sample("lc-drums-trip-delay", "Trip Delay Drums", "YEN_82_Song02_TripDelay_Drums_Full_2.wav", "drums", 82, undefined, "medium", 0.22, 0.88, "#d56a44", ["downtempo", "anchor"]),
  sample("lc-drums-trip-out", "Trip Out Live Drums", "XMK_75_TripOut_2_Live_Drums_2_2.wav", "drums", 75, undefined, "medium", 0.18, 0.82, "#bc8257", ["soul", "loose"]),
  sample("lc-drums-afro-trip", "Afro Trip Drums", "wt_ahd_drums_loop_trip_full_128.wav", "drums", 128, undefined, "high", 0.36, 0.45, "#cf7650", ["busier", "lift"]),
  sample("lc-perc-psy-triplet", "Triplet Perc", "hptm_percussion_loop_13_TRIPLE_140.wav", "percussion", 140, undefined, "high", 0.54, 0.5, "#a8a24f", ["restless", "triplet"]),
  sample("lc-fill-glitch-perc", "Glitch Perc Trip", "HMTH_Glitch_Perc_Oneshot_TRIP_05.wav", "fills", 0, undefined, "high", 0.88, 0.28, "#cf5e67", ["rare", "glitch"]),
  sample("lc-texture-em-trippy", "Em Trippy Texture", "TRO_124_Em_Trippy_Texture.wav", "texture", 124, "Em", "medium", 0.48, 0.48, "#6796b6", ["trippy", "keyed"]),

  sample("lc-synth-am-triplet", "Am Triplet Synth", "SPI001_98_Am_TripletSynth_01.wav", "chords", 98, "Am", "medium", 0.34, 0.62, "#c79a52", ["minor", "pulse"]),
  sample("lc-vocal-g-gated", "G Gated Vocal", "SFSY_138_G_Gated_Vocal_23__Triplet_.wav", "vocal", 138, "G", "high", 0.7, 0.32, "#b96f8a", ["gated", "rare"]),
  sample("lc-vocal-e-gated", "E Gated Voice", "SMNT_138_E_Gated_Voice_14__Triplet___Dry_.wav", "vocal", 138, "E", "high", 0.68, 0.34, "#b96f8a", ["gated", "dry"]),
  sample("lc-fill-e-synth", "E Synth Fill", "SPMV_138_E_Synth_Fill_17__Triplet_.wav", "fills", 138, "E", "high", 0.78, 0.32, "#cf5e67", ["triplet", "collapse"]),
  sample("lc-chords-c-triplet-arp", "C Triplet Arp", "BIC_125_C_Triplet_Arp_Syn_1.wav", "chords", 125, "C", "medium", 0.42, 0.56, "#c79a52", ["arp", "keyed"]),

  sample("lc-piano-cm-jammer", "Cm Jammer Piano", "CLTH_126_Cm_Jammer_Piano_Melody.wav", "chords", 126, "Cm", "medium", 0.3, 0.62, "#c79a52", ["piano", "latin"]),
  sample("lc-piano-em-pop", "Em Pop Piano", "FLPP_120_Em_Pop_Piano_02_Pt3.wav", "chords", 120, "Em", "medium", 0.24, 0.66, "#d0aa61", ["piano", "pretty"]),
  sample("lc-piano-am-sinful", "Am Sinful Piano", "YMS_130_Am_Sinful_Piano.wav", "chords", 130, "Am", "medium", 0.36, 0.58, "#c79a52", ["piano", "dark"]),
  sample("lc-piano-c-iowa", "C Piano Iowa", "SS_OK_95_C_Piano_Iowa.wav", "chords", 95, "C", "low", 0.2, 0.68, "#d0aa61", ["piano", "sparse"]),
  sample("lc-piano-g-eb-c", "G Eb C Piano", "Js_Piano_90_GEbC_1.wav", "chords", 90, "G", "low", 0.24, 0.56, "#d0aa61", ["jazz", "smoky"]),

  sample("lc-bass-a-electric", "A Electric Bass", "NDC_118_A_Electric_Bass_Kit_01.wav", "bass", 118, "A", "medium", 0.22, 0.72, "#609a7b", ["electric", "groove"]),
  sample("lc-bass-gm-synth", "Gm Synth Bass", "YLX_126_Gm_Synth_Bass.wav", "bass", 126, "Gm", "medium", 0.32, 0.58, "#609a7b", ["synth", "minor"]),
  sample("lc-bass-cm", "Cm Bass", "MM_NBT_126_Cm_Bass_015.wav", "bass", 126, "Cm", "medium", 0.26, 0.62, "#609a7b", ["techno", "minor"]),
  sample("lc-bass-emaj-dusty", "Emaj Dusty Bass", "OC_95_Emaj_Dusty_Roads_Bass_Guitar_02_1.wav", "bass", 95, "Emaj", "low", 0.18, 0.7, "#6fa783", ["dusty", "guitar"]),
  sample("lc-bass-g-chord", "G Bass Chord", "YFC_G_Bass_Gtr_Chord_3.wav", "bass", 0, "G", "low", 0.34, 0.36, "#75ad89", ["one-shot", "chord"]),
  sample("lc-bass-e-saturated", "E Saturated Bass", "KEM_E_Saturated_Synth_Bass.wav", "bass", 0, "E", "high", 0.58, 0.28, "#609a7b", ["one-shot", "grit"]),
  sample("lc-bass-e-flangus", "E Flangus Bass", "X1L_E_Kit2_Flangus_Syn_Bass.wav", "bass", 0, "E", "high", 0.62, 0.26, "#609a7b", ["one-shot", "weird"]),
  sample("lc-bass-d-black-sands", "D Black Sands Bass", "XOD_90_D_BlackSands_Syn_Bass.wav", "bass", 90, "D", "low", 0.3, 0.5, "#609a7b", ["dark", "slow"]),

  sample("lc-noise-lft75", "75 Vinyl Crackle", "LFT_75_Vinyl_Crackle_Noise_Texture_FX_Loop_1.wav", "noise", 75, undefined, "low", 0.3, 0.78, "#8f80ba", ["vinyl", "lofi"]),
  sample("lc-noise-ulh90", "90 Turntable Noise", "ULH_90_Turntable_Vinyl_LoFi_Noise_Texture_2.wav", "noise", 90, undefined, "low", 0.28, 0.72, "#8f80ba", ["turntable", "lofi"]),
  sample("lc-noise-mel80", "80 Vinyl Noise", "MEL_80_Vinyl_Noise_FX_Texture_Loop.wav", "noise", 80, undefined, "low", 0.22, 0.74, "#8f80ba", ["vinyl", "soft"]),
  sample("lc-noise-faded-frame", "Faded Vinyl Noise", "FFC_Texture_X_VinylNoise_FA.wav", "texture", 0, undefined, "low", 0.36, 0.5, "#6796b6", ["vinyl", "faded"]),
  sample("lc-noise-dm-squeezy", "Dm Squeezy Vinyl", "MCB_85_Dm_Squeezy_Vinyl_Noise_Texture.wav", "texture", 85, "Dm", "low", 0.42, 0.48, "#6796b6", ["vinyl", "squeezy"]),
  sample("lc-noise-lft85", "85 Vinyl Crackle", "LFT_85_Vinyl_Crackle_Noise_Texture_FX_Loop_2.wav", "noise", 85, undefined, "low", 0.32, 0.7, "#8f80ba", ["vinyl", "crackle"]),
  sample("lc-noise-lhd2", "Lofi Drum Noise", "LHD2_85_Vinyl_Noise_Texture_Loop.wav", "noise", 85, undefined, "low", 0.26, 0.68, "#8f80ba", ["vinyl", "bed"]),
  sample("lc-noise-blue-vibe", "Blue Vibe Texture", "Texture_Vinyl_Noise_03_DBR_BVAT.wav", "texture", 0, undefined, "low", 0.4, 0.46, "#6796b6", ["ambient", "vinyl"]),
  ...IMPORTED_SAMPLE_CLIPS,
];
