<!-- A slot machine game -->
<template>
  <div
    class="game"
    :class="{
      'state-ready': state === 'ready',
      'state-rolling': state === 'rolling',
      'state-result': state === 'result',
    }"
  >
    <div class="game-content">
      <div class="text text-nettles">Nettles</div>
      <WordReel ref="reel0" :words="words[0]" :offset-secs="0.0" />
      <div class="text text-nicht">Nicht</div>
      <WordReel ref="reel1" :words="words[1]" :offset-secs="0.2" />
      <div class="text text-Neetup">Neetup</div>
    </div>
    <div class="result-overlay">
      <img class="result-overlay_backdrop-rays" src="@/assets/circular-rays.png" />
      <div class="result-text result-text-nettles">Nettles</div>
      <div class="result-text result-text-word0">{{ result[0] }}</div>
      <div class="result-text result-text-nicht">Nicht</div>
      <div class="result-text result-text-word1">{{ result[1] }}</div>
      <div class="result-text result-text-Neetup">Neetup</div>
      <div class="result-overlay_bottom-shine"></div>
    </div>
    <div
      class="setup-overlay"
      :class="{ 'setup-overlay--show': bleConnectionStatus !== 'connected' }"
      v-show="false"
    >
      <div class="setup-overlay_icon">
        <IconWrap>
          <WifiIcon />
        </IconWrap>
      </div>
      <button
        class="setup-overlay_button"
        v-if="bleConnectionStatus === 'disconnected'"
        @click="connectToBle()"
      >
        Connect BLE Button (press <kbd>c</kbd>)
      </button>
      <button
        class="setup-overlay_button"
        v-else-if="bleConnectionStatus === 'connecting'"
        @click="disconnectBle()"
      >
        Connecting...
      </button>
      <button class="setup-overlay_button" v-else @click="disconnectBle()">Disconnect</button>
    </div>
    <div class="debug-overlay" v-if="displayDebug">
      <div class="debug-overlay_text debug-overlay_heading">Debug</div>
      <div class="debug-overlay_text">Connection: {{ bleConnectionStatus }}</div>
      <div class="debug-overlay_text">State: {{ state }}</div>
      <div class="debug-overlay_text">Roll 0: {{ words[0].join(", ") }}</div>
      <div class="debug-overlay_text">Roll 0: {{ reel0?.seed }}, {{ reel0?.prevSeed }}</div>
      <div class="debug-overlay_text">Roll 1: {{ words[1].join(", ") }}</div>
      <div class="debug-overlay_text">Roll 1: {{ reel1?.seed }}, {{ reel1?.prevSeed }}</div>
      <div class="debug-overlay_text">Press <kbd>Enter</kbd> to spin</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useEventListener, useIntervalFn } from "@vueuse/core";
import { WifiIcon } from "@heroicons/vue/24/solid";

import IconWrap from "@/components/IconWrap.vue";
import WordReel, { SLOTS_PER_REEL, type ReelStageExpose } from "@/components/ReelStage.vue";

import useBluetoothButton from "@/composables/useBluetoothButton";

import { generateNArraysOfMRandomNwoerter } from "./n-woerter";

const reel0 = ref<ReelStageExpose>();
const reel1 = ref<ReelStageExpose>();

const state = ref<"ready" | "rolling" | "result">("result");
const words = ref<string[][]>(generateNArraysOfMRandomNwoerter(2, SLOTS_PER_REEL));
const displayDebug = ref(false);

const result = computed<[string, string]>(() => [words.value[0][0], words.value[1][0]]);

const { bleConnectionStatus, connectToBle, disconnectBle, setLedState, onButPressed } =
  useBluetoothButton();

