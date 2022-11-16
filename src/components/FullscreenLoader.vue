<template>
  <div class="loader" />
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "FullscreenLoader",
});
</script>

<style>
.loader {
  position: absolute;
  inset: 0;
  z-index: 1000;
  background-color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.loader:after {
  --color: var(--primary-hover);
  content: " ";
  display: block;
  width: 64px;
  height: 64px;
  margin: 8px;
  border-radius: 50%;
  border: 6px solid var(--color);
  border-color: var(--color) transparent var(--color) transparent;
  animation: loader 1s linear infinite;
}
@keyframes loader {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
