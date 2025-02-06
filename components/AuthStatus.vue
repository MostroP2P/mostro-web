<template>
  <div class="d-flex justify-center align-center flex-column mt-0 pt-2 mb-3">
    <ProfileDetailsDialog :userName="userName" :profilePic="profilePic"/>
    <client-only>
      <div v-if="!isLoggedIn">
        <registration-dialog v-if="!hasEncryptedMnemonic"/>
        <login-dialog v-if="hasEncryptedMnemonic"/>
      </div>
      <div v-else class="mt-5 d-flex flex-column align-center justify-center">
        <v-btn outlined @click="onLogout" prepend-icon="mdi-logout-variant">Logout</v-btn>
      </div>
    </client-only>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useAuth } from '@/stores/auth'
import { generateAvatar, BackgroundSets, CharacterSets } from 'robohash-avatars'
import { getFingerprint } from '~/utils/key-derivation'

const profilePic = ref<string | undefined>(undefined)
const userName = ref<string | undefined>(undefined)

const authStore = useAuth()
watch(() => authStore.mnemonic, async (newMnemonic: string | null) => {
  if (newMnemonic) {
    const fingerprint = await getFingerprint(newMnemonic)
    profilePic.value = generateAvatar({
      username: fingerprint.toString(),
      background: BackgroundSets.RandomBackground1,
      characters: CharacterSets.Robots,
      width: 400,
      height: 400
    })
    userName.value = undefined
  } else {
    profilePic.value = undefined
    userName.value = undefined
  }
})

const onLogout = () => {
  authStore.logout()
}

const hasEncryptedMnemonic = computed<boolean>(() => {
  return authStore.encryptedMnemonic !== null
})

const isLoggedIn = computed<boolean>(() => {
  return authStore.isAuthenticated
})
</script>

