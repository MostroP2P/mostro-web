<template>
  <v-dialog v-model="showDialog" width="500">
    <v-progress-linear v-if="isProcessing" indeterminate/>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" outlined class="mt-4">
        <KeyIcon class="mr-3"/>
        Register
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Create Account</v-card-title>
      <v-row class="mx-4 mt-5 mb-3">
        <div class="body-2">
          Your mnemonic phrase is used to generate your private keys. Write it down and keep it safe!
        </div>
      </v-row>
      <v-row class="mx-4 my-3 d-flex justify-center">
        <v-btn @click="onGenerateMnemonic" variant="outlined" prepend-icon="mdi-autorenew">
          Generate Mnemonic
        </v-btn>
      </v-row>
      <v-row class="mx-4">
        <v-textarea
          v-model="mnemonic"
          outlined
          rows="3"
          :rules="[
            (v: string) => rules.isNotEmpty(v),
            (v: string) => rules.isValidMnemonic(v) || 'Invalid mnemonic phrase'
          ]"
          :label="mnemonic === '' ? 'Enter or generate a mnemonic phrase' : ''"
          :disabled="isProcessing"
        ></v-textarea>
      </v-row>
      <v-row class="mx-4">
        <v-text-field
          v-model="password"
          outlined
          label="Password"
          type="password"
          :disabled="isProcessing || !validMnemonic"
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
          :disabled="isProcessing || !validMnemonic"
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
          :disabled="!validMnemonic || !validPassword || !validConfirmation || isProcessing"
          @click="onMnemonicConfirmed"
        >
          Confirm
        </v-btn>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'
import { generateMnemonic, validateMnemonic } from 'bip39'
import { useAuth } from '~/stores/auth'
import { useCrypto } from '~/composables/useCrypto'
import { useSecretValidator } from '~/composables/useSecretValidator'

const MIN_PASSWORD_LENGTH = 10
const showDialog = ref(false)
const mnemonic = ref('')
const password = ref('')
const confirmation = ref('')
const isProcessing = ref(false)
const authStore = useAuth()

const { rules } = useSecretValidator()
const { generateSalt, deriveKey } = useCrypto()

const onGenerateMnemonic = async () => {
  mnemonic.value = generateMnemonic()
}

const onMnemonicConfirmed = async function () {
  isProcessing.value = true
  try {
    if (!validateMnemonic(mnemonic.value)) {
      throw new Error('Invalid mnemonic')
    }

    const salt = generateSalt()
    const key = await deriveKey(password.value, salt.toString('base64'), ['encrypt', 'decrypt'])
    let rawKey = await window.crypto.subtle.exportKey('raw', key)
    let rawKeyBytes = Buffer.from(rawKey)
    let base64Key = rawKeyBytes.toString('base64')

    const ciphertext = CryptoJS.AES.encrypt(mnemonic.value, base64Key).toString()
    authStore.setEncryptedMnemonic({ ciphertext, salt: salt.toString('base64') })
    authStore.login(mnemonic.value)
  } catch(err) {
    console.error('Error while processing mnemonic. Err: ', err)
  } finally {
    isProcessing.value = false
  }
}

const validMnemonic = computed(() => {
  return mnemonic.value && validateMnemonic(mnemonic.value)
})

const validPassword = computed(() => {
  return password.value && password.value.length >= MIN_PASSWORD_LENGTH
})

const validConfirmation = computed(() => {
  return confirmation.value && confirmation.value === password.value
})
</script>