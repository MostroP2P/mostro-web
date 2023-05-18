<template>
  <v-row style="min-height: 80vh">
    <v-col class="d-flex flex-column justify-center align-center">
      <img
        v-if="!$vuetify.theme.isDark"
        src="/no-orders.webp"
        alt="No orders"
        height="250"
      >
      <p class="text-h4 text--disabled font-weight-black">Sorry, no orders! 😔</p>
      <p class="text-h6 text--disabled font-weight-thin">Why not placing one though?</p>
    </v-col>
  </v-row>
</template>