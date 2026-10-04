export const BRIGHTNESS_STEPS = [70, 85, 100, 115, 130];
export const SOUNDTRACKS = ["reedhaven", "mire", "none"];
export const DEFAULT_PREFERENCES = { brightness: 100, audio: { muted: false, masterVolume: .7, musicVolume: .55, sfxVolume: .75, soundtrack: "reedhaven" }, reduceEffects: false, largeUi: false, showMinimap: true };
export const clampVolume = (value, fallback = .7) => {
    const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
    return Math.round(Math.max(0, Math.min(1, n)) * 20) / 20;
};
export function normalizePreferences(input) {
    const raw = input && typeof input === "object" ? input : {};
    const audio = raw.audio && typeof raw.audio === "object" ? raw.audio : {};
    const soundtrack = SOUNDTRACKS.includes(audio.soundtrack) ? audio.soundtrack : DEFAULT_PREFERENCES.audio.soundtrack;
    const brightness = BRIGHTNESS_STEPS.includes(raw.brightness) ? raw.brightness : DEFAULT_PREFERENCES.brightness;
    return { brightness, reduceEffects: raw.reduceEffects === true, largeUi: raw.largeUi === true, showMinimap: raw.showMinimap !== false, audio: { muted: audio.muted === true, masterVolume: clampVolume(audio.masterVolume, .7), musicVolume: clampVolume(audio.musicVolume, .55), sfxVolume: clampVolume(audio.sfxVolume, .75), soundtrack } };
}
export const audioGain = (audio, channel) => audio.muted ? 0 : audio.masterVolume * (channel === "music" ? audio.musicVolume : audio.sfxVolume);
