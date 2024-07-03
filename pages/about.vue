<template>
  <v-row>
    <v-col class="text-center mt-6">
      <img
        src="/mostro-logo.png"
        alt="Vuetify.js"
        class="mb-5"
        height="150"
      >
      <blockquote class="blockquote text-medium-emphasis">
        &#8220;It might make sense just to get some in case it catches on.&#8221;
        <footer>
          <small>
            <em>&mdash;Satoshi Nakamoto</em>
          </small>
        </footer>
      </blockquote>
    </v-col>
  </v-row>
  <v-row class="mt-12">
    <v-col>
      <p class="text-center text-body-1" style="max-width: 40em; margin: auto;">
        Mostro Web is an open source web client that facilitates peer-to-peer bitcoin trading over the lightning network ⚡ using nostr.
      </p>
      <br>
      <p class="text-center text-body-1">Contributions are always welcome!</p>
      <div class="text-center mt-4">
        <v-btn
          href="https://github.com/MostroP2P/mostro-web"
          target="_blank"
          rel="noopener"
          icon
          color="white"
        >
          <v-icon size="x-large">mdi-github</v-icon>
        </v-btn>  
      </div>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'InspirePage'
}
</script>

<style scoped>
.v-footer {
  background-color: transparent !important;
}
</style>
