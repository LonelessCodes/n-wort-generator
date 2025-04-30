<template>
  <div ref="rootElem" class="word-reel">
    <div class="reel-stage">
      <div
        class="reel"
        :style="{
          animation: `spin-${prevSeed}-${seed} ${animationDuration}s cubic-bezier(0.43,-0.1, 0.25, 1)`,
        }"
        :class="`spin-${seed}`"
        @animationend="onAnimationEnd"
      >
        <div
          class="slot"
          v-for="(word, index) in processedWords"
          :key="index"
          :data-index="index"
          :style="{
            transform: `rotateX(${slotAngle * index}deg) translateZ(${reelRadius}px)`,
          }"
        >
          <p>{{ word }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useElementSize } from "@vueuse/core";
import type { Ref } from "vue";
import { watch } from "vue";
import { computed } from "vue";
import { ref } from "vue";

const props = defineProps<{
  words: string[];
  /** time offset for the animation */
  offsetSecs: number;
}>();

const rootElem = ref<HTMLElement | null>(null);

const { height } = useElementSize(rootElem, {
  height: 0,
  width: 0,
});

const baseDuration = ref(4);
const animationDuration = computed(() => baseDuration.value + props.offsetSecs);
const slotsPerReel = computed(() => props.words.length);
const slotAngle = computed(() => 360 / slotsPerReel.value);
const panelHeight = computed(() => height.value * 0.42);
const reelRadius = computed(() =>
  Math.round(panelHeight.value / 2 / Math.tan(Math.PI / slotsPerReel.value)),
);

function getSeed(oldSeed = 0) {
  // generate random number smaller than 13 then floor it to settle between 0 and 12 inclusive
  // the seed cannot be the same or in proximity of the old seed
  let newSeed: number;
  do {
    newSeed = Math.floor(Math.random() * slotsPerReel.value);
    // if the new seed is too close to the old seed, generate a new one
  } while (Math.abs(newSeed - oldSeed) < 2);
  return newSeed;
}

const prevSeed = ref(0);
const seed = ref(0);
const processedWords = ref<string[]>([]);

watch(
  () => props.words,
  (newWords) => {
    // if the words change, reset the seed
    prevSeed.value = seed.value;
    seed.value = getSeed(prevSeed.value);

    // rotate the words array by the seed, so that the first word is the one at the seed index
    const rotatedWords = [...newWords.slice(-seed.value), ...newWords.slice(0, -seed.value)];
    // replace elements of the new array with the currently visible ones so it looks seemless
    for (let i = -1; i <= 1; i++) {
      rotatedWords[
        (prevSeed.value + i + processedWords.value.length) % processedWords.value.length
      ] =
        processedWords.value[
          (prevSeed.value + i + processedWords.value.length) % processedWords.value.length
        ];
    }
    processedWords.value = rotatedWords;
  },
  { immediate: true },
);

const onAnimationEnd = () => {};

export interface WordReelExpose {
  seed: Ref<number>;
  prevSeed: Ref<number>;
}
defineExpose<WordReelExpose>({
  seed,
  prevSeed,
});
</script>

<style lang="scss">
.word-reel {
  --gold-dark: #57170b;
  --gold: #c47b2c;
  --gold-light: #f4e787;
  --border-radius: 1.5em;
  font-size: 1rem;
  position: relative;
  width: 72em;
  height: 13em;
  background-color: white;
  background-color: black;
  border-radius: var(--border-radius);
}
.word-reel::before {
  --border-width: 0.5em;
  content: "";
  position: absolute;
  inset: calc(var(--border-width) * -1);
  background-image: linear-gradient(
    75deg,
    var(--gold-dark) 0%,
    var(--gold) 10%,
    var(--gold-light) 10.5%,
    var(--gold) 70%,
    var(--gold-dark) 70.5%,
    var(--gold) 100%
  );
  border-radius: calc(var(--border-radius) + var(--border-width));
}
.word-reel::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(
    rgba(black, 0.5) 0%,
    rgba(black, 0.3) 10%,
    rgba(black, 0.1) 25%,
    transparent 40%,
    transparent 60%,
    rgba(black, 0.1) 75%,
    rgba(black, 0.4) 100%
  );
  box-shadow: inset 0 0 0.6em 0.125em rgba(black, 0.3);
  border-radius: var(--border-radius);
}

.reel-stage {
  border-radius: var(--border-radius);
  overflow: hidden;
  background-color: white;
  width: 100%;
  height: 100%;
  padding-top: calc((v-bind(height) - v-bind(panelHeight)) / 2 * 1px);

  -webkit-perspective: 35em;
  -moz-perspective: 35em;
  perspective: 35em; /* Setting the perspective of the contents of the stage but not the stage itself*/
}

.reel {
  --width: 15em;
  --height: v-bind(panelHeight + "px");
  position: relative;
  font-size: 4em;
  height: var(--height);
  width: var(--width);
  margin: 0 auto;
  transform-style: preserve-3d;
}

.slot {
  position: absolute;
  height: var(--height);
  width: var(--width);
  background: #fff;
  color: black;
  // border: solid 1px #000;
  -webkit-backface-visibility: hidden;
  -moz-backface-visibility: hidden;
  backface-visibility: hidden;
}

.slot p {
  font-family: "Changa One", system-ui;
  font-family: "Abril Fatface", system-ui;
  font-size: calc(var(--height) * 0.8);
  text-align: center;
  font-weight: normal;
  line-height: var(--height);
  margin: 0;
  text-align: center;
  // clip the text to a single line
  text-overflow: clip;
  white-space: nowrap;
  overflow: hidden;
}

$roll-by: 360 * 10;
// $roll-by: 360;

@for $to from 0 through 11 {
  .spin-#{$to} {
    transform: rotateX(-#{$roll-by + $to * 30}deg);

    // > .slot[data-index="#{$to}"] p {
    //   font-weight: bold;
    // }
  }
}

// generate from-to spin animations for all 12 slots
@for $from from 0 through 11 {
  @for $to from 0 through 11 {
    @keyframes spin-#{$from}-#{$to} {
      0% {
        transform: rotateX(-#{$from * 30}deg);
      }
      100% {
        transform: rotateX(-#{$roll-by + $to * 30}deg);
      }
    }
  }
}
</style>
