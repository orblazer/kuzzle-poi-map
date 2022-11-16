<template>
  <div class="modal">
    <button class="modal-close" @click.prevent="$emit('close')">&times;</button>

    <h2 class="modal-title">Create new POI</h2>
    <strong>Position of POI :</strong>
    <ul>
      <li><strong>Latitude</strong>: {{ position[0] }}</li>
      <li><strong>Longitude</strong>: {{ position[1] }}</li>
    </ul>

    <div v-if="position[0] <= -60 || position[0] >= 60" class="ea ea-frozen">
      WOOSH ! It's freezing here !
    </div>
    <div
      v-else-if="
        position[0] >= 11 &&
        position[0] <= 30 &&
        position[1] >= -16 &&
        position[1] <= 40
      "
      class="ea ea-hot"
    >
      WOOSH ! It's hot here !
    </div>
    <div v-else-if="position[0] == 0 || position[1] == 0" class="ea ea-zero">
      WOW ! Nice spot !
    </div>

    <form class="modal-form">
      <fieldset :class="nameFieldClass">
        <label for="name">Name</label>
        <input
          ref="input"
          type="text"
          name="name"
          id="name"
          placeholder="Enter the POI name"
          v-model="name"
          required
        />
      </fieldset>

      <button class="modal-submit" type="submit" @click.prevent="submit">
        Create
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import type { LatLngTuple } from "leaflet";
import Vue from "vue";

interface Data {
  name: string;
}
interface Methods {
  submit(): void;
}
interface Computed {
  nameFieldClass: Record<string, boolean>;
}
interface Props {
  position: LatLngTuple;
}

export default Vue.extend<Data, Methods, Computed, Props>({
  name: "POIForm",
  props: {
    position: {
      required: true,
      type: Array as unknown as Vue.PropType<LatLngTuple>,
    },
  },
  data() {
    return {
      name: "",
    };
  },
  computed: {
    nameFieldClass() {
      return {
        "modal-field": true,
        "modal-field--error": this.name.trim().length === 0,
      };
    },
  },
  mounted() {
    (this.$refs.input as HTMLInputElement).focus();
  },
  methods: {
    submit() {
      if (this.name.trim().length > 0) {
        this.$emit("submit", { position: this.position, name: this.name });
      }
    },
  },
});
</script>

<style>
.modal {
  position: relative;
  background-color: var(--modal-background);
  padding: 1rem;
  border-radius: 2px;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  min-width: 25vw;
  min-height: 25vh;
}

.modal-close {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  padding: 0;
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  font-size: 2rem;
}
.modal-close:hover {
  color: var(--primary);
}
.modal-close:active {
  color: var(--primary-hover);
}

.modal-title {
  margin-top: 0;
}

.modal ul {
  margin: 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--field-border);
}

.modal-field {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  border: none;
  padding: 0;
}
.modal-field input {
  color: currentColor;
  background-color: transparent;
  border: 1px solid var(--field-border);
  border-radius: 2px;
  padding: 0.5em 1em;
  min-width: 50%;
}
.modal-field--error input {
  border-color: var(--field-error);
}

.modal-submit {
  justify-self: end;
  align-self: flex-end;
  background-color: var(--primary);
  border-radius: 2px;
  border: none;
  color: var(--text-color-primary-bg);
  padding: 0.5em 1em;
  cursor: pointer;
}
.modal-submit:hover {
  background-color: var(--primary-hover);
}

.ea {
  border: 2px solid;
  border-radius: 2px;
  padding: 0.5rem;
  margin-top: 1rem;
}
.ea-frozen {
  background-color: rgba(8, 145, 178, 0.3);
  border-color: #06b6d4;
  color: #0e7490;
}
.ea-hot {
  background-color: rgba(245, 158, 11, 0.3);
  border-color: #f59e0b;
  color: #b45309;
}
.ea-zero {
  background-color: rgba(244, 63, 94, 0.3);
  border-color: #f43f5e;
  color: #be123c;
}
</style>
