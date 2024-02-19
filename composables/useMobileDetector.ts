import { ref, onMounted, onUnmounted } from 'vue'

export default function useMobileDetector() {
  const isMobile = ref(false)

  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 600
  }

  onMounted(() => {
    checkMobile() // Check immediately on mount
    window.addEventListener('resize', checkMobile)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })

  return { isMobile }
}