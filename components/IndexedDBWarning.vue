<template>
  <ClientOnly>
    <div v-if="!canUseApp" class="indexeddb-warning">
      <div class="warning-container">
        <h2>Security Warning</h2>
        <p v-if="errorMessage">{{ errorMessage }}</p>
        <p v-else>For security reasons, you cannot use this application without proper secure storage support.</p>
        <div class="suggestions">
          <h3>Suggestions:</h3>
          <ul>
            <li>Use a modern browser like Chrome, Firefox, Safari, or Edge</li>
            <li>Disable private/incognito browsing mode</li>
            <li>Check if you have disabled IndexedDB in your browser settings</li>
            <li>Clear your browser cache and cookies</li>
          </ul>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { useAuth } from '~/stores/auth'

const auth = useAuth()
const canUseApp = computed(() => auth.canUseApp)
const errorMessage = computed(() => auth.indexedDBError)
</script>

<style scoped>
.indexeddb-warning {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.warning-container {
  background-color: #5a4646;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

h2 {
  color: #e53935;
  margin-bottom: 1rem;
}

p {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.suggestions {
  text-align: left;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

h3 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

ul {
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
}
</style> 