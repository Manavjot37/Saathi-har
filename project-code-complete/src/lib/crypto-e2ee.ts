/**
 * End-to-End Encryption (E2EE) engine for SAATHI secure chat.
 * Uses Web Crypto API (ECDH for key exchange, AES-GCM for encryption).
 */

export type EncryptedPayload = { iv: string; ct: string };

export type E2EEContext = {
  encrypt: (plaintext: string) => Promise<EncryptedPayload>;
  decrypt: (payload: EncryptedPayload) => Promise<string>;
  publicKeyExport: string;
};

// --- Helper Utilities ---

export function bufferToBase64(buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    const val = bytes[i] ?? 0;
    binary += String.fromCharCode(val);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- Key Management ---

/**
 * Generate ECDH P-256 key pair.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey']
  );
}

/**
 * Derive AES-256-GCM shared key using ECDH.
 */
export async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export public key as base64 JWK string.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey('jwk', key);
  return btoa(JSON.stringify(jwk));
}

/**
 * Import public key from base64 JWK string.
 */
export async function importPublicKey(jwkBase64: string): Promise<CryptoKey> {
  const jwk = JSON.parse(atob(jwkBase64));
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

// --- IndexedDB Key Store ---

const DB_NAME = 'saathi_e2ee';
const STORE_NAME = 'keys';

async function getDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return null;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
}

/**
 * Store key pair in IndexedDB.
 */
export async function storeKeyPair(role: string, keyPair: CryptoKeyPair): Promise<void> {
  const db = await getDB();
  if (!db) return; // SSR or unsupported
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put(keyPair, role);
    request.onsuccess = () => resolve();
    request.onerror = (event: any) => reject(event.target.error);
  });
}

/**
 * Load key pair from IndexedDB.
 */
export async function loadKeyPair(role: string): Promise<CryptoKeyPair | null> {
  const db = await getDB();
  if (!db) return null; // SSR or unsupported
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(role);
    request.onsuccess = (event: any) => resolve(event.target.result || null);
    request.onerror = (event: any) => reject(event.target.error);
  });
}

// --- Encrypt / Decrypt ---

/**
 * Encrypt message using AES-GCM.
 */
export async function encryptMessage(text: string, sharedKey: CryptoKey): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    sharedKey,
    encoded
  );
  
  return {
    iv: bufferToBase64(iv),
    ct: bufferToBase64(ciphertext),
  };
}

/**
 * Decrypt message using AES-GCM.
 */
export async function decryptMessage(payload: EncryptedPayload, sharedKey: CryptoKey): Promise<string> {
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const ciphertext = base64ToBuffer(payload.ct);
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    sharedKey,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}

// --- High Level API ---

export function isE2EEAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' && 
         typeof indexedDB !== 'undefined';
}

/**
 * Initialize E2EE for a role.
 */
export async function initE2EE(role: 'victim' | 'counsellor'): Promise<E2EEContext> {
  if (!isE2EEAvailable()) {
    throw new Error('E2EE is not supported in this environment.');
  }

  // Load or generate key pair
  let keyPair = await loadKeyPair(role);
  if (!keyPair) {
    keyPair = await generateKeyPair();
    await storeKeyPair(role, keyPair);
  }

  const publicKeyExport = await exportPublicKey(keyPair.publicKey);
  
  // Simulated key exchange via localStorage MVP
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`saathi_e2ee_pubkey_${role}`, publicKeyExport);
  }

  // Helper to establish shared key on demand
  const getSharedKey = async (): Promise<CryptoKey> => {
    const otherRole = role === 'victim' ? 'counsellor' : 'victim';
    const otherPubKeyExport = typeof localStorage !== 'undefined' 
      ? localStorage.getItem(`saathi_e2ee_pubkey_${otherRole}`) 
      : null;
      
    if (!otherPubKeyExport) {
      throw new Error(`Public key for ${otherRole} not found. Key exchange incomplete.`);
    }
    
    const otherPublicKey = await importPublicKey(otherPubKeyExport);
    return await deriveSharedKey(keyPair!.privateKey, otherPublicKey);
  };

  return {
    publicKeyExport,
    encrypt: async (plaintext: string) => {
      const sharedKey = await getSharedKey();
      return await encryptMessage(plaintext, sharedKey);
    },
    decrypt: async (payload: EncryptedPayload) => {
      const sharedKey = await getSharedKey();
      return await decryptMessage(payload, sharedKey);
    }
  };
}
