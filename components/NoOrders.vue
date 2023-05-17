<template>
  <v-row>
    <v-col class="text-center">
      <img
        v-if="!$vuetify.theme.isDark"
        src="/no-orders.webp"
        alt="No orders"
        height="250"
      >
      <p class="text-h6 text--disabled font-weight-black">Sorry, no orders!</p>
    </v-col>
  </v-row>
</template>