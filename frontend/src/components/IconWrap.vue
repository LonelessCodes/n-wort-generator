<template>
  <div class="icon-wrap">
    <slot />
  </div>
</template>

<script lang="ts" setup></script>

<style scoped>
.icon-wrap {
  --color: inherit;
  height: 1em;
  width: 1em;
  line-height: 1em;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: relative;
  fill: currentColor;
  color: var(--color);
  font-size: inherit;
}

.icon-wrap svg {
  height: 1em;
  width: 1em;
}
</style>
