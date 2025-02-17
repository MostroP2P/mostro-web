import { useAuth } from '~/stores/auth';
import { useOrders } from '~/stores/orders';
import { useRelays } from '~/stores/relays';
import { useMessages } from '~/stores/messages';
import { useMostroStore } from '~/stores/mostro';
import { defineNuxtPlugin } from '#app';

export function initPinia() {
  const authStore = useAuth();
  authStore.nuxtClientInit();

  const ordersStore = useOrders();
  ordersStore.nuxtClientInit();

  const relaysStore = useRelays();
  relaysStore.nuxtClientInit();

  const messagesStore = useMessages();
  messagesStore.nuxtClientInit();

  const mostroStore = useMostroStore();
  mostroStore.nuxtClientInit();
}

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    nuxtApp.hook('app:mounted', () => {
      initPinia();
    });
  }
});
