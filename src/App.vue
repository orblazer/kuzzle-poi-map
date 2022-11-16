<template>
  <div id="app">
    <l-map
      :zoom="leaflet.zoom"
      :center="leaflet.center"
      @click="handleMapClick"
    >
      <l-tile-layer
        :url="leaflet.url"
        :attribution="leaflet.attribution"
      ></l-tile-layer>

      <l-circle-marker
        v-for="marker in markers"
        :key="marker._id"
        :latLng="marker.position"
        :radius="leaflet.poiSize"
        :color="`var(--marker-${marker.state})`"
        :fillColor="`var(--marker-${marker.state})`"
        :bubblingMouseEvents="false"
        @click="handleMarkerClick(marker._id)"
      >
        <l-tooltip class="poi-tooltip">
          <h2>POI: {{ marker.name }}</h2>
          <strong>State</strong>: {{ marker.state }}
        </l-tooltip>
      </l-circle-marker>
    </l-map>

    <div v-if="poiForm.open" class="modal-wrapper">
      <POIForm
        :position="poiForm.position"
        @close="poiForm.open = false"
        @submit="addMarker"
      ></POIForm>
    </div>
  </div>
</template>

<script lang="ts">
import type { LatLngTuple, LeafletMouseEvent } from "leaflet";
import Vue from "vue";
import { LCircleMarker, LMap, LTileLayer, LTooltip } from "vue2-leaflet";
import POIForm from "./components/POIForm.vue";

interface POI {
  _id: string;
  name: string;
  position: LatLngTuple;
  state: "new" | "visited";
}
interface Data {
  leaflet: {
    zoom: number;
    center: LatLngTuple;
    url: string;
    attribution: string;
    poiSize: number;
  };
  markers: POI[];
  poiForm: {
    open: boolean;
    position: LatLngTuple;
  };
}

export default Vue.extend({
  name: "App",
  components: {
    LMap,
    LTileLayer,
    LCircleMarker,
    LTooltip,
    POIForm,
  },
  data(): Data {
    return {
      leaflet: {
        zoom: 6,
        center: [46.449, 2.21], // Center map to the France country
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", // Url for tile layer
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', // Attribution of tile
        poiSize: 5,
      },
      markers: [],
      poiForm: {
        open: false,
        position: [0, 0],
      },
    };
  },
  methods: {
    handleMapClick(event: LeafletMouseEvent) {
      // Open POI form
      this.poiForm = {
        open: true,
        position: [event.latlng.lat, event.latlng.lng],
      };
    },
    handleMarkerClick(id: string) {
      this.markers = this.markers.reduce<POI[]>((acc, poi) => {
        if (poi._id === id) {
          switch (poi.state) {
            // Change state if is new marker
            case "new":
              poi.state = "visited";
              break;

            // Delete if is visited
            case "visited":
              return acc;
          }
        }

        acc.push(poi);
        return acc;
      }, []);
    },

    addMarker(data: { position: LatLngTuple; name: string }) {
      // Add new POP
      const newMarker: POI = {
        _id: Math.random().toString(16),
        name: data.name,
        position: data.position,
        state: "new",
      };
      this.markers = [...this.markers, newMarker];

      // Close form
      this.poiForm = {
        open: false,
        position: [0, 0],
      };
    },
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
  --marker-new: yellow;
  --marker-visited: lime;

  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #111827;
  position: relative;
}

.poi-tooltip h2 {
  font-size: 1.2em;
  margin: 0;
}

.modal-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
}
</style>
