<template>
  <v-dialog v-model="showDialog" width="500">
    <v-progress-linear v-if="isProcessing" indeterminate/>
    <template v-slot:activator="{ on, attrs}">
      <v-btn v-on="on" v-bind="attrs" outlined class="mt-4">
        <KeyIcon class="mr-3"/>
        Login
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Login method</v-card-title>
      <v-tabs v-model="tab">
        <v-tab>Nsec</v-tab>
        <v-tab>Alby</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tab">
        <v-tab-item style="min-height: 5em">
          <v-row class="mx-4 mt-5">
            <v-text-field
              v-model="nsec"
              outlined
              :rules="[
                (v) => rules.isNotEmpty(v),
                (v) => rules.isValidNsec(v) || rules.isValidHex(v) || 'Not a valid NSEC or HEX'
              ]"
              label="Enter your nsec or hex"
              :disabled="isProcessing"
              :type="nsecVisible ? 'text' : 'password'"
              :append-icon="nsecVisible ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="toggleNsecVisibility"
            >
            </v-text-field>
          </v-row>
          <v-row class="mx-4">
            <v-text-field
              v-model="password"
              outlined
              label="Password"
              type="password"
              :disabled="isProcessing"
              :rules="[
                v => !!v || 'You need a password',
                v => validPassword || `Your password cannot be shorter than ${MIN_PASSWORD_LENGTH}`
              ]"
            >
            </v-text-field>
          </v-row>
          <v-row class="mx-4">
            <v-text-field
              v-model="confirmation"
              outlined
              label="Password confirmation"
              type="password"
              :disabled="isProcessing"
              :rules="[
                v => !!v || 'You must confirm your password',
                v => v === password || 'Your confirmation must match the password'
              ]"
            >
            </v-text-field>
          </v-row>
          <v-row class="mx-4 mb-5">
            <v-btn
              color="primary"
              :disabled="!validSecret || !validPassword || !validConfirmation || isProcessing"
              @click="onPrivateKeyConfirmed"
            >
              Confirm
            </v-btn>
          </v-row>
        </v-tab-item>
        <v-tab-item style="min-height: 5em">
          <v-row class="mx-4 my-5 d-flex justify-center">
            <v-btn
              color="primary"
              :disabled="!hasAlby"
            >
              Request
            </v-btn>
          </v-row>
        </v-tab-item>
      </v-tabs-items>

    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import secretValidator from '~/mixins/secret-validator'

// Minimum password length
const MIN_PASSWORD_LENGTH = 10

export default Vue.extend({
  data() {
    return {
      MIN_PASSWORD_LENGTH,
      showDialog: false,
      tab: null,
      nsec: '',
      nsecVisible: false,
      password: '',
      confirmation: '',
      worker: null,
      isProcessing: false
    }
  },
  mixins: [secretValidator],
  methods: {
    toggleNsecVisibility() {
      this.nsecVisible = !this.nsecVisible
    },
    onPrivateKeyConfirmed() {
      this.isProcessing = true
      // @ts-ignore
      // Instruction assigned in web-worker plugin
      const worker = this.$worker.createWorker()
      worker.postMessage({ password: this.password })
      worker.addEventListener('message', (event: any) => {
        this.isProcessing = false
        const { hash } = event.data
        // TODO: use hash to encrypt nsec
      })
    }
  },
  computed: {
    hasAlby() {
      // @ts-ignore
      return window && window.nostr
    },
    validSecret() {
      const v = this.nsec
      // @ts-ignore
      return this.rules.isNotEmpty(v) && this.rules.isValidNsec(v) || this.rules.isValidHex(v)
    },
    validPassword() {
      return this.password && this.password.length >= this.MIN_PASSWORD_LENGTH
    },
    validConfirmation() {
      return this.confirmation && this.confirmation === this.password
    }
  }
})
</script>