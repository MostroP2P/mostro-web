<template>
  <div class="d-flex justify-center flex-column">
    <div class="d-flex justify-center">
      <div class="text-subtitle-1 text-disabled mr-2">
        Relay Health
      </div>
      <v-icon class="text-disabled d-flex justify-center">
        mdi-signal
      </v-icon>
    </div>
    <div class="d-flex justify-center relay-status">
      <v-tooltip
        v-for="relay in relaysStore.relays"
        location="top"
        :text="relay.url"
        open-on-click
      >
        <template v-slot:activator="{ props }">
          <div
            v-bind="props"
            :key="relay.url"
            class="relay-dot"
            :style="{ backgroundColor: relay.status }">
          </div>
        </template>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
const relaysStore = useRelays()
</script>

<style scoped>
.relay-status {
  margin: 10px;
  border-radius: 5px;
  background: #bbf3be;
}
.relay-dot {
  width: 10px;
  height: 10px;
  border: 0.5px solid #000;
  border-radius: 50%;
  margin: 5px;
}
</style>
