import { ref, computed } from 'vue'

export default function useEllipsis(initialText = '', initialSideCharsCount = 5) {
  const originalText = ref(initialText) // text to be ellipsized
  const sideCharsCount = ref(initialSideCharsCount) // number of chars to keep on each side

  // computed property that returns the ellipsized text
  const ellipsizedText = computed(() => {
    if (originalText.value.length <= 2 * sideCharsCount.value) {
      return originalText.value
    }
    const start = originalText.value.substring(0, sideCharsCount.value)
    const end = originalText.value.substring(originalText.value.length - sideCharsCount.value)
    return `${start}...${end}`
  })

  return {
    originalText,
    sideCharsCount,
    ellipsizedText,
  }
}
