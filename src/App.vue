<template>
  <div id="app">
    <l-map :zoom="zoom" :center="center">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
    </l-map>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { LMap, LTileLayer } from "vue2-leaflet";

interface Data {
  zoom: number;
  center: [number, number];
  url: string;
  attribution: string;
}

export default Vue.extend({
  name: "App",
  components: {
    LMap,
    LTileLayer,
  },
  data(): Data {
    return {
      zoom: 6,
      center: [46.449, 2.21], // Center map to the France country
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", // Url for tile layer
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', // Attribution of tile
    };
  },
});
</script>

<style>
body {
  margin: 0;
}

body,
#app {
  height: 100vh;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
