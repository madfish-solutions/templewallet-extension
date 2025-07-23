/*
 * Originals: node_modules/viem/utils/transaction/serializeTransaction.ts,
 * https://github.com/ethereumjs/ethereumjs-monorepo/blob/%40ethereumjs/tx%405.4.0/packages/tx/src/eip1559Transaction.ts
 */

import {
  OneOf,
  TransactionSerializable,
  concatHex,
  serializeTransaction as originalSerializeTransaction,
  serializeAccessList,
  toHex,
  toRlp
} from 'viem';
import { serializeAuthorizationList } from 'viem/utils';

interface LedgerSignature {
  v: number | string;
  s: string;
  r: string;
}

export const toViemSignature = ({ r, s, v }: LedgerSignature) =>
  ({
    r: `0x${r}`,
    s: `0x${s}`,
    v: BigInt(typeof v === 'number' ? v : `0x${v}`)
  } as const);

export const serializeLedgerTransaction = (tx: OneOf<TransactionSerializable>, signature: LedgerSignature) => {
  if (tx.type === 'eip1559' || tx.maxFeePerGas || tx.maxPriorityFeePerGas) {
    const { accessList, chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data } = tx;
    const serializedAccessList = serializeAccessList(accessList);

    const serializedTransaction = [
      toHex(chainId),
      nonce ? toHex(nonce) : '0x',
      maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : '0x',
      maxFeePerGas ? toHex(maxFeePerGas) : '0x',
      gas ? toHex(gas) : '0x',
      to ?? '0x',
      value ? toHex(value) : '0x',
      data ?? '0x',
      serializedAccessList,
      ...toRsvSignatureArray(signature)
    ];

    return concatHex(['0x02', toRlp(serializedTransaction)]);
  }

  if (tx.type === 'eip2930' || (tx.gasPrice && (tx.authorizationList || tx.accessList))) {
    const { accessList, chainId, nonce, gasPrice, gas, to, value, data } = tx;
    const serializedAccessList = serializeAccessList(accessList);

    const serializedTransaction = [
      toHex(chainId),
      nonce ? toHex(nonce) : '0x',
      gasPrice ? toHex(gasPrice) : '0x',
      gas ? toHex(gas) : '0x',
      to ?? '0x',
      value ? toHex(value) : '0x',
      data ?? '0x',
      serializedAccessList,
      ...toRsvSignatureArray(signature)
    ];

    return concatHex(['0x01', toRlp(serializedTransaction)]);
  }

  if (tx.type === 'eip7702' || tx.authorizationList) {
    const { accessList, authorizationList, chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data } =
      tx;
    const serializedAccessList = serializeAccessList(accessList);
    const serializedAuthorizationList = serializeAuthorizationList(authorizationList);

    return concatHex([
      '0x04',
      toRlp([
        toHex(chainId),
        nonce ? toHex(nonce) : '0x',
        maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : '0x',
        maxFeePerGas ? toHex(maxFeePerGas) : '0x',
        gas ? toHex(gas) : '0x',
        to ?? '0x',
        value ? toHex(value) : '0x',
        data ?? '0x',
        serializedAccessList,
        serializedAuthorizationList,
        ...toRsvSignatureArray(signature)
      ])
    ]);
  }

  return originalSerializeTransaction(tx, toViemSignature(signature));
};

const toRsvSignatureArray = (signature: LedgerSignature) => {
  const { r, s, v } = toViemSignature(signature);

  return [v === BigInt(0) ? '0x' : toHex(v), r, s];
};
