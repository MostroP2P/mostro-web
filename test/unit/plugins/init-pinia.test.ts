import { setActivePinia, createPinia } from 'pinia';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { createApp } from 'vue';
import { initPinia } from '../../../plugins/init-pinia';
import { useMostroStore } from '../../../stores/mostro';

const mocks = {
  authStore: { nuxtClientInit: vi.fn() },
  ordersStore: { nuxtClientInit: vi.fn() },
  relaysStore: { nuxtClientInit: vi.fn() },
  messagesStore: { nuxtClientInit: vi.fn() },
  mostroStore: { nuxtClientInit: vi.fn() },
};

vi.mock('#app', () => ({
  defineNuxtPlugin: (fn: any) => fn(),
}));

vi.mock('~/stores/auth', () => ({
  useAuth: () => (mocks.authStore),
}));

vi.mock('~/stores/orders', () => ({
  useOrders: () => (mocks.ordersStore),
}));

vi.mock('~/stores/relays', () => ({
  useRelays: () => (mocks.relaysStore),
}));

vi.mock('~/stores/messages', () => ({
  useMessages: () => (mocks.messagesStore),
}));

vi.mock('~/stores/mostro', () => ({
  useMostroStore: () => (mocks.mostroStore),
}));

describe('initPinia', () => {
  let pinia;

  beforeEach(() => {
    const app = createApp({});
    pinia = createPinia();
    app.use(pinia);
    setActivePinia(pinia);
    vi.spyOn(useMostroStore(), 'nuxtClientInit');
  })

  it('inits aith store', () => {
    initPinia();
    expect(mocks.authStore.nuxtClientInit).toHaveBeenCalled();
  });

  it('inits orders store', () => {
    initPinia();
    expect(mocks.ordersStore.nuxtClientInit).toHaveBeenCalled();
  });

  it('inits relays store', () => {
    initPinia();
    expect(mocks.relaysStore.nuxtClientInit).toHaveBeenCalled();
  });

  it('inits messages store', () => {
    initPinia();
    expect(mocks.messagesStore.nuxtClientInit).toHaveBeenCalled()
  });

  it('inits mostro store', () => {
    initPinia();
    expect(mocks.mostroStore.nuxtClientInit).toHaveBeenCalled();
  });
});
