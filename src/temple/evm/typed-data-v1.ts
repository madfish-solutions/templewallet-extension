// Original: https://github.com/MetaMask/eth-sig-util/blob/66a8c0935c14d6ef80b583148d0c758c198a9c4a/src/sign-typed-data.ts

import { encodePacked, hexToBytes, isHex, keccak256, numberToBytes, pad, toBytes } from 'viem';

import { EVMErrorCodes } from './constants';
import { ErrorWithCode } from './types';

interface TypedDataV1Field {
  name: string;
  type: string;
  value: any;
}

export type TypedDataV1 = TypedDataV1Field[];

const ARRAY_REGEX = /^(?<type>.*)\[(?<length>\d*?)\]$/u;
const NUMBER_REGEX = /^u?int(?<length>[0-9]*)?$/u;

const isArrayType = (type: string) => ARRAY_REGEX.test(type);

function getLength(type: string) {
  if (type === 'int' || type === 'uint') {
    return 256;
  }

  const groups = type.match(NUMBER_REGEX)?.groups;

  if (!groups?.length) {
    throw new ErrorWithCode(
      EVMErrorCodes.INVALID_INPUT,
      `Invalid number type. Expected a number type, but received "${type}".`
    );
  }

  const length = parseInt(groups.length, 10);

  if (length < 8 || length > 256) {
    throw new ErrorWithCode(
      EVMErrorCodes.INVALID_INPUT,
      `Invalid number length. Expected a number between 8 and 256, but received "${type}".`
    );
  }

  if (length % 8 !== 0) {
    throw new ErrorWithCode(
      EVMErrorCodes.INVALID_INPUT,
      `Invalid number length. Expected a multiple of 8, but received "${type}".`
    );
  }

  return length;
}

function padStart(buffer: Uint8Array, length = 32) {
  return pad(buffer, { dir: 'left', size: length });
}

function normalizeAddresses(values: unknown[]) {
  return values.map(value => {
    if (typeof value === 'number') {
      return padStart(numberToBytes(value), 32);
    }

    if (isHex(value)) {
      return padStart(hexToBytes(value).subarray(0, 32), 32);
    }

    if (value instanceof Uint8Array) {
      return padStart(value.subarray(0, 32), 32);
    }

    return value;
  });
}

function signedBigIntToBytes(value: bigint, byteLength: number): Uint8Array {
  let numberValue = value;
  const bytes = new Uint8Array(byteLength);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number(BigInt.asUintN(8, numberValue));
    numberValue >>= BigInt(8);
  }

  return bytes.reverse();
}

function normalizeIntegers(type: string, values: unknown[]) {
  return values.map(value => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
      const bigIntValue = BigInt(value);
      if (bigIntValue >= BigInt(0)) {
        return padStart(toBytes(bigIntValue), 32);
      }

      const length = getLength(type);
      const asIntN = BigInt.asIntN(length, bigIntValue);
      return signedBigIntToBytes(asIntN, 32);
    }

    return value;
  });
}

function getArrayType(type: string): [type: string, length: number | undefined] {
  const groups = type.match(ARRAY_REGEX)?.groups;
  if (!groups?.type) {
    throw new ErrorWithCode(
      EVMErrorCodes.INVALID_INPUT,
      `Invalid array type. Expected an array type, but received "${type}".`
    );
  }

  return [groups.type, groups.length ? parseInt(groups.length, 10) : undefined];
}

function normalizeValue(type: string, value: unknown): any {
  if (isArrayType(type) && Array.isArray(value)) {
    const [innerType] = getArrayType(type);
    return value.map(item => normalizeValue(innerType, item));
  }

  if (type === 'address') {
    if (isHex(value, { strict: true })) {
      return padStart(hexToBytes(value).subarray(0, 20), 20);
    }

    if (value instanceof Uint8Array) {
      return padStart(value.subarray(0, 20), 20);
    }
  }

  if (type === 'bool') {
    return Boolean(value);
  }

  if (type.startsWith('bytes') && type !== 'bytes') {
    const length = getLength(type) / 8;
    if (typeof value === 'number') {
      if (value < 0) {
        // `solidityPack(['bytesN'], [-1])` returns `0x00..00`.
        return new Uint8Array();
      }

      return numberToBytes(value).subarray(0, length);
    }

    if (isHex(value, { strict: true })) {
      return hexToBytes(value).subarray(0, length);
    }

    if (value instanceof Uint8Array) {
      return value.subarray(0, length);
    }
  }

  if (type.startsWith('uint')) {
    if (typeof value === 'number') {
      return Math.abs(value);
    }
  }

  if (type.startsWith('int')) {
    if (typeof value === 'number') {
      const length = getLength(type);
      return BigInt.asIntN(length, BigInt(value));
    }
  }

  return value;
}

interface TransformableToArray {
  toArray(): Uint8Array;
  toBuffer?(): Buffer;
}

/*
 * A type that represents an object that has a `toBuffer()` method.
 */
interface TransformableToBuffer {
  toBuffer(): Buffer;
  toArray?(): Uint8Array;
}

type ToBufferInputTypes =
  | HexString
  | number
  | bigint
  | Buffer
  | Uint8Array
  | number[]
  | TransformableToArray
  | TransformableToBuffer
  | null
  | undefined;

const toBuffer = function (v: ToBufferInputTypes): Buffer {
  if (v === null || v === undefined) {
    return Buffer.allocUnsafe(0);
  }

  if (Buffer.isBuffer(v)) {
    return Buffer.from(v);
  }

  if (Array.isArray(v) || v instanceof Uint8Array) {
    return Buffer.from(v as Uint8Array);
  }

  if (typeof v === 'string') {
    if (!isHex(v)) {
      throw new Error(
        `Cannot convert string to buffer. toBuffer only supports 0x-prefixed hex strings and this string was given: ${v}`
      );
    }
    return Buffer.from(toBytes(v));
  }

  if (typeof v === 'number') {
    return Buffer.from(toBytes(v));
  }

  if (typeof v === 'bigint') {
    if (v < BigInt(0)) {
      throw new Error(`Cannot convert negative bigint to buffer. Given: ${v}`);
    }
    let n = v.toString(16);
    if (n.length % 2) n = '0' + n;
    return Buffer.from(n, 'hex');
  }

  if (v.toArray) {
    // converts a BN to a Buffer
    return Buffer.from(v.toArray());
  }

  if (v.toBuffer) {
    return Buffer.from(v.toBuffer());
  }

  throw new Error('invalid type');
};

function legacyToBuffer(value: ToBufferInputTypes) {
  return typeof value === 'string' && !isHex(value) ? Buffer.from(value) : toBuffer(value);
}

export function typedV1SignatureHash(typedData: TypedDataV1) {
  const normalizedData = typedData.map(({ name, type, value }) => {
    // Handle an edge case with `address[]` types.
    if (type === 'address[]') {
      return {
        name,
        type: 'bytes32[]',
        value: normalizeAddresses(value)
      };
    }

    // Handle an edge case with `intN[]` types.
    if (type.startsWith('int') && isArrayType(type)) {
      const [innerType, length] = getArrayType(type);
      return {
        name,
        type: `bytes32[${length ?? ''}]`,
        value: normalizeIntegers(innerType, value)
      };
    }

    return {
      name,
      type,
      value: normalizeValue(type, value)
    };
  });

  const data = normalizedData.map(e => {
    if (e.type !== 'bytes') {
      return e.value;
    }

    return legacyToBuffer(e.value);
  });
  const types = normalizedData.map(e => {
    if (e.type === 'function') {
      throw new ErrorWithCode(EVMErrorCodes.INVALID_INPUT, 'Unsupported or invalid type: "function"');
    }

    return e.type;
  });
  const schema = typedData.map(e => {
    if (!e.name) {
      throw new Error();
    }
    return `${e.type} ${e.name}`;
  });

  return Buffer.from(
    keccak256(
      encodePacked(
        ['bytes32', 'bytes32'],
        [keccak256(encodePacked(['string[]'], [schema])), keccak256(encodePacked(types, data))]
      )
    ).slice(2),
    'hex'
  );
}
