<template>
  <div>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="12" md="12">
        <OrderListWrapper>
          <OrderList/>
        </OrderListWrapper>
      </v-col>
    </v-row>
    <add-order-dialog class="fixed-btn mb-6"/>
  </div>
</template>

<script>
export default {
  name: 'IndexPage'
}
</script>
<style scoped>
.fixed-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
}
</style>