import { type Dispute, type DisputeStore } from './types'

export const useDisputes = defineStore('disputes', {
  state: (): DisputeStore => ({
    byId: {},
    byOrderId: {}
  }),
  actions: {
    addDispute(dispute: Dispute) {
      this.byId[dispute.id] = dispute
      this.byOrderId[dispute.orderId] = dispute
    },
    removeDispute(disputeId: string) {
      const dispute = this.byId[disputeId]
      if (dispute) {
        delete this.byId[disputeId]
        delete this.byOrderId[dispute.orderId]
      }
    },

    getDisputeById(disputeId: string): Dispute | undefined {
      return this.byId[disputeId]
    },

    getDisputeByOrderId(orderId: string): Dispute | undefined {
      return this.byOrderId[orderId]
    },

    updateDisputeStatus(orderId: string, newStatus: DisputeStatus) {
      console.log('updateDisputeStatus, orderId: ', orderId, ', newStatus: ', newStatus)
      const dispute = this.byOrderId[orderId]
      if (dispute) {
        dispute.status = newStatus
      } else {
        console.warn('Could not find dispute to update. Order id: ', orderId)
      }
    }
  }
})