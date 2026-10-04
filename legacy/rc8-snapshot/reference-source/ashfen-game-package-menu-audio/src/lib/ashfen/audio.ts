import { audioGain, type AudioPreferences } from "./settings.ts";

/** Lightweight synthesized audio for Ashfen; keeps the client asset-free while settings are persisted. */
export class AudioController {
  private context: AudioContext | null = null;
  private musicTimer: number | null = null;
  private preferences: AudioPreferences;

  constructor(preferences: AudioPreferences) {
    this.preferences = preferences;
  }

  private ensureContext() {
    if (typeof window === "undefined") return null;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") void this.context.resume();
    return this.context;
  }

  setPreferences(preferences: AudioPreferences) {
    const soundtrackChanged = this.preferences.soundtrack !== preferences.soundtrack;
    this.preferences = preferences;
    if (!audioGain(preferences, "music")) this.stopMusic();
    else if (soundtrackChanged && this.musicTimer !== null) {
      this.stopMusic();
      this.startMusic();
    }
  }

  startMusic() {
    if (this.musicTimer !== null || !audioGain(this.preferences, "music")) return;
    const context = this.ensureContext();
    if (!context) return;
    const notes = this.preferences.soundtrack === "mire" ? [196, 233, 262, 233] : [147, 175, 196, 175];
    let step = 0;
    const pulse = () => {
      if (!this.musicTimer || !audioGain(this.preferences, "music")) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = notes[step++ % notes.length];
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, audioGain(this.preferences, "music") * 0.045), context.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.45);
    };
    pulse();
    this.musicTimer = window.setInterval(pulse, 520);
  }

  stopMusic() {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  playSfx(kind: "click" | "skill" | "hit" | "touch" | "interact" = "click", preferencesOverride?: AudioPreferences) {
    const context = this.ensureContext();
    const preferences = preferencesOverride ?? this.preferences;
    const gainAmount = audioGain(preferences, "sfx");
    if (!context || !gainAmount) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = kind === "skill" ? 520 : kind === "hit" ? 110 : kind === "interact" ? 410 : kind === "touch" ? 250 : 320;
    const duration = kind === "interact" ? 0.14 : kind === "touch" ? 0.055 : 0.1;
    oscillator.type = kind === "hit" ? "square" : kind === "touch" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (kind === "touch" ? 0.82 : 0.7), context.currentTime + duration * 0.8);
    gain.gain.setValueAtTime(gainAmount * (kind === "touch" ? 0.045 : 0.08), context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.01);
  }

  dispose() {
    this.stopMusic();
    if (this.context) void this.context.close();
    this.context = null;
  }
}
