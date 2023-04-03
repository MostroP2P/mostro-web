<template>
  <message-list :order-id="$route.params.id"/>
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  layout: 'message-list',
})
</script>