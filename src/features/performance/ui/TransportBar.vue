<script setup lang="ts">
import type { Phase, LayerVolumes } from "../../../shared/session";
defineProps<{
  phase: Phase;
  time: number;
  duration: number;
  volumes: LayerVolumes;
}>();
defineEmits<{
  start: [];
  pause: [];
  resume: [];
  restart: [];
  layerVolume: [layer: "melody" | "beat", v: number];
}>();
const fmt = (n: number) =>
  `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
const pct = (v: number) => `${Math.round(v * 100)}%`;
</script>
<template>
  <div class="transport">
    <div class="progress">
      <i :style="{ width: Math.min(100, (time / duration) * 100) + '%' }"></i>
    </div>
    <div class="transport-row">
      <span class="timecode"
        >{{ fmt(time) }} <em>/ {{ fmt(duration) }}</em></span
      ><button
        v-if="phase === 'playing'"
        class="primary"
        @click="$emit('pause')"
      >
        Ⅱ 暂停演出</button
      ><button
        v-else-if="phase === 'paused'"
        class="primary"
        @click="$emit('resume')"
      >
        ▶ 继续演出</button
      ><button v-else class="primary" @click="$emit('start')">
        ▶ {{ phase === "finished" ? "再次演出" : "开始演出" }}</button
      ><button
        class="icon-button"
        aria-label="重新开始"
        @click="$emit('restart')"
      >
        ↻</button
      ><div class="volume" role="group" aria-label="分层音量">
        <label
          >旋律 <b>{{ pct(volumes.melody) }}</b
          ><input
            aria-label="旋律音量"
            type="range"
            min="0"
            max="1"
            step=".05"
            :value="volumes.melody"
            @input="
              $emit(
                'layerVolume',
                'melody',
                Number(($event.target as HTMLInputElement).value),
              )
            "
        /></label>
        <label
          >节拍 <b>{{ pct(volumes.beat) }}</b
          ><input
            aria-label="节拍音量"
            type="range"
            min="0"
            max="1"
            step=".05"
            :value="volumes.beat"
            @input="
              $emit(
                'layerVolume',
                'beat',
                Number(($event.target as HTMLInputElement).value),
              )
            "
        /></label>
      </div>
    </div>
  </div>
</template>
