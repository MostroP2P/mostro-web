import { defineStore } from 'pinia'

interface Alert {
  id: number
  type: 'success' | 'info' | 'warning' | 'error'
  message: string
}

export const useAlertStore = defineStore({
  id: 'mostro-alerts',
  state: () => ({
    alerts: [] as Alert[],
    nextId: 1,
  }),
  actions: {
    addAlert(type: Alert['type'], message: string) {
      const alert: Alert = {
        id: this.nextId++,
        type,
        message,
      }
      this.alerts.push(alert)
    },
    dismissAlert(id: number) {
      const index = this.alerts.findIndex(alert => alert.id === id)
      if (index !== -1) {
        this.alerts.splice(index, 1)
      }
    },
    clearAllAlerts() {
      this.alerts = []
    },
  },
  getters: {
    activeAlerts: (state) => state.alerts,
  },
})
