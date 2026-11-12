import type { LayerId, LayerVolumes, Run } from "../../../shared/session";
import { clampLayerVolume } from "../../../shared/session";
import { secondsAt } from "../../../shared/chart";
export class AudioTransport {
  private epoch = 0;
  private context: AudioContext | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private anchor = 0;
  private offset = 0;
  private speed = 1;
  private active = false;
  private gains: Record<LayerId, GainNode | null> = {
    melody: null,
    beat: null,
  };
  private volumes: LayerVolumes = { melody: 0.45, beat: 0.45 };
  get time() {
    return (
      this.offset +
      (this.active && this.context
        ? (this.context.currentTime - this.anchor) * this.speed
        : 0)
    );
  }
  async play(run: Run, at: number) {
    this.stop();
    const token = this.epoch;
    this.context ??= new AudioContext();
    await this.context.resume();
    if (token !== this.epoch) return;
    const ctx = this.context;
    this.offset = at;
    this.speed = run.speed;
    this.anchor = ctx.currentTime + 0.04;
    this.active = true;
    // 两条独立增益总线：只调增益不重建音源，播放头与判定不受影响
    (Object.keys(this.gains) as LayerId[]).forEach((layer) => {
      const gain = ctx.createGain();
      gain.gain.value = this.volumes[layer];
      gain.connect(ctx.destination);
      this.gains[layer] = gain;
    });
    const end = secondsAt(run.end, run.track.bpm);
    for (let beat = 0; beat < run.end; beat += 0.5) {
      const time = secondsAt(beat, run.track.bpm);
      if (time < at || time >= end) continue;
      const when = this.anchor + (time - at) / this.speed;
      const strong = beat % 1 === 0;
      const layer: LayerId = strong ? "melody" : "beat";
      const osc = ctx.createOscillator(),
        env = ctx.createGain();
      osc.type = strong ? "triangle" : "sine";
      const freq = strong ? run.track.melody[Math.floor(beat) % 8]! : 70;
      osc.frequency.setValueAtTime(freq, when);
      if (!strong)
        osc.frequency.exponentialRampToValueAtTime(35, when + 0.12 / run.speed);
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(strong ? 0.22 : 0.5, when + 0.008);
      env.gain.exponentialRampToValueAtTime(
        0.0001,
        when + (strong ? 0.25 : 0.12) / run.speed,
      );
      osc.connect(env);
      env.connect(this.gains[layer]!);
      osc.start(when);
      osc.stop(when + 0.35 / run.speed);
      this.sources.push(osc);
    }
  }
  pause() {
    const at = this.time;
    this.stop();
    this.offset = at;
    return at;
  }
  stop() {
    this.epoch++;
    this.active = false;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {}
      s.disconnect();
    }
    this.sources = [];
    (Object.keys(this.gains) as LayerId[]).forEach((layer) => {
      this.gains[layer]?.disconnect();
      this.gains[layer] = null;
    });
  }
  setLayerVolume(layer: LayerId, value: number) {
    const clamped = clampLayerVolume(value);
    this.volumes[layer] = clamped;
    // 演出中直接平滑作用于当前增益节点，不停止、不重排已调度的声音
    this.gains[layer]?.gain.setTargetAtTime(
      clamped,
      this.context!.currentTime,
      0.03,
    );
  }
}
