<template>
  <div>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="12" md="12">
        <v-alert
          v-for="alert in alertStore.activeAlerts"
          :key="alert.id"
          :type="alert.type"
          closable
          class="mb-1"
          @click:close="dismissAlert(alert.id)"
        >
          {{ alert.message }}
        </v-alert>
      </v-col>
      <v-col cols="12" sm="12" md="12">
        <OrderListWrapper>
          <OrderList/>
        </OrderListWrapper>
      </v-col>
    </v-row>
    <add-order-dialog class="mb-6"/>
  </div>
</template>
<script setup lang="ts">
const alertStore = useAlertStore()

const dismissAlert = (id: number) => {
  alertStore.dismissAlert(id)
}
</script>