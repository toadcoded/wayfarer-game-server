type SoundName = 'click' | 'step' | 'success' | 'error' | 'combat' | 'gather' | 'level' | 'ambient';
/** Browser-only audio feedback. No external assets, autoplay-safe, and disposable. */
export declare class RealmAudio {
    private context;
    private master;
    private music;
    private timer;
    private enabled;
    private volume;
    private started;
    private lastStep;
    private readonly frequencies;
    private getContext;
    setEnabled(value: boolean): void;
    setVolume(value: number): void;
    get isEnabled(): boolean;
    get currentVolume(): number;
    start(): Promise<void>;
    private scheduleMusic;
    private tone;
    play(sound: SoundName): void;
    dispose(): void;
}
export {};
