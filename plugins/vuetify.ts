// plugins/vuetify.js
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createVuetify, ThemeDefinition } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

const MostroDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#1D1E1E',
    primary: '#00695c',
    'primary-darken-1': '#004940',
    secondary: '#00e676',
    'secondary-darken-1': '#00796B',
    error: '#f44336',
    info: '#29b6f6',
    success: '#66bb6a',
    warning: '#ffa726',
  },
}

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    blueprint: md3,
    theme: {
      defaultTheme: 'MostroDarkTheme',
      themes: {
        MostroDarkTheme,
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})