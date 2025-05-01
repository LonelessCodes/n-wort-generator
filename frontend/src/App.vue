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
    <svg class="game-backdrop" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="grad-maschine-außen" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" style="stop-color: rgb(228, 186, 174); stop-opacity: 1" />
          <stop offset="46%" style="stop-color: rgb(255, 255, 255); stop-opacity: 1" />
          <stop offset="64%" style="stop-color: rgb(253, 253, 253); stop-opacity: 1" />
          <stop offset="91%" style="stop-color: rgb(44, 44, 42); stop-opacity: 1" />
          <stop offset="100%" style="stop-color: rgb(115, 108, 102); stop-opacity: 1" />
        </linearGradient>
        <linearGradient id="grad-button" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="10%" style="stop-color: #dddddd; stop-opacity: 1" />
          <stop offset="70%" style="stop-color: #ffffff; stop-opacity: 1" />
        </linearGradient>
        <linearGradient id="grad-big-button" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="10%" style="stop-color: #ffac06; stop-opacity: 1" />
          <stop offset="70%" style="stop-color: #fffe1a; stop-opacity: 1" />
        </linearGradient>
      </defs>

      <!-- 100 small circles in a circle -->

      <path
        d="M 156 0 L 192 960 A 156 60 90 0 1 168 1080 H 1752 A 156 60 90 0 1 1728 960 L 1764 0 Z"
        fill="url(#grad-maschine-außen)"
      />
      <path
        d="M 196 0 L 232 970 A 156 60 90 0 1 208 1080 H 1712 A 156 60 90 0 1 1688 970 L 1724 0 Z"
        fill="#1b1b1b"
      />
      <path d="M 220 0 L 256 1040 H 1664 L 1700 0 Z" fill="#353535" />
      <path d="M 256 1040 L 242 1080 H 1678 L 1664 1040 Z" fill="#504b4f" />

      <ellipse cx="450" cy="1090" rx="120" ry="40" fill="url(#grad-button)" />
      <ellipse cx="850" cy="1090" rx="120" ry="40" fill="url(#grad-button)" />
      <ellipse cx="1400" cy="1075" rx="150" ry="50" fill="url(#grad-big-button)" />
    </svg>
    <div class="game-content">
      <!-- <h1 class="game-title">N-WORT-GENERATOR</h1> -->
      <div class="game-reels">
        <div class="text text-nettles">Nettles</div>
        <WordReel ref="reel0" :words="words[0]" :offset-secs="0.0" />
        <div class="text text-nicht">Nicht</div>
        <WordReel ref="reel1" :words="words[1]" :offset-secs="0.2" />
        <div class="text text-neetup">Neetup</div>
      </div>
    </div>
    <svg class="game-frontdrop" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
      <text xml:space="preserve" class="svg-title-shadow">
        <tspan x="290" y="120">N-WORT-GENERATOR</tspan>
      </text>
      <text xml:space="preserve" class="svg-title-border">
        <tspan x="290" y="120">N-WORT-GENERATOR</tspan>
      </text>
      <text xml:space="preserve" class="svg-title-front">
        <tspan x="290" y="120">N-WORT-GENERATOR</tspan>
      </text>
    </svg>
    <div class="result-overlay">
      <img class="result-overlay_backdrop-rays" src="@/assets/circular-rays.png" />
      <div class="result-text result-text-nettles">Nettles</div>
      <div class="result-text result-text-word0">{{ result[0] }}</div>
      <div class="result-text result-text-nicht">Nicht</div>
      <div class="result-text result-text-word1">{{ result[1] }}</div>
      <div class="result-text result-text-neetup">Neetup</div>
      <div class="result-overlay_bottom-shine"></div>
    </div>
    <div
      class="setup-overlay"
      :class="{ 'setup-overlay--show': bleConnectionStatus !== 'connected' }"
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

const state = ref<"ready" | "rolling" | "result">("ready");
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
    }, 8000);
  }, 4500);
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
:root {
  --font-fancy: "Abril Fatface", system-ui;
  --font-title: "Sigmar One", system-ui;
  --font-cursiv: "Fugaz One", system-ui;
  --font-pixel: "Pixelify Sans Variable", system-ui;
  --font-handwriting: "Grandstander Variable", system-ui;
}

/* variables */
/* elements */
/* components */
.game {
  position: relative;
  height: 100svh;
  overflow: hidden;
}
.game-backdrop {
  background-color: #5a032e;
  position: absolute;
  inset: 0;
}
.game-content {
  position: absolute;
  inset: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: white;
  font-size: 30px;
}
.game-reels {
  position: absolute;
  bottom: 7vh;
  background-color: #1d1c1c;
  border-radius: 1.5em;
  padding: 0 2em;
}
.text {
  font-family: var(--font-cursiv);
  font-size: 2em;
  /* font-weight: bold; */
  text-align: center;
  margin: 0.3em;
}

