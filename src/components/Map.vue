<template>
  <l-map :zoom="zoom" :center="center" @click="$emit('mapClick', $event)">
    <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>

    <l-circle-marker
      v-for="marker in markers"
      :key="marker._id"
      :latLng="marker.position"
      :radius="markerSize"
      :color="`var(--marker-stroke)`"
      :weight="0.3"
      :fillOpacity="1"
      :fillColor="`var(--marker-${marker.state})`"
      :bubblingMouseEvents="false"
      @click="$emit('markerClick', marker)"
    >
      <l-tooltip class="poi-tooltip">
        <h2>POI: {{ marker.name }}</h2>
        <strong>State</strong>: {{ marker.state }}
      </l-tooltip>
    </l-circle-marker>
  </l-map>
</template>

<script lang="ts">
import { KMarker } from "@/types";
import type { LatLngTuple } from "leaflet";
import Vue from "vue";
import { LCircleMarker, LMap, LTileLayer, LTooltip } from "vue2-leaflet";

export default Vue.extend({
  name: "KMap",
  components: {
    LMap,
    LTileLayer,
    LCircleMarker,
    LTooltip,
  },
  props: {
    zoom: {
      type: Number,
      default: 2,
    },
    center: {
      required: true,
      type: Array as unknown as Vue.PropType<LatLngTuple>,
    },
    markerSize: {
      type: Number,
      default: 6,
    },
  },
  data() {
    return {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", // Url for tile layer
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', // Attribution of tile
      markers: [] as KMarker[],
    };
  },
  methods: {
    _getMarkerIndex(id: KMarker["_id"]): number {
      return this.markers.findIndex((marker) => marker._id === id);
    },

    /**
     * Add new marker to he map
     * @param marker The new marker
     */
    addMarker(marker: KMarker) {
      this.markers.push(marker);
    },

    /**
     * Remove an marker from map
     * @param id The marker id
     */
    removeMarker(id: KMarker["_id"]) {
      const index = this._getMarkerIndex(id);
      if (index === -1) {
        return;
      }
      this.markers.splice(index, 1);
    },

    /**
     * Update marker data
     * @param id The marker id
     * @param newData The new marker data
     */
    updateMarker(id: KMarker["_id"], newData: KMarker) {
      if (id !== newData._id) {
        throw new Error("Could not update marker with different id!");
      }
      const index = this._getMarkerIndex(id);
      if (index === -1) {
        return;
      }

      this.$set(this.markers, index, newData);
    },
  },
});
</script>

<style>
.poi-tooltip h2 {
  font-size: 1.2em;
  margin: 0;
}
</style>
