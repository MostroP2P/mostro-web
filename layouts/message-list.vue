<template>
  <v-app>
    <v-app-bar
      fixed
      app
      color="secondary-darken-1"
    >
      <v-btn @click="onBackClicked" icon="mdi-arrow-left" color="white">
      </v-btn>
      <v-toolbar-title>Message History</v-toolbar-title>
      <v-spacer />
    </v-app-bar>
    <v-main class="h-100">
      <v-container class="h-100">
        <slot />
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
