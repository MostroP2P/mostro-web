<template>
  <v-dialog v-model="showDialog" width="500">
    <v-progress-linear v-if="isProcessing" indeterminate/>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" outlined class="mt-4">
        <KeyIcon class="mr-3"/>
        Login
      </v-btn>
    </template>
    <v-card>
      <v-card-title>{{ isDeleteConfirmation ? 'Confirm Delete' : 'Login' }}</v-card-title>
      <v-card-text v-if="!isDeleteConfirmation">
        Enter your password to login.
      </v-card-text>
      <v-card-text v-else>
        Are you sure you want to delete your login information?
      </v-card-text>
      <v-row v-if="!isDeleteConfirmation" class="mx-4 my-5">
        <v-text-field
          v-model="password"
          outlined
          label="Password"
          type="password"
          :disabled="isProcessing"
          @input="errorMessage = ''"
          :rules="[
            v => !!v || 'You need a password',
            v => validPassword || `Your password cannot be shorter than ${MIN_PASSWORD_LENGTH}`
          ]"
          :error-messages="errorMessage"
        >
        </v-text-field>
      </v-row>
      <v-row class="mx-4 mb-5">
        <v-btn
          v-if="!isDeleteConfirmation"
          color="error"
          prepend-icon="mdi-delete"
          :disabled="isProcessing"
          @click="isDeleteConfirmation = true"
        >
          Delete
        </v-btn>
        <v-btn
          v-else
          color="error"
          prepend-icon="mdi-delete"
          :disabled="isProcessing"
          @click="onDelete"
        >
          Confirm
        </v-btn>
        <v-spacer/>
        <v-btn
          v-if="!isDeleteConfirmation"
          color="primary"
          :disabled="!validPassword || isProcessing"
          @click="onPassword"
        >
          Enter
        </v-btn>
        <v-btn
          v-else
          color="primary"
          @click="isDeleteConfirmation = false"
        >
          Cancel
        </v-btn>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import CryptoJS from 'crypto-js'
import { useAuth } from '@/stores/auth'
import { useCrypto } from '~/composables/useCrypto'

// Minimum password length
const MIN_PASSWORD_LENGTH = 10

const authStore = useAuth()
const showDialog = ref<boolean>(false)
const tab = ref<number | null>(null)
const password = ref<string>('')
const isProcessing = ref<boolean>(false)
const errorMessage = ref<string>()
const isDeleteConfirmation = ref<boolean>(false)

const onPassword = async () => {
  isProcessing.value = true
  if (!authStore.encryptedMnemonic) {
    console.warn('No encrypted mnemonic found in local storage')
    return
  }
  try {
    let encryptedMnemonic = authStore.encryptedMnemonic
    const salt = Buffer.from(encryptedMnemonic.salt, 'base64')
    const ciphertext = encryptedMnemonic.ciphertext
    const { deriveKey } = useCrypto()
    const key = await deriveKey(password.value, salt.toString('base64'), ['encrypt', 'decrypt'])
    let rawKey = await window.crypto.subtle.exportKey('raw', key)
    let rawKeyBytes = Buffer.from(rawKey)
    let base64Key = rawKeyBytes.toString('base64')
    const plaintext = CryptoJS.AES.decrypt(ciphertext, base64Key).toString()
    const mnemonic = Buffer.from(plaintext, 'hex').toString('utf8')
    if (!mnemonic) {
      throw Error('Invalid password')
    }
    authStore.login(mnemonic)
    showDialog.value = false
  } catch(err) {
    console.warn('Login error: ', err)
    errorMessage.value = 'Invalid password'
  } finally {
    isProcessing.value = false
  }
}

const onDelete = () => {
  authStore.delete()
  showDialog.value = false
}

const validPassword = computed(() => {
  return password.value !== '' && password.value.length >= MIN_PASSWORD_LENGTH
})
</script>