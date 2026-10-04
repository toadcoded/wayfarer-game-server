export const BRIGHTNESS_STEPS = [70, 85, 100, 115, 130] as const;
export type Brightness = (typeof BRIGHTNESS_STEPS)[number];
export const SOUNDTRACKS = ["reedhaven", "mire", "none"] as const;
export type SoundtrackId = (typeof SOUNDTRACKS)[number];
export type AudioPreferences = { muted: boolean; masterVolume: number; musicVolume: number; sfxVolume: number; soundtrack: SoundtrackId };
export type AshfenPreferences = { brightness: Brightness; audio: AudioPreferences; reduceEffects: boolean; largeUi: boolean; showMinimap: boolean };
export const DEFAULT_PREFERENCES: AshfenPreferences = { brightness: 100, audio: { muted: false, masterVolume: .7, musicVolume: .55, sfxVolume: .75, soundtrack: "reedhaven" }, reduceEffects: false, largeUi: false, showMinimap: true };
export const clampVolume = (value: unknown, fallback = .7) => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.round(Math.max(0, Math.min(1, n)) * 20) / 20;
};
export function normalizePreferences(input: unknown): AshfenPreferences {
  const raw = input && typeof input === "object" ? input as Partial<AshfenPreferences> : {};
  const audio = raw.audio && typeof raw.audio === "object" ? raw.audio as Partial<AudioPreferences> : {};
  const soundtrack = SOUNDTRACKS.includes(audio.soundtrack as SoundtrackId) ? audio.soundtrack as SoundtrackId : DEFAULT_PREFERENCES.audio.soundtrack;
  const brightness = BRIGHTNESS_STEPS.includes(raw.brightness as Brightness) ? raw.brightness as Brightness : DEFAULT_PREFERENCES.brightness;
  return { brightness, reduceEffects: raw.reduceEffects === true, largeUi: raw.largeUi === true, showMinimap: raw.showMinimap !== false, audio: { muted: audio.muted === true, masterVolume: clampVolume(audio.masterVolume, .7), musicVolume: clampVolume(audio.musicVolume, .55), sfxVolume: clampVolume(audio.sfxVolume, .75), soundtrack } };
}
export const audioGain = (audio: AudioPreferences, channel: "music" | "sfx") => audio.muted ? 0 : audio.masterVolume * (channel === "music" ? audio.musicVolume : audio.sfxVolume);