.game-frontdrop {
  position: absolute;
  inset: 0;
}
.svg-title-shadow {
  font-size: 7em;
  font-style: normal;
  font-weight: normal;
  fill: red;
  fill-opacity: 1;
  font-family: var(--font-title);
  filter: blur(80px);
}
.svg-title-border {
  font-size: 7em;
  font-style: normal;
  font-weight: normal;
  stroke: #000000;
  stroke-width: 0.3em;
  stroke-linecap: butt;
  stroke-linejoin: miter;
  stroke-miterlimit: 1;
  stroke-opacity: 1;
  font-family: var(--font-title);
}
.svg-title-front {
  font-size: 7em;
  font-style: normal;
  font-weight: normal;
  fill: #f00;
  fill-opacity: 1;
  font-family: var(--font-title);
}

.result-overlay {
  --gold-dark: #d3472e;
  --gold: #ff9422;
  --gold-light: #ffffff;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
  /* fade in */
  transition: opacity 0.5s ease;
}
.result-overlay_backdrop-rays {
  position: absolute;
  top: -20vh;
  left: 0vw;
  width: 100vw;
  height: 140vh;
  object-fit: contain;
  opacity: 0.9;
  filter: saturate(1.2) hue-rotate(6deg) brightness(0.8);
  /* rotate animation */
  animation: rotate 20s linear infinite;
}
@keyframes rotate {
  0% {
    transform: scale(1.5) rotate(0deg);
  }
  100% {
    transform: scale(1.5) rotate(360deg);
  }
}
.result-text {
  z-index: 20;
  position: absolute;
  /* background: linear-gradient(
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
  color: transparent; */
  color: white;
  text-shadow:
    /* golden shine */
    0 0 3em var(--gold-dark),
    0 0 0.5em var(--gold);
  font-size: 8em;
  /* line-height: 0.8; */
  width: 100%;
  text-align: center;
}
.result-text-nettles {
  font-family: var(--font-cursiv);
  top: 21vh;
  font-size: 6em;
  left: -19vw;
  --rotate: -10deg;
  transform: rotate(var(--rotate));
  transform-origin: center;
  color: #ffe88e;
}

.result-text-word0 {
  font-family: var(--font-title);
  top: 36vh;
  line-height: 0.8;
  font-size: 9em;
  left: -3vw;
}
.result-text-nicht {
  font-family: var(--font-handwriting);
  top: 45.8vh;
  font-size: 4em;
  left: 11vw;
}
.result-text-word1 {
  font-family: var(--font-pixel);
  top: 52.5vh;
  line-height: 0.8;
  font-size: 8em;
  left: 8vw;
}
.result-text-neetup {
  font-family: var(--font-cursiv);
  top: 64vh;
  font-size: 6em;
  left: 17vw;
  --rotate: -10deg;
  transform: rotate(var(--rotate));
  transform-origin: center;
  color: #ffe88e;
}

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

  .result-text-nettles {
    animation: bounce-in-top 1.1s both 0.2s;
  }
  .result-text-word0 {
    animation: tilt-in-fwd-tr 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both 1.2s;
  }
  .result-text-nicht {
    animation: slide-in-bck-center 0.7s ease-out both 2s;
  }
  .result-text-word1 {
    animation: roll-in-right 0.6s ease-out both 2.8s;
  }
  .result-text-neetup {
    animation: slide-in-elliptic-top-fwd 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both 3.4s;
  }
}

@keyframes bounce-in-top {
  0% {
    transform: rotate(var(--rotate)) translateY(-500px);
    animation-timing-function: ease-in;
    opacity: 0;
  }
  38% {
    transform: rotate(var(--rotate)) translateY(0);
    animation-timing-function: ease-out;
    opacity: 1;
  }
  55% {
    transform: rotate(var(--rotate)) translateY(-65px);
    animation-timing-function: ease-in;
  }
  72% {
    transform: rotate(var(--rotate)) translateY(0);
    animation-timing-function: ease-out;
  }
  81% {
    transform: rotate(var(--rotate)) translateY(-28px);
    animation-timing-function: ease-in;
  }
  90% {
    transform: rotate(var(--rotate)) translateY(0);
    animation-timing-function: ease-out;
  }
  95% {
    transform: rotate(var(--rotate)) translateY(-8px);
    animation-timing-function: ease-in;
  }
  100% {
    transform: rotate(var(--rotate)) translateY(0);
    animation-timing-function: ease-out;
  }
}

@keyframes tilt-in-fwd-tr {
  0% {
    transform: rotateY(20deg) rotateX(35deg) translate(300px, -300px) skew(-35deg, 10deg);
    opacity: 0;
  }
  100% {
    transform: rotateY(0) rotateX(0deg) translate(0, 0) skew(0deg, 0deg);
    opacity: 1;
  }
}

@keyframes slide-in-bck-center {
  0% {
    transform: scale(30);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes roll-in-right {
  0% {
    transform: translateX(800px) rotate(540deg);
    opacity: 0;
  }
  100% {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
}

@keyframes slide-in-elliptic-top-fwd {
  0% {
    transform: rotate(var(--rotate)) translateY(600px) rotateX(-30deg) scale(0);
    transform-origin: 50% 200%;
    opacity: 0;
  }
  100% {
    transform: rotate(var(--rotate)) translateY(0) rotateX(0) scale(1);
    transform-origin: 50% 50%;
    opacity: 1;
  }
}
</style>
