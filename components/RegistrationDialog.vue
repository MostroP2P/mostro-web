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
      <v-card-title class="text-h6">Create Account</v-card-title>
      <v-row class="mx-4 mt-5 mb-3">
        <div class="body-2">
          Your private key is used to sign Mostro events. If you generate one, make sure you keep a backup.
        </div>
      </v-row>
      <!-- Show Generate Button if NSEC is Not Generated -->
      <v-row class="mx-4 my-3 d-flex justify-center" v-if="!nsecGenerated">
        <v-btn
          @click="onGeneratePrivateKey"
          variant="outlined"
          prepend-icon="mdi-autorenew"
          class="rounded full-width hover-white"
        >
          Generate Key
        </v-btn>
      </v-row>

      <!-- Show Input Field if NSEC is Generated -->
      <v-row class="mx-4 my-2" v-if="nsecGenerated">
        <v-text-field
          v-model="privateKey"
          outlined
          class="rounded-input mb-4"
          :rules="[
            (v: string) => isNotEmpty(v) || 'Private key cannot be empty',
            (v: string) => (v === '' || isValidNsec(v) || isValidHex(v)) || 'Invalid private key (not NSEC or HEX format)'
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
          class="rounded-input mb-4"
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
          class="rounded-input mb-4"
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
          class="rounded full-width"
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
  import './assets/global.css';

  const MIN_PASSWORD_LENGTH = 10
  const showDialog = ref(false)
  const tab = ref(null)
  const nsecVisible = ref(false)
  const privateKey = ref('')
  const password = ref('')
  const confirmation = ref('')
  const isProcessing = ref(false)
  const nsecGenerated = ref(false) // New state to track if NSEC has been generated
  const privateKeyError = ref<string | null>(null)
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
    nsecGenerated.value = true // Set NSEC as generated
  }

  const onPrivateKeyConfirmed = async function () {
    if (!validSecret.value) {
      privateKeyError.value = 'Invalid private key. Please enter a valid NSEC or HEX key.'
      return
    }

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
      privateKeyError.value = 'An error occurred while processing your private key.'
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

