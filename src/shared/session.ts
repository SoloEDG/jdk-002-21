import type { Note, Track } from "./chart";
export type Phase = "ready" | "playing" | "paused" | "finished";
export type Grade = "PERFECT" | "GREAT" | "GOOD" | "MISS";
export type Hit = { noteId: string; grade: Grade; delta: number; beat: number };
export type Run = {
  id: string;
  track: Track;
  practice: boolean;
  speed: number;
  start: number;
  end: number;
  notes: Note[];
};
export type Result = {
  id: string;
  trackId: string;
  title: string;
  at: number;
  score: number;
  accuracy: number;
  maxCombo: number;
  hits: Hit[];
  practice: boolean;
  speed: number;
};
export type PracticeConfig = {
  enabled: boolean;
  speed: number;
  start: number;
  end: number;
};
export type LayerId = "melody" | "beat";
export type LayerVolumes = Record<LayerId, number>;
export const DEFAULT_LAYER_VOLUMES: LayerVolumes = { melody: 0.45, beat: 0.45 };
export const clampLayerVolume = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export function makeRun(track: Track, config: PracticeConfig): Run {
  const start = config.enabled ? config.start : 0;
  const end = config.enabled ? config.end : track.beats;
  return {
    id: crypto.randomUUID(),
    track,
    practice: config.enabled,
    speed: config.enabled ? config.speed : 1,
    start,
    end,
    notes: track.notes.filter(
      (n) => n.beat >= start && n.beat + n.duration <= end,
    ),
  };
}
