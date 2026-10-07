/**
 * ZenDev Zero-Knowledge End-to-End Cryptographic Engine
 * Standard: PBKDF2-HMAC-SHA256 (100,000 rounds) + AES-256-GCM (96-bit IV)
 * Complies with WebCrypto API standards (Zero dependencies, blazingly fast)
 */

import { EncryptedSyncEnvelope, SyncPayload } from './types'

const PBKDF2_ITERATIONS = 100000
const KEY_LENGTH_BITS = 256
const SALT_BYTES = 16
const IV_BYTES = 12

// Robust binary <-> Base64 helpers that work across browser & Node
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Derives an AES-GCM CryptoKey from a user passphrase and salt via PBKDF2.
 */
async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = (typeof window !== 'undefined' ? window.crypto?.subtle : undefined) || (globalThis as any).crypto?.subtle
  if (!subtle) {
    throw new Error('WebCrypto API is not supported in this runtime environment.')
  }

  const enc = new TextEncoder()
  const passphraseKey = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passphraseKey,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Computes a SHA-256 fingerprint for quick validation / checksums
 */
export async function computeSha256(text: string): Promise<string> {
  const subtle = (typeof window !== 'undefined' ? window.crypto?.subtle : undefined) || (globalThis as any).crypto?.subtle
  if (!subtle) return 'no-crypto'
  const enc = new TextEncoder()
  const hashBuf = await subtle.digest('SHA-256', enc.encode(text))
  return bufferToBase64(hashBuf)
}

/**
 * Encrypts a SyncPayload with a user passphrase into an EncryptedSyncEnvelope.
 */
export async function encryptSyncPayload(
  payload: SyncPayload,
  passphrase: string,
  revision = 1
): Promise<EncryptedSyncEnvelope> {
  const subtle = (typeof window !== 'undefined' ? window.crypto?.subtle : undefined) || (globalThis as any).crypto?.subtle
  if (!subtle) {
    throw new Error('WebCrypto API is not available')
  }

  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Master passphrase cannot be empty.')
  }

  const cryptoObj = (typeof window !== 'undefined' ? window.crypto : undefined) || (globalThis as any).crypto
  const salt = new Uint8Array(SALT_BYTES)
  const iv = new Uint8Array(IV_BYTES)
  cryptoObj.getRandomValues(salt)
  cryptoObj.getRandomValues(iv)

  const key = await deriveAesKey(passphrase, salt)

  const enc = new TextEncoder()
  const jsonString = JSON.stringify(payload)
  const plainBytes = enc.encode(jsonString)

  // WebCrypto AES-GCM appends the 128-bit authentication tag at the end of the ciphertext
  const cipherBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    key,
    plainBytes
  )

  const checksum = await computeSha256(jsonString)

  return {
    version: 1,
    workspaceId: payload.workspaceId,
    revision,
    timestamp: Date.now(),
    cipher: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(cipherBuffer),
    tag: '', // Tag is in ciphertext in WebCrypto AES-GCM
    clientFingerprint: payload.clientFingerprint || 'zendev-client',
    payloadChecksum: checksum
  }
}

/**
 * Decrypts an EncryptedSyncEnvelope back into a SyncPayload using the master passphrase.
 * Throws an explicit error if the passphrase is wrong or the ciphertext has been modified.
 */
export async function decryptSyncPayload(
  envelope: EncryptedSyncEnvelope,
  passphrase: string
): Promise<SyncPayload> {
  const subtle = (typeof window !== 'undefined' ? window.crypto?.subtle : undefined) || (globalThis as any).crypto?.subtle
  if (!subtle) {
    throw new Error('WebCrypto API is not available')
  }

  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Master passphrase cannot be empty.')
  }

  const salt = base64ToBuffer(envelope.salt)
  const iv = base64ToBuffer(envelope.iv)
  const cipherBytes = base64ToBuffer(envelope.ciphertext)

  const key = await deriveAesKey(passphrase, salt)

  try {
    const plainBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      cipherBytes
    )

    const dec = new TextDecoder()
    const jsonString = dec.decode(plainBuffer)
    const payload = JSON.parse(jsonString) as SyncPayload

    return payload
  } catch (err) {
    throw new Error('Şifre çözülemedi. Parola hatalı veya veri bütünlüğü bozulmuş olabilir.')
  }
}

/**
 * Validates whether a given passphrase can decrypt the test envelope.
 */
export async function verifyPassphrase(
  envelope: EncryptedSyncEnvelope,
  passphrase: string
): Promise<boolean> {
  try {
    await decryptSyncPayload(envelope, passphrase)
    return true
  } catch {
    return false
  }
}
