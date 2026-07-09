import AsyncStorage from '@react-native-async-storage/async-storage';
import aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import type { SupportedStorage } from '@rinciku/db';

// Encrypted-at-rest session storage for the Supabase client.
//
// AsyncStorage is plaintext on device (lifted trivially from a jailbroken
// phone or an `adb backup`), so the refresh token must not live there raw.
// Storing the whole session in SecureStore is out too: iOS keychain values
// have a ~2 KB soft limit and Supabase session JSON exceeds it. So this is the
// Supabase-documented "LargeSecureStore" pattern: the value is AES-CTR
// encrypted into AsyncStorage, and only the 32-byte data key lives in
// SecureStore (Keychain / Android Keystore).
//
// Any read that fails to parse or decrypt returns null AND clears the stored
// value — supabase-js treats that as signed-out. Sessions persisted by builds
// that wrote plaintext AsyncStorage take this path once (a one-time re-login,
// accepted pre-release) and the plaintext token is deleted rather than left
// behind.

const IV_BYTES = 16;
const KEY_BYTES = 32;

function secureKeyName(key: string): string {
  // SecureStore keys allow only [A-Za-z0-9._-]; session keys
  // (`sb-<ref>-auth-token`) already fit, but sanitize defensively.
  return `enc.${key}`.replace(/[^A-Za-z0-9._-]/g, '_');
}

export class LargeSecureStore implements SupportedStorage {
  private async getOrCreateDataKey(name: string): Promise<Uint8Array | null> {
    const existing = await SecureStore.getItemAsync(name);
    if (existing) return aesjs.utils.hex.toBytes(existing);
    const fresh = Crypto.getRandomBytes(KEY_BYTES);
    await SecureStore.setItemAsync(name, aesjs.utils.hex.fromBytes(fresh));
    return fresh;
  }

  async getItem(key: string): Promise<string | null> {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;
    try {
      const keyHex = await SecureStore.getItemAsync(secureKeyName(key));
      if (!keyHex) throw new Error('missing data key');
      const [ivHex, cipherHex] = stored.split(':');
      if (!ivHex || !cipherHex) throw new Error('unexpected format');
      const cipher = new aesjs.ModeOfOperation.ctr(
        aesjs.utils.hex.toBytes(keyHex),
        new aesjs.Counter(aesjs.utils.hex.toBytes(ivHex))
      );
      return aesjs.utils.utf8.fromBytes(
        cipher.decrypt(aesjs.utils.hex.toBytes(cipherHex))
      );
    } catch {
      // Undecryptable (legacy plaintext session, lost key, corruption): treat
      // as signed out and remove the value so nothing readable lingers.
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const dataKey = await this.getOrCreateDataKey(secureKeyName(key));
    if (!dataKey) return;
    const iv = Crypto.getRandomBytes(IV_BYTES);
    const cipher = new aesjs.ModeOfOperation.ctr(
      dataKey,
      new aesjs.Counter(iv)
    );
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await AsyncStorage.setItem(
      key,
      `${aesjs.utils.hex.fromBytes(iv)}:${aesjs.utils.hex.fromBytes(encrypted)}`
    );
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(secureKeyName(key));
  }
}
