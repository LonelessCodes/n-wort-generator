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
    <div class="game_content">
      <div class="text text-nettles">Nettles</div>
      <WordReel ref="reel0" :words="words[0]" :offset-secs="0.0" />
      <div class="text text-nicht">Nicht</div>
      <WordReel ref="reel1" :words="words[1]" :offset-secs="0.2" />
      <div class="text text-Neetup">Neetup</div>
    </div>
    <div class="result_overlay"></div>
    <div
      class="setup_overlay"
      :class="{ 'setup_overlay--show': bleConnectionStatus !== 'connected' }"
      v-show="false"
    >
      <div class="setup_overlay_icon">
        <IconWrap>
          <WifiIcon />
        </IconWrap>
      </div>
      <button
        class="setup_overlay_button"
        v-if="bleConnectionStatus === 'disconnected'"
        @click="connectToBle()"
      >
        Connect BLE Button (press <kbd>c</kbd>)
      </button>
      <button
        class="setup_overlay_button"
        v-else-if="bleConnectionStatus === 'connecting'"
        @click="disconnectBle()"
      >
        Connecting...
      </button>
      <button class="setup_overlay_button" v-else @click="disconnectBle()">Disconnect</button>
    </div>
    <div class="debug" v-if="displayDebug">
      <div class="debug_text debug_heading">Debug</div>
      <div class="debug_text">Connection: {{ bleConnectionStatus }}</div>
      <div class="debug_text">State: {{ state }}</div>
      <div class="debug_text">Roll 0: {{ words[0].join(", ") }}</div>
      <div class="debug_text">Roll 0: {{ reel0?.seed }}, {{ reel0?.prevSeed }}</div>
      <div class="debug_text">Roll 1: {{ words[1].join(", ") }}</div>
      <div class="debug_text">Roll 1: {{ reel1?.seed }}, {{ reel1?.prevSeed }}</div>
      <div class="debug_text">Press <kbd>Enter</kbd> to spin</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import { WifiIcon } from "@heroicons/vue/24/solid";

import IconWrap from "@/components/IconWrap.vue";
import WordReel, { type WordReelExpose } from "@/components/WordReel.vue";

import useBluetoothButton from "@/composables/useBluetoothButton";

import { generateNArraysOfMRandomNwoerter, nwoerter } from "./n-woerter";

const reel0 = ref<WordReelExpose>();
const reel1 = ref<WordReelExpose>();

const state = ref<"ready" | "rolling" | "result">("ready");
const words = ref<string[][]>(generateNArraysOfMRandomNwoerter(2, 12));
const displayDebug = ref(false);

const { bleConnectionStatus, connectToBle, disconnectBle, setLedState, onButPressed } =
  useBluetoothButton();

onButPressed(() => {
  spin();
});

watch(
  state,
  (newState) => {
    if (bleConnectionStatus.value !== "connected") return;

    if (newState === "rolling") {
      setLedState(true);
    } else {
      setLedState(false);
    }
  },
  { immediate: true },
);

const spin = () => {
  if (state.value !== "ready") return;

  console.log("spinnnn");

  // Generate new random words
  words.value = generateNArraysOfMRandomNwoerter(2, 12);
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
.game_content {
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

.result_overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  display: none;
}
.setup_overlay {
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
.setup_overlay_icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 20em;
}
.setup_overlay_button {
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
.setup_overlay_button:hover {
  background-color: #21a1f1;
}
.setup_overlay_button:active {
  background-color: #1e90ff;
}
.setup_overlay_button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.setup_overlay--show {
  opacity: 1;
  pointer-events: all;
}

.debug {
  position: absolute;
  z-index: 11;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 10px;
  max-width: 40ch;
}
.debug_text {
  font-weight: 300;
  font-size: 14px;
  margin: 5px 0;
}
.debug_heading {
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
}
</style>
