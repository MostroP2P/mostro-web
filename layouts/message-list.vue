<template>
  <v-app dark>
    <v-app-bar
      fixed
      app
    >
      <v-btn icon @click="onBackClicked">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title>Message History</v-toolbar-title>
      <v-spacer />
    </v-app-bar>
    <v-main>
      <v-container>
        <Nuxt />
      </v-container>
    </v-main>
    <v-footer
      app
    >
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'messageList',
  methods: {
    onBackClicked() {
      this.$router.back()
    }
  }
}
</script>
