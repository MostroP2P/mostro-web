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
          Your private key is used to sign nostr events, if you generate one, make sure you keep a backup.
        </div>
      </v-row>
      <v-row class="mx-4 my-3 d-flex justify-center">
        <v-btn @click="onGeneratePrivateKey" variant="outlined" prepend-icon="mdi-autorenew">
          Generate
        </v-btn>
      </v-row>
      <v-row class="mx-4">
        <v-text-field
          v-model="privateKey"
          outlined
          :rules="[
            (v: string) => rules.isNotEmpty(v),
            (v: string) => rules.isValidNsec(v) || rules.isValidHex(v) || 'Not a valid NSEC or HEX'
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
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'
import { generateSecretKey } from 'nostr-tools'
import { AuthMethod, useAuth } from '~/stores/auth'
import { useCrypto } from '~/composables/useCrypto'
import { useSecretValidator } from '~/composables/useSecretValidator'
import useNip19 from '~/composables/useNip19'

const MIN_PASSWORD_LENGTH = 10
const showDialog = ref(false)
const tab = ref(null)
const nsecVisible = ref(false)
const privateKey = ref('')
const password = ref('')
const confirmation = ref('')
const isProcessing = ref(false)
const authStore = useAuth()

const { rules } = useSecretValidator()
const { isValidNsec, isValidHex, isNotEmpty } = rules
const { generateSalt, deriveKey } = useCrypto()

const toggleNsecVisibility = () => {
  nsecVisible.value = !nsecVisible.value
}

const onGeneratePrivateKey = async () => {
  const privKey = generateSecretKey()
  privateKey.value = Buffer.from(privKey).toString('hex')
}

const onPrivateKeyConfirmed = async function () {
  isProcessing.value = true
  try {
    let privKey = null
    const { isNsec, nsecToHex } = useNip19()
    if (isNsec(privateKey.value)) {
      privKey = nsecToHex(privateKey.value)
    } else {
      privKey = privateKey.value
    }
    const salt = generateSalt()
    const key = await deriveKey(password.value, salt.toString('base64'), ['encrypt', 'decrypt'])
    let rawKey = await window.crypto.subtle.exportKey('raw', key)
    let rawKeyBytes = Buffer.from(rawKey)
    let base64Key = rawKeyBytes.toString('base64')
    const ciphertext = CryptoJS.AES.encrypt(privKey, base64Key).toString()
    authStore.encryptedPrivateKey = { ciphertext, salt: salt.toString('base64') }
    authStore.login({
      privateKey: privateKey.value,
      authMethod: AuthMethod.LOCAL
    })
  } catch(err) {
    console.error('Error while generating encryption key. Err: ', err)
  } finally {
    isProcessing.value = false
  }
}

const validSecret = computed(() => {
  const v = privateKey.value
  return v && isNotEmpty(v) && (isValidNsec(v) || isValidHex(v))
})

const validPassword = computed(() => {
  return password.value && password.value.length >= MIN_PASSWORD_LENGTH
})

const validConfirmation = computed(() => {
  return confirmation.value && confirmation.value === password.value
})

</script>