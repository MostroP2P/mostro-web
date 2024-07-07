<template>
  <v-avatar color="primary" size="x-large" style="border: 1.2px solid rgba(38, 82, 49, 0.3);" variant="elevated">
    <v-img :src="profilePic" v-if="profilePic !== undefined"/>
    <v-icon dark large v-else>
      mdi-account-circle
    </v-icon>
  </v-avatar>
  <div class="font-weight-light text-disabled text-subtitle-1" style="min-height: 28px">
    {{ userName ? userName : '' }}
  </div>
</template>

<script setup>

const props = defineProps({
  userName: String,
  profilePic: String
})
</script>