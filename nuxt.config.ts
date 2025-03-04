// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  devServer: {
    host: '0.0.0.0',
    port: process.env.DEV_SERVER_PORT ? Number(process.env.DEV_SERVER_PORT) : 3001,
  },
  vite: {
    plugins: [
      require('vite-plugin-wasm')(),
      require('vite-plugin-top-level-await')()
    ]
  },

  runtimeConfig: {
    public: {
      relays: process.env.RELAYS,
      mostroPubKey: process.env.MOSTRO_PUB_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  },

  app: {
    head: {
      titleTemplate: '%s',
      title: 'Mostro',
      htmlAttrs: {
        lang: 'en'
      },
      script: [
        { src: 'https://kit.fontawesome.com/090ca49637.js', crossorigin: 'anonymous' },
        { src: 'https://kit.fontawesome.com/090ca49637.js', crossorigin: 'anonymous' },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: '' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ]
    }
  },

  css: [
    '~/assets/global.css',
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
  ],

  build: {
    transpile: ['vuetify'],
  },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n'
  ],

  i18n: {
    vueI18n: './i18n.config.ts'
  },

  pinia: {
  },

  compatibilityDate: '2024-08-03',
})