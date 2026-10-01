import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const PAYLOAD_VERSION = "v1";
const PAYLOAD_AAD = Buffer.from("api-sentinel/request-header/v1", "utf8");
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
export const MAX_ENCRYPTED_SECRET_BYTES = 8_192;

export class EncryptionConfigurationError extends Error {
  constructor() {
    super("A valid server encryption key is required for sensitive header storage.");
    this.name = "EncryptionConfigurationError";
  }
}

export class SecretEncryptionError extends Error {
  constructor() {
    super("The sensitive value could not be encrypted safely.");
    this.name = "SecretEncryptionError";
  }
}

export class SecretDecryptionError extends Error {
  constructor() {
    super("The stored sensitive value could not be decrypted safely.");
    this.name = "SecretDecryptionError";
  }
}

export function parseEncryptionKey(value: string | undefined) {
  if (!value || value !== value.trim() || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new EncryptionConfigurationError();
  }

  let key: Buffer;
  try {
    key = Buffer.from(value, "base64");
  } catch {
    throw new EncryptionConfigurationError();
  }

  if (key.byteLength !== 32 || key.toString("base64") !== value) {
    throw new EncryptionConfigurationError();
  }
  return key;
}

export function encryptSecretWithKey(plaintext: string, encodedKey: string | undefined) {
  const bytes = Buffer.from(plaintext, "utf8");
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_ENCRYPTED_SECRET_BYTES) {
    throw new SecretEncryptionError();
  }

  try {
    const key = parseEncryptionKey(encodedKey);
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
    cipher.setAAD(PAYLOAD_AAD);
    const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      PAYLOAD_VERSION,
      iv.toString("base64url"),
      ciphertext.toString("base64url"),
      tag.toString("base64url"),
    ].join(".");
  } catch (error) {
    if (error instanceof EncryptionConfigurationError || error instanceof SecretEncryptionError) {
      throw error;
    }
    throw new SecretEncryptionError();
  }
}

export function decryptSecretWithKey(payload: string, encodedKey: string | undefined) {
  try {
    const key = parseEncryptionKey(encodedKey);
    const [version, encodedIv, encodedCiphertext, encodedTag, extra] = payload.split(".");
    if (
      extra !== undefined ||
      version !== PAYLOAD_VERSION ||
      !isCanonicalBase64Url(encodedIv) ||
      !isCanonicalBase64Url(encodedCiphertext) ||
      !isCanonicalBase64Url(encodedTag)
    ) {
      throw new SecretDecryptionError();
    }

    const iv = Buffer.from(encodedIv, "base64url");
    const ciphertext = Buffer.from(encodedCiphertext, "base64url");
    const tag = Buffer.from(encodedTag, "base64url");
    if (
      iv.byteLength !== IV_BYTES ||
      tag.byteLength !== AUTH_TAG_BYTES ||
      ciphertext.byteLength === 0 ||
      ciphertext.byteLength > MAX_ENCRYPTED_SECRET_BYTES
    ) {
      throw new SecretDecryptionError();
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
    decipher.setAAD(PAYLOAD_AAD);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch (error) {
    if (error instanceof EncryptionConfigurationError) throw error;
    throw new SecretDecryptionError();
  }
}

export function isEncryptedSecretPayload(payload: string) {
  const [version, encodedIv, encodedCiphertext, encodedTag, extra] = payload.split(".");
  if (
    extra !== undefined ||
    version !== PAYLOAD_VERSION ||
    !isCanonicalBase64Url(encodedIv) ||
    !isCanonicalBase64Url(encodedCiphertext) ||
    !isCanonicalBase64Url(encodedTag)
  ) {
    return false;
  }
  return (
    Buffer.from(encodedIv, "base64url").byteLength === IV_BYTES &&
    Buffer.from(encodedTag, "base64url").byteLength === AUTH_TAG_BYTES &&
    Buffer.from(encodedCiphertext, "base64url").byteLength > 0
  );
}

function isCanonicalBase64Url(value: string | undefined): value is string {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) return false;
  return Buffer.from(value, "base64url").toString("base64url") === value;
}
