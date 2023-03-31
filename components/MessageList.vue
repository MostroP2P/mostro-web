<template>
  <v-card class="mx-auto">
    <v-list>
      <message v-for="(message, index) in messages"
        :key="`${message.id}-${index}`"
        :message="message"
      />
    </v-list>
  </v-card>
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
export default Vue.extend({
  computed: {
    ...mapState('messages', ['messages'])
  }
})
</script>