<template>
  <div id="app">
    <k-map
      ref="map"
      :zoom="leaflet.zoom"
      :center="leaflet.center"
      @mapClick="handleMapClick"
      @markerClick="handleMarkerClick"
    />
    <fullscreen-loader v-if="loading" />

    <div v-if="poiForm.open" class="modal-wrapper">
      <POIForm
        :position="poiForm.position"
        @close="poiForm.open = false"
        @submit="addMarker"
      />
    </div>
    <NotificationManager ref="notifier" />
  </div>
</template>

<script lang="ts">
import { DocumentNotification, KDocument } from "kuzzle-sdk";
import type { LatLngTuple, LeafletMouseEvent } from "leaflet";
import Vue from "vue";
import FullscreenLoader from "./components/FullscreenLoader.vue";
import KMap from "./components/Map.vue";
import NotificationManager from "./components/NotificationManager.vue";
import POIForm from "./components/POIForm.vue";
import kuzzle from "./services/kuzzle";
import { KMarker, KMarkerDocument } from "./types";

export default Vue.extend({
  name: "App",
  components: {
    KMap,
    FullscreenLoader,
    POIForm,
    NotificationManager,
  },
  data() {
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
      },
      poiForm: {
        open: false,
        position: [0, 0],
      },
    };
  },
  computed: {
    map() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.$refs.map as any; // TODO: use "InstanceType<typeof KMap>"
    },
    notifier() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.$refs.notifier as any; // TODO: use "InstanceType<typeof NotificationManager>"
    },
  },
  async mounted() {
    // Establish the connection
    try {
      await kuzzle.connect();
    } catch (_) {
      this.notifier.notify("error", "Could not connect to Kuzzle !");
      kuzzle.addOnceListener("connected", () => this.loadData());

      return;
    }

    await this.loadData();
  },
  async beforeDestroy() {
    await kuzzle.realtime.unsubscribe(this.kuzzle.roomID);
  },
  methods: {
    /**
     * Handle click on map
     * @param event Leaflet mouse event
     */
    handleMapClick(event: LeafletMouseEvent) {
      // Open POI form
      this.poiForm = {
        open: true,
        position: [event.latlng.lat, event.latlng.lng],
      };
    },
    /**
     * Handle click on marker
     * @param marker Clicked marker
     */
    async handleMarkerClick(marker: KMarker) {
      switch (marker.state) {
        // Update marker state to 'visited'
        case "new":
          await kuzzle.document
            .update<KMarkerDocument>(
              this.kuzzle.index,
              this.kuzzle.collection,
              marker._id,
              {
                state: "visited",
              }
            )
            .then(() =>
              this.notifier.notify("success", `POI '${marker.name}' visited !`)
            )
            .catch(() =>
              this.notifier.notify(
                "error",
                `Could not visit POI '${marker.name}' !`
              )
            );
          break;

        // Remove 'visited' marker
        case "visited":
          await kuzzle.document
            .delete(this.kuzzle.index, this.kuzzle.collection, marker._id)
            .then(() =>
              this.notifier.notify("success", `POI '${marker.name}' deleted !`)
            )
            .catch(() =>
              this.notifier.notify(
                "error",
                `Could not delete POI '${marker.name}' !`
              )
            );
          break;
      }
    },

    /**
     * Add new marker to the map
     */
    async addMarker(data: { position: LatLngTuple; name: string }) {
      // Call the create method of the document controller
      try {
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
      } catch (_) {
        this.notifier.notify("error", `Could not create POI '${data.name}' !`);
        return;
      }

      // Close form
      this.poiForm = {
        open: false,
        position: [0, 0],
      };

      this.notifier.notify("success", `POI '${data.name}' created !`);
    },

    /**
     * Load data from kuzzle
     */
    async loadData() {
      // Bind kuzzle connections status
      kuzzle.addListener("disconnected", () =>
        this.notifier.notify("error", "Connection lost to Kuzzle !")
      );
      kuzzle.addListener("connected", () =>
        this.notifier.notify("success", "Connected to Kuzzle !")
      );

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

      await this.fetchMarkers().catch(() =>
        this.notifier.notify("error", "Could not fetch POIs !")
      );
      await this.subscribeMarkers().catch(() =>
        this.notifier.notify("error", "Could not subscribe to POIs !")
      );

      this.loading = false;
    },

    /**
     * Convert kuzzle document to marker object
     * @param document The Kuzzle document
     */
    getMarker(document: KDocument<KMarkerDocument>): KMarker {
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
      for (const hit of results.hits) {
        this.map.addMarker(this.getMarker(hit));
      }
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
            .result as KDocument<KMarkerDocument>;

          switch ((notification as DocumentNotification).action) {
            // Add the new marker to our array
            case "create":
              this.map.addMarker(this.getMarker(document));
              break;

            // Update marker in our array
            case "update":
              this.map.updateMarker(document._id, this.getMarker(document));
              break;

            // Remove marker from or array
            case "delete":
              this.map.removeMarker(document._id);
              break;
          }
        }
      );
    },
  },
});
</script>

<style src="./assets/app.css"></style>
