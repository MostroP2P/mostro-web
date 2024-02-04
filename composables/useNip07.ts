

export function useNip07() {
  const getPublicKey = async () => {
    return window.nostr?.getPublicKey()
  }
  return { getPublicKey }
}

