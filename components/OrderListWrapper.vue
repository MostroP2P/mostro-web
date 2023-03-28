<template>
  <div class="order-list-wrapper">
    <slot/>
  </div>
</template>

<style scoped>
.order-list-wrapper {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}
</style>
