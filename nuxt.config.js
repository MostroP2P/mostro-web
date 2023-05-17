import colors from 'vuetify/es5/util/colors'

export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: '%s - mostro-web-ui',
    title: 'mostro-web-ui',
    htmlAttrs: {
      lang: 'en'
    },
    script: [
      { src: 'https://unpkg.com/nostr-tools/lib/nostr.bundle.js' },
      { src: 'https://kit.fontawesome.com/090ca49637.js', crossorigin: 'anonymous' }
    ],
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '~/assets/global.css'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~/plugins/mostro.ts', mode: 'client'}
  ],

  env: {
    RELAYS: process.env.RELAYS,
    MOSTRO_PUB_KEY: process.env.MOSTRO_PUB_KEY,
    SECRET_KEY: process.env.SECRET_KEY // Temporal thing, this should later be recovered from user settings
  },

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: '/',
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.teal.darken4,
          accent: '#33EB91',
          secondary: colors.teal.darken3,
          info: colors.teal.accent1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
        },
        light: {
          primary: '#4CAF50',
          accent: colors.green.accent4,
          secondary: '#9CCC65',
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: '#B00020',
          success: colors.green.accent3
        }
      }
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    transpile: [
      'nostr-tools',
      '@noble/curves'
    ]
  }
}
