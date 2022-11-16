<template>
  <div class="notification-wrapper">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="notification"
      :class="`notification--${notification.type}`"
      @click="dismiss(notification.id)"
    >
      {{ notification.message }}
    </div>
  </div>
</template>

<script lang="ts">
import { KNotification } from "@/types";
import Vue from "vue";

const timeout = 10000;

export default Vue.extend({
  name: "NotificationManager",
  data() {
    return {
      notifications: [] as KNotification[],
    };
  },
  methods: {
    notify(type: KNotification["type"], message: string) {
      const id = this.notifications.length + 1;
      this.notifications.push({
        id,
        type,
        message,
        timeout: setTimeout(() => this.dismiss(id), timeout),
      });
    },

    dismiss(id: number) {
      this.notifications = this.notifications.filter(
        (notification) => notification.id !== id
      );
    },
  },
});
</script>

<style>
.notification-wrapper {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 1000;
}

.notification {
  width: fit-content;
  padding: 1rem;
  border-radius: 2px;
  cursor: pointer;
  opacity: 0;
  animation: fadeIn 0.3s forwards;
}
.notification--error {
  background-color: var(--notification-error-background);
  color: var(--notification-error-text);
}
.notification--success {
  background-color: var(--notification-success-background);
  color: var(--notification-success-text);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
