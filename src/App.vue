<template>
  <div id="app">
    <l-map
      v-if="loading"
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
        @click="handleMarkerClick(marker)"
      >
        <l-tooltip class="poi-tooltip">
          <h2>POI: {{ marker.name }}</h2>
          <strong>State</strong>: {{ marker.state }}
        </l-tooltip>
      </l-circle-marker>
    </l-map>
    <div v-else class="loader"></div>

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
import {
  DocumentNotification,
  KDocument,
  KDocumentContentGeneric,
} from "kuzzle-sdk";
import type { LatLngTuple, LeafletMouseEvent } from "leaflet";
import Vue from "vue";
import { LCircleMarker, LMap, LTileLayer, LTooltip } from "vue2-leaflet";
import POIForm from "./components/POIForm.vue";
import kuzzle from "./services/kuzzle";

interface POI {
  _id: string;
  name: string;
  position: LatLngTuple;
  state: "new" | "visited";
}
interface Data {
  loading: boolean;
  kuzzle: {
    roomID: string;
    index: string;
    collection: string;
  };
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

type KMarker = KDocumentContentGeneric & POI;

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
      loading: true, // Data from Kuzzle is loaded or not
      kuzzle: {
        roomID: "", // Id of the realtime subscription
        index: "poi", // Name of POI index
        collection: "markers", // Name of collection hold POI markers
      },
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
  async mounted() {
    // Etablish the connection
    await kuzzle.connect();
    // Check if index exists
    if (!(await kuzzle.index.exists(this.kuzzle.index))) {
      // If not, create index and collection
      await kuzzle.index.create(this.kuzzle.index);
      await kuzzle.collection.create(
        this.kuzzle.index,
        this.kuzzle.collection,
        {}
      );
    }
    await this.fetchMarkers();
    await this.subscribeMarkers();

    this.loading = true;
  },
  async beforeDestroy() {
    await kuzzle.realtime.unsubscribe(this.kuzzle.roomID);
  },
  methods: {
    handleMapClick(event: LeafletMouseEvent) {
      // Open POI form
      this.poiForm = {
        open: true,
        position: [event.latlng.lat, event.latlng.lng],
      };
    },
    handleMarkerClick(marker: POI) {
      switch (marker.state) {
        // Update marker state to 'visited'
        case "new":
          kuzzle.document.update<KMarker>(
            this.kuzzle.index,
            this.kuzzle.collection,
            marker._id,
            {
              state: "visited",
            }
          );
          break;

        // Remove 'visited' marker
        case "visited":
          kuzzle.document.delete(
            this.kuzzle.index,
            this.kuzzle.collection,
            marker._id
          );
          break;
      }
    },

    async addMarker(data: { position: LatLngTuple; name: string }) {
      // Call the create method of the document controller
      await kuzzle.document.create<KMarker>(
        this.kuzzle.index,
        this.kuzzle.collection,
        // Pass the document to be stored in Kuzzle as a parameter
        {
          name: data.name,
          position: data.position,
          state: "new",
        }
      );

      // Close form
      this.poiForm = {
        open: false,
        position: [0, 0],
      };
    },

    /**
     * Convert kuzzle document to POI object
     * @param document The Kuzzle document
     */
    getMarker(document: KDocument<KMarker>): POI {
      return {
        _id: document._id,
        name: document._source.name,
        position: document._source.position,
        state: document._source.state,
      };
    },
    async fetchMarkers() {
      // Call the search method of the document controller
      const results = await kuzzle.document.search<KMarker>(
        this.kuzzle.index,
        this.kuzzle.collection,
        { sort: ["_kuzzle_info.createdAt"] }, // Query => Sort the messages by creation date
        { size: 100 } // Options => get a maximum of 100 messages
      );

      // Add each message to our array
      results.hits.map((hit) => {
        this.markers = [this.getMarker(hit), ...this.markers];
      });
    },
    async subscribeMarkers() {
      // Call the subscribe method of the realtime controller and receive the roomId
      // Save the id of our subscription (we could need it to unsubscribe)
      this.kuzzle.roomID = await kuzzle.realtime.subscribe(
        this.kuzzle.index,
        this.kuzzle.collection,
        {}, // Filter
        // Callback to receive notifications
        (notification) => {
          // Check if the notification interest us
          if (notification.type !== "document") return;
          const document = (notification as DocumentNotification)
            .result as KDocument<KMarker>;

          switch ((notification as DocumentNotification).action) {
            // Add the new marker to our array
            case "create":
              this.markers = [this.getMarker(document), ...this.markers];
              break;

            // Update marker in our array
            case "update":
              this.markers = this.markers.map((marker) => {
                if (marker._id === document._id) {
                  return this.getMarker(document);
                }
                return marker;
              });
              break;

            // Remove marker from or array
            case "delete":
              this.markers = this.markers.filter(
                (marker) => marker._id !== document._id
              );
              break;
          }
        }
      );
    },
  },
});
</script>

<style src="./assets/app.css"></style>