watch(
  state,
  (newState, _, onCleanup) => {
    if (bleConnectionStatus.value !== "connected") return;

    if (newState === "ready") {
      setLedState(true);
    } else if (newState === "rolling") {
      const blinkInterval = 300;
      const interval = useIntervalFn(async () => {
        setLedState(true);
        await new Promise((resolve) => setTimeout(resolve, blinkInterval / 2));
        setLedState(false);
      }, blinkInterval);
      onCleanup(() => {
        interval.pause();
      });
    } else if (newState === "result") {
      setLedState(false);
    }
  },
  { immediate: true },
);

const spin = () => {
  if (state.value !== "ready") return;

  console.log("spinnnn");

  // Generate new random words
  words.value = generateNArraysOfMRandomNwoerter(2, SLOTS_PER_REEL);
  // Set the state to rolling
  state.value = "rolling";
  setTimeout(() => {
    state.value = "result";
    setTimeout(() => {
      state.value = "ready";
    }, 2000);
  }, 2000);
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" && state.value === "ready") {
    spin();
  } else if (event.key === "d") {
    displayDebug.value = !displayDebug.value;
  } else if (event.key === "c") {
    if (bleConnectionStatus.value === "disconnected") {
      connectToBle();
    } else {
      disconnectBle();
    }
  }
};

useEventListener("keydown", handleKeydown);

onButPressed(() => {
  spin();
});
</script>

<style>
/* global styles */
/* variables */
/* elements */
/* components */
.game {
  position: relative;
  height: 100svh;
}
.game-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: #282c34;
  color: white;
  font-size: 30px;
}
.text {
  font-family: "Abril Fatface", system-ui;
  font-size: 2em;
  /* font-weight: bold; */
  text-align: center;
  margin: 0.5em;
}

.result-overlay {
  --gold-dark: #57170b;
  --gold: #c47b2c;
  --gold-light: #f4e787;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}
.result-overlay_backdrop-rays {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 90vw;
  height: 90vw;
  object-fit: cover;
}
.result-text {
  background: linear-gradient(
    80deg,
    var(--gold) 0%,
    var(--gold-light) 10%,
    var(--gold) 10.5%,
    var(--gold-dark) 70%,
    var(--gold) 70.5%,
    var(--gold) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* golden shine */
  text-shadow:
    0 0 3em var(--gold),
    0 0 0.5em var(--gold-light);
  font-size: 5em;
}
/* .result-text-nettles {
  color: #61dafb;
}
.result-text-word0 {
  color: #61dafb;
}
.result-text-nicht {
  color: #61dafb;
}
.result-text-word1 {
  color: #61dafb;
}
.result-text-Neetup {
  color: #61dafb;
} */
.result-overlay_bottom-shine {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  --gold-light-transparent: #f4e78700;
  /* radial gradient golden shine from bottom */
  background-image: radial-gradient(
    ellipse closest-corner at 50% 180%,
    var(--gold-light) 0%,
    var(--gold-light-transparent) 100%
  );
}

.setup-overlay {
  position: absolute;
  z-index: 10;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: white;

  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.setup-overlay_icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 20em;
}
.setup-overlay_button {
  background-color: #61dafb;
  color: #282c34;
  font-size: 3em;
  font-weight: bold;
  text-align: center;
  cursor: pointer;
  border: none;
  padding: 0.75em 1.25em;
  border-radius: 0.25em;
}
.setup-overlay_button:hover {
  background-color: #21a1f1;
}
.setup-overlay_button:active {
  background-color: #1e90ff;
}
.setup-overlay_button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.setup-overlay--show {
  opacity: 1;
  pointer-events: all;
}

.debug-overlay {
  position: absolute;
  z-index: 11;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 10px;
  max-width: 40ch;
}
.debug-overlay_text {
  font-weight: 300;
  font-size: 14px;
  margin: 5px 0;
}
.debug-overlay_heading {
  font-size: 18px;
  font-weight: bold;
}

/* utilities */
/* mixins */
/* states */
.state-setup {
}
.state-ready {
}
.state-rolling {
}
.state-result {
  .result-overlay {
    opacity: 1;
    pointer-events: all;
  }
}
</style>
