const FORMAT = 'nc250-encrypted-v1'
const ITERATIONS = 250_000

interface EncryptedPayload {
  format: typeof FORMAT
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: toArrayBuffer(salt), iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptBackup(plainText: string, passphrase: string) {
  if (passphrase.length < 8) throw new Error('Use a passphrase with at least 8 characters.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt, ITERATIONS)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plainText),
  )
  const payload: EncryptedPayload = {
    format: FORMAT,
    iterations: ITERATIONS,
    salt: toBase64(new Uint8Array(toArrayBuffer(salt))),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  }
  return JSON.stringify(payload)
}

export async function decryptBackup(value: string, passphrase: string) {
  let payload: EncryptedPayload
  try {
    payload = JSON.parse(value) as EncryptedPayload
  } catch {
    throw new Error('This is not a valid encrypted tracker backup.')
  }
  if (payload.format !== FORMAT) throw new Error('This encrypted backup format is not supported.')
  try {
    const salt = fromBase64(payload.salt)
    const iv = fromBase64(payload.iv)
    const key = await deriveKey(passphrase, salt, payload.iterations)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      fromBase64(payload.ciphertext),
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    throw new Error('The passphrase is incorrect or the backup is damaged.')
  }
}