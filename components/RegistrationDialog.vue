<template>
  <v-dialog v-model="showDialog" width="500">
    <v-progress-linear v-if="isProcessing" indeterminate />
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" outlined class="mt-4">
        <KeyIcon class="mr-3" />
        Register
      </v-btn>
    </template>
    <v-card class="p-8">
      <v-card-title class="text-h6">Create Account</v-card-title>
      <v-row class="mx-4 mt-5 mb-3">
        <div class="body-2">
          Your private key is used to sign Mostro events. Make sure you keep it somewhere safe.
        </div>
      </v-row>

      <!-- Generate Button -->
      <v-row class="mx-4 my-3 d-flex justify-center">
        <v-btn
          @click="onGeneratePrivateKey"
          variant="outlined"
          prepend-icon="mdi-autorenew"
          class="rounded hover-white"
          block
        >
          Generate Key
        </v-btn>
      </v-row>

      <!-- Input Field for Private Key -->
      <v-row class="mx-4 my-2" v-if="nsecGenerated">
        <v-text-field
          v-model="privateKey"
          outlined
          class="rounded-input"
          :rules="[
            (v: string) => isNotEmpty(v) || 'Private key cannot be empty',
            (v: string) => (v === '' || isValidNsec(v) || isValidHex(v)) || 'Invalid private key (not NSEC or HEX format)',
          ]"
          label="Your nsec or hex"
          :type="nsecVisible ? 'text' : 'password'"
          :append-icon="nsecVisible ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append="toggleNsecVisibility"
        >
          <template #append>
            <v-icon class="mx-2" @click="copyToClipboard">mdi-content-copy</v-icon>
          </template>
        </v-text-field>
      </v-row>

      <!-- Password Input Fields -->
      <v-row class="mx-4">
        <v-text-field
          v-model="password"
          outlined
          label="Password"
          class="rounded mb-4"
          type="password"
          :disabled="isProcessing"
          :rules="[(v) => !!v || 'You need a password', (v) => validPassword || `Password must be at least ${MIN_PASSWORD_LENGTH} characters`]"
        />
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
            (v) => !!v || 'You must confirm your password',
            (v) => v === password || 'Your confirmation must match the password',
          ]"
        />
      </v-row>

      <!-- Confirm Button -->
      <v-row class="mx-4 mb-5">
        <v-btn
          color="primary"
          :disabled="!validSecret || !validPassword || !validConfirmation || isProcessing"
          @click="onPrivateKeyConfirmed"
          class="rounded"
          block
        >
          Confirm
        </v-btn>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { generateSecretKey } from 'nostr-tools';
import { useAuth } from '~/stores/auth';
import useNip19 from '~/composables/useNip19';
import { useSecretValidator } from '~/composables/useSecretValidator';

const MIN_PASSWORD_LENGTH = 10;
const showDialog = ref(false);
const nsecVisible = ref(false);
const privateKey = ref('');
const password = ref('');
const confirmation = ref('');
const isProcessing = ref(false);
const nsecGenerated = ref(false);
const authStore = useAuth();

const { rules } = useSecretValidator();
const { isValidNsec, isValidHex, isNotEmpty } = rules;
const { nsecToHex, isNsec } = useNip19();

const toggleNsecVisibility = () => (nsecVisible.value = !nsecVisible.value);

const copyToClipboard = () => {
  navigator.clipboard.writeText(privateKey.value);
};

const onGeneratePrivateKey = () => {
  privateKey.value = Buffer.from(generateSecretKey()).toString('hex');
  nsecGenerated.value = true;
};

const onPrivateKeyConfirmed = async () => {
  isProcessing.value = true;

  try {
    // Convert NSEC to HEX if necessary
    let privKey = isNsec(privateKey.value) ? nsecToHex(privateKey.value) : privateKey.value;

    // Call the new auth.ts store to handle secure encryption and login
    await authStore.login(privKey, password.value);
    showDialog.value = false; // Close dialog after successful registration
  } catch (err) {
    console.error('Error during login:', err);
  } finally {
    isProcessing.value = false;
  }
};

const validSecret = computed(() => privateKey.value && isNotEmpty(privateKey.value) && (isValidNsec(privateKey.value) || isValidHex(privateKey.value)));
const validPassword = computed(() => password.value && password.value.length >= MIN_PASSWORD_LENGTH);
const validConfirmation = computed(() => confirmation.value && confirmation.value === password.value);
</script>
