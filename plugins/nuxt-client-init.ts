export default async ({ store }: { store: any }) => {
  await store.dispatch('auth/nuxtClientInit');
}