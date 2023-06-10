<template>
  <v-list-item class="d-flex justify-center align-center flex-column mt-0 pt-2">
    <v-avatar color="primary">
      <v-icon dark large>
        mdi-account-circle
      </v-icon>
    </v-avatar>
    <client-only>
      <login-dialog/>
    </client-only>
  </v-list-item>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import LoginDialog from './LoginDialog.vue';

interface Data {}

interface Computed {
  nsec: string | null;
  hasKey: boolean;
}

interface Methods {
  onLogin: Function
}

export default Vue.extend<Data, Methods, Computed>({
  components: { LoginDialog },
  methods: {
    onLogin() {
      
    }
  },
  computed: {
    ...mapState('auth', ['nsec']),
    hasKey(): boolean {
      return this.nsec !== null
    }
  }
})
</script>