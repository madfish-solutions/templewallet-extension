import { sha256 } from '@noble/hashes/sha2';
import bs58check from 'bs58check';
import { Buffer } from 'buffer';

const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function decodeBeaconPayload(wire: string): Buffer {
  // Pairing and ordinary requests are cheaper on the existing byte-array decoder.
  if (typeof wire !== 'string' || wire.length < 1400) return bs58check.decode(wire);

  if (/[^1-9A-HJ-NP-Za-km-z]/.test(wire)) throw new Error('Non-base58 character');

  // Combine halves so each digit does not have to update the entire accumulated value.
  const powers = new Map<number, bigint>();
  function read(start: number, end: number): bigint {
    if (end - start <= 8) {
      // Eight base-58 digits fit exactly in a JavaScript number.
      let value = 0;
      for (let i = start; i < end; i++) value = value * 58 + alphabet.indexOf(wire[i]);
      return BigInt(value);
    }

    const mid = start + Math.floor((end - start) / 2);
    const width = end - mid;
    let power = powers.get(width);
    if (power === undefined) {
      power = 58n ** BigInt(width);
      powers.set(width, power);
    }
    return read(start, mid) * power + read(mid, end);
  }

  // Each leading '1' represents a zero byte that integer conversion would discard.
  const first = wire.search(/[^1]/);
  let bytes: Buffer;
  if (first === -1) {
    bytes = Buffer.alloc(wire.length);
  } else {
    const hex = read(first, wire.length).toString(16);
    const digits = hex.length % 2 === 0 ? hex : '0' + hex;
    bytes = Buffer.alloc(first + digits.length / 2);
    bytes.write(digits, first, 'hex');
  }

  const payload = bytes.slice(0, -4);
  const checksum = sha256(sha256(new Uint8Array(bytes.buffer, bytes.byteOffset, payload.length)));
  if (bytes.readUInt32BE(payload.length) !== Buffer.from(checksum).readUInt32BE(0)) throw new Error('Invalid checksum');
  return payload;
}
