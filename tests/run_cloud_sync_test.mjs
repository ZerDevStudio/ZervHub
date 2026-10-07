import { webcrypto } from 'crypto';

// Polyfill global crypto for Node environment
const subtle = webcrypto.subtle;
const getRandomValues = (arr) => webcrypto.getRandomValues(arr);

// Minimal test runner harness
let currentSuite = '';
let currentTest = '';
let passed = 0;
let failed = 0;

globalThis.describe = async (name, fn) => {
  const prev = currentSuite;
  currentSuite = prev ? `${prev} > ${name}` : name;
  console.log(`\n--- ${currentSuite} ---`);
  await fn();
  currentSuite = prev;
};

globalThis.it = async (name, fn) => {
  currentTest = name;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
};

globalThis.expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) throw new Error(`Expected ${expected}, received ${actual}`);
  },
  toEqual: (expected) => {
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) throw new Error(`Expected ${expStr}, received ${actStr}`);
  },
  toContain: (item) => {
    if (typeof actual === 'string' && !actual.includes(item)) throw new Error(`String does not contain ${item}`);
  },
  not: {
    toContain: (item) => {
      if (typeof actual === 'string' && actual.includes(item)) throw new Error(`String contains forbidden substring ${item}`);
    },
    toBe: (expected) => {
      if (actual === expected) throw new Error(`Expected value not to be ${expected}`);
    }
  },
  toBeGreaterThan: (expected) => {
    if (actual <= expected) throw new Error(`Expected ${actual} > ${expected}`);
  },
  rejects: {
    toThrow: async () => {
      let threw = false;
      try {
        await actual;
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('Expected promise to reject with an error, but it resolved successfully');
    }
  }
});

console.log('================================================================');
console.log('ZENDEV E2EE CLOUD SYNC & CRYPTO TEST RUNNER');
console.log('================================================================');

// Direct WebCrypto implementation matching cryptoE2EE.ts
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function bufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(passphrase, salt) {
  const enc = new TextEncoder();
  const passphraseKey = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

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
  );
}

async function computeSha256(text) {
  const enc = new TextEncoder();
  const hashBuf = await subtle.digest('SHA-256', enc.encode(text));
  return bufferToBase64(hashBuf);
}

async function encryptSyncPayload(payload, passphrase, revision = 1) {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Master passphrase cannot be empty.');
  }

  const salt = new Uint8Array(SALT_BYTES);
  const iv = new Uint8Array(IV_BYTES);
  getRandomValues(salt);
  getRandomValues(iv);

  const key = await deriveAesKey(passphrase, salt);
  const enc = new TextEncoder();
  const jsonString = JSON.stringify(payload);
  const plainBytes = enc.encode(jsonString);

  const cipherBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    key,
    plainBytes
  );

  const checksum = await computeSha256(jsonString);

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
    tag: '',
    clientFingerprint: payload.clientFingerprint || 'zendev-client',
    payloadChecksum: checksum
  };
}

async function decryptSyncPayload(envelope, passphrase) {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Master passphrase cannot be empty.');
  }

  const salt = base64ToBuffer(envelope.salt);
  const iv = base64ToBuffer(envelope.iv);
  const cipherBytes = base64ToBuffer(envelope.ciphertext);

  const key = await deriveAesKey(passphrase, salt);

  try {
    const plainBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      cipherBytes
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(plainBuffer);
    return JSON.parse(jsonString);
  } catch (err) {
    throw new Error('Şifre çözülemedi. Parola hatalı veya veri bütünlüğü bozulmuş olabilir.');
  }
}

async function verifyPassphrase(envelope, passphrase) {
  try {
    await decryptSyncPayload(envelope, passphrase);
    return true;
  } catch {
    return false;
  }
}

const samplePayload = {
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
};

const MASTER_PASSPHRASE = 'ZenDev-Vault-Super-Secret-2026!';
const WRONG_PASSPHRASE = 'Incorrect-Guess-1234';

// Execute tests sequentially
await globalThis.it('encrypts a SyncPayload into an authenticated EncryptedSyncEnvelope', async () => {
  const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1);
  expect(envelope.version).toBe(1);
  expect(envelope.workspaceId).toBe('ws_test_enterprise');
  expect(envelope.cipher).toBe('AES-256-GCM');
  expect(envelope.kdf).toBe('PBKDF2-SHA256');
  expect(envelope.iterations).toBe(100000);
  expect(envelope.salt.length).toBeGreaterThan(10);
  expect(envelope.iv.length).toBeGreaterThan(10);
  expect(envelope.ciphertext.length).toBeGreaterThan(50);
  expect(envelope.ciphertext).not.toContain('Stripe Billing Webhooks');
});

await globalThis.it('successfully decrypts with correct master passphrase yielding identical payload', async () => {
  const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1);
  const decrypted = await decryptSyncPayload(envelope, MASTER_PASSPHRASE);
  expect(decrypted.workspaceId).toBe(samplePayload.workspaceId);
  expect(decrypted.collectionsCount).toBe(2);
  expect(decrypted.data.api_collections[0].name).toBe('Stripe Billing Webhooks');
  expect(decrypted.data.environments[0].value).toBe('sk_live_998877665544');
});

await globalThis.it('rejects decryption when provided an incorrect passphrase', async () => {
  const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1);
  await expect(decryptSyncPayload(envelope, WRONG_PASSPHRASE)).rejects.toThrow();
});

await globalThis.it('rejects tampered ciphertext to prevent cipher manipulation attacks', async () => {
  const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1);
  const tamperedEnvelope = {
    ...envelope,
    ciphertext: envelope.ciphertext.slice(0, -4) + 'AAAA'
  };
  await expect(decryptSyncPayload(tamperedEnvelope, MASTER_PASSPHRASE)).rejects.toThrow();
});

await globalThis.it('verifyPassphrase returns true for valid key and false for invalid key', async () => {
  const envelope = await encryptSyncPayload(samplePayload, MASTER_PASSPHRASE, 1);
  const isValid = await verifyPassphrase(envelope, MASTER_PASSPHRASE);
  const isInvalid = await verifyPassphrase(envelope, WRONG_PASSPHRASE);
  expect(isValid).toBe(true);
  expect(isInvalid).toBe(false);
});

await globalThis.it('computes deterministic SHA-256 fingerprint for payloads', async () => {
  const hash1 = await computeSha256('ZenDev Test String');
  const hash2 = await computeSha256('ZenDev Test String');
  const hashDiff = await computeSha256('Different String');
  expect(hash1).toBe(hash2);
  expect(hash1).not.toBe(hashDiff);
});

console.log('================================================================');
console.log(`CRYPTO HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) process.exit(1);
