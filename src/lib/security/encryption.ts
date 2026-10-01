import "server-only";

import {
  decryptSecretWithKey,
  encryptSecretWithKey,
  EncryptionConfigurationError,
  SecretDecryptionError,
  SecretEncryptionError,
} from "./encryption-core";

export {
  EncryptionConfigurationError,
  SecretDecryptionError,
  SecretEncryptionError,
};

export function encryptSecret(plaintext: string) {
  return encryptSecretWithKey(plaintext, process.env.ENCRYPTION_KEY);
}

export function decryptSecret(payload: string) {
  return decryptSecretWithKey(payload, process.env.ENCRYPTION_KEY);
}
