import { Store } from 'vuex'
import { RootState, USER_ORDERS_KEY } from '~/store/types'

export default ({ store } : { store: Store<RootState>}) => {
  if (localStorage) {
    // Reading user orders from the local storage
    const storedUserOrders = localStorage.getItem(USER_ORDERS_KEY) || '{}'
    const userOrders = JSON.parse(storedUserOrders)
    store.dispatch('orders/setUserOrders', userOrders)
  }

  store.subscribe((mutation) => {
    if (mutation.type.startsWith('orders/')) {
      if (mutation.type === 'orders/addUserOrder') {
        storeUserOrder(mutation.payload)
      }
    }
  })
}

const storeUserOrder = ({ id } : {id :string}) => {
  const userOrderStr = localStorage.getItem(USER_ORDERS_KEY) || '{}'
  const userOrders = JSON.parse(userOrderStr)
  userOrders[id] = true
  localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(userOrders))
}