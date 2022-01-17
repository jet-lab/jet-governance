const whitelistedAddresses: Record<string, boolean> = {
  "A87z68uQ9TVEyaLSoLMj4qPLFiG3V1GeCb9UupTVJ5U3": true,
  "52SVnkAdyLE2orX2pqCxawrDVgpXjXw4LQ83Fcb6AYms": false
}

export const isAddressWhitelisted = (pubkey: string) => {
    return whitelistedAddresses[pubkey]
}

export const isAddressAuthenticated = (pubkey: string) => {
  const authenticatedAddresses = Object.keys(whitelistedAddresses)
  return authenticatedAddresses.includes(pubkey)
}