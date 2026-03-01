import { webcrypto } from "node:crypto";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 21;

/**
 * Generate a random ID string of the specified length.
 * Similar to nanoid package
 */
export function generateId(): string {
  const mask = 63; // smallest bitmask >= 35 (2^6 - 1)
  const bytes = webcrypto.getRandomValues(new Uint8Array(ID_LENGTH * 2)); // extra bytes for rejections
  let id = "";
  let cursor = 0;
  while (id.length < ID_LENGTH) {
    const val = bytes[cursor++] & mask;
    if (val < ALPHABET.length) {
      id += ALPHABET[val];
    }
    if (cursor >= bytes.length) {
      webcrypto.getRandomValues(bytes);
      cursor = 0;
    }
  }
  return id;
}
