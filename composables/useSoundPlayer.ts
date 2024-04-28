export const useSoundPlayer = () => {
  const playSound = (soundPath: string) => {
    const sound = new Audio(soundPath)
    sound.play().catch(error => console.error('Failed to play the sound:', error))
  }

  return { playSound }
}