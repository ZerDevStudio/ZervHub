/**
 * ZenDev E2EE Cloud Sync & Cryptographic Verification Test Suite
 * Vitest specification for WebCrypto PBKDF2 + AES-256-GCM zero-knowledge engine
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  encryptSyncPayload,
  decryptSyncPayload,
  verifyPassphrase,
  computeSha256
} from '../src/renderer/src/lib/cloudSync/cryptoE2EE'
import { SyncPayload, EncryptedSyncEnvelope } from '../src/renderer/src/lib/cloudSync/types'

describe('ZenDev E2EE Cloud Sync & Zero-Knowledge Architecture', () => {
  const samplePayload: SyncPayload = {
    version: 1,
    workspaceId: 'ws_test_enterprise',
    timestamp: 1775000000000,
    clientFingerprint: 'zendev-test-client',
    collectionsCount: 2,
    environmentsCount: 1,
    snippetsCount: 3,
    data: {
      api_collections: [
        { id: 'col_1', name: 'Stripe Billing Webhooks', url: 'https://api.stripe.com/v1/charges' },
        { id: 'col_2', name: 'Auth0 OAuth Introspection', url: 'https://auth.acme.com/oauth/token' }
      ],
      environments: [
        { key: 'API_SECRET', value: 'sk_live_998877665544' }
      ],
      regex_rules: [
        { pattern: '^Bearer\\s+([a-zA-Z0-9\\-_]+)$', flags: 'i' }
      ],
      snippets: [
        { title: 'HMAC Signature Helper', code: 'crypto.createHmac(...)' }
      ]
    }
  }

  const MASTER_PASSPHRASE = 'ZenDev-Vault-Super-Secret-2026!'
  const WRONG_PASSPHRASE = 'Incorrect-Guess-1234'

  describe('1. Cryptographic Key Derivation & AES-256-GCM Encryption', () => {
    it('encrypts a SyncPayload into an authenticated EncryptedSyncEnvelope', async () => {
      const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1)

      expect(envelope.version).toBe(1)
      expect(envelope.workspaceId).toBe('ws_test_enterprise')
      expect(envelope.revision).toBe(1)
      expect(envelope.cipher).toBe('AES-256-GCM')
      expect(envelope.kdf).toBe('PBKDF2-SHA256')
      expect(envelope.iterations).toBe(100000)
      expect(typeof envelope.salt).toBe('string')
      expect(envelope.salt.length).toBeGreaterThan(10)
      expect(typeof envelope.iv).toBe('string')
      expect(envelope.iv.length).toBeGreaterThan(10)
      expect(typeof envelope.ciphertext).toBe('string')
      expect(envelope.ciphertext.length).toBeGreaterThan(50)
      expect(envelope.ciphertext).not.toContain('Stripe Billing Webhooks') // Zero-knowledge: plaintext never leaked
    })

    it('successfully decrypts with correct master passphrase yielding identical payload', async () => {
      const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1)
      const decrypted = await decryptSyncPayload(envelope, MASTER_PASSPHRASE)

      expect(decrypted.workspaceId).toBe(samplePayload.workspaceId)
      expect(decrypted.collectionsCount).toBe(2)
      expect(decrypted.data.api_collections?.length).toBe(2)
      expect(decrypted.data.api_collections?.[0].name).toBe('Stripe Billing Webhooks')
      expect(decrypted.data.environments?.[0].value).toBe('sk_live_998877665544')
    })

    it('rejects decryption when provided an incorrect passphrase', async () => {
      const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1)

      await expect(
        decryptSyncPayload(envelope, WRONG_PASSPHRASE)
      ).rejects.toThrow()
    })

    it('rejects tampered ciphertext to prevent cipher manipulation attacks', async () => {
      const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1)
      
      // Flip characters in the ciphertext
      const tamperedBytes = envelope.ciphertext.slice(0, -4) + 'AAAA'
      const tamperedEnvelope: EncryptedSyncEnvelope = {
        ...envelope,
        ciphertext: tamperedBytes
      }

      await expect(
        decryptSyncPayload(tamperedEnvelope, MASTER_PASSPHRASE)
      ).rejects.toThrow()
    })
  })

  describe('2. Passphrase Verification & Checksum Integrity', () => {
    it('verifyPassphrase returns true for valid key and false for invalid key', async () => {
      const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1)

      const isValid = await verifyPassphrase(envelope, MASTER_PASSPHRASE)
      const isInvalid = await verifyPassphrase(envelope, WRONG_PASSPHRASE)

      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
    })

    it('computes deterministic SHA-256 fingerprint for payloads', async () => {
      const hash1 = await computeSha256('ZenDev Test String')
      const hash2 = await computeSha256('ZenDev Test String')
      const hashDiff = await computeSha256('Different String')

      expect(hash1).toBe(hash2)
      expect(hash1).not.toBe(hashDiff)
      expect(typeof hash1).toBe('string')
    })
  })
})
