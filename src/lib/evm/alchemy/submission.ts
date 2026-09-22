import type { LiFiStep } from '@lifi/sdk';
import { concatHex, isHex, numberToHex, type Hex } from 'viem';

import { browser } from 'lib/browser';

import type { AlchemyBatchQuote, AlchemyPreparedOperation, AlchemySignedCalls } from './types';
import { getAlchemyOperation, getAlchemyOperationHash, validateAlchemyPreparedCalls } from './validation';

export interface AlchemySubmissionAttempt {
  signed: AlchemySignedCalls;
  id: Hex;
  state: 'queued' | 'unknown' | 'pending' | 'failed';
  checks: number;
  nextCheckAt: number;
}

export interface AlchemySubmission {
  version: 2;
  quote: AlchemyBatchQuote;
  steps: LiFiStep[];
  attempts: AlchemySubmissionAttempt[];
  result?: { status: 'confirmed'; transactionHash: Hex } | { status: 'failed' };
  error?: { message: string; code?: number; data?: unknown };
}

// Keep the storage key so existing installations can migrate without a second submission slot.
export const ALCHEMY_SUBMISSION_PREFIX = 'alchemy-swap-v1:';
export const getAlchemySubmissionKey = (account: Hex, chainId: number): string =>
  `${ALCHEMY_SUBMISSION_PREFIX}${account.toLowerCase()}:${chainId}`;

/**
 * Wallet API call IDs contain the uint256 chain ID followed by the UserOperation hash.
 * https://www.alchemy.com/docs/wallets/api-reference/smart-wallets/wallet-api-endpoints/wallet-get-calls-status
 */
export function getAlchemyCallId(operation: Pick<AlchemyPreparedOperation, 'data' | 'chainId'>): Hex {
  return concatHex([numberToHex(BigInt(operation.chainId), { size: 32 }), getAlchemyOperationHash(operation)]);
}

export async function getAlchemySubmission(account: Hex, chainId: number): Promise<AlchemySubmission | undefined> {
  const key = getAlchemySubmissionKey(account, chainId);
  const record = parseAlchemySubmission((await browser.storage.local.get(key))[key]);
  if (
    record &&
    (record.quote.request.from.toLowerCase() !== account.toLowerCase() ||
      BigInt(record.quote.request.chainId) !== BigInt(chainId))
  )
    throw new Error('Batch recovery account mismatch');
  return record;
}

export function parseAlchemySubmission(value: unknown): AlchemySubmission | undefined {
  if (value === undefined) return undefined;
  try {
    if (!value || typeof value !== 'object' || !('version' in value) || (value.version !== 1 && value.version !== 2))
      throw new Error();
    const record = value as AlchemySubmission;
    const { quote, steps, attempts } = record;
    if (
      !quote ||
      !Array.isArray(steps) ||
      !steps.length ||
      !Array.isArray(attempts) ||
      !attempts.length ||
      !['slow', 'mid', 'fast'].includes(quote.feeOption) ||
      !Number.isFinite(quote.expiresAt)
    )
      throw new Error();
    validateAlchemyPreparedCalls(quote.prepared, quote.request);
    for (const step of steps) {
      if (!step.action?.fromToken || !step.action.toToken || !step.estimate) throw new Error();
    }
    const nonce = BigInt(getAlchemyOperation(quote.prepared).data.nonce);
    const migrated = attempts.map(attempt => {
      const signed = attempt.signed;
      const item = signed.type === 'array' ? signed.data[1] : signed;
      if (
        !item ||
        item.type !== 'user-operation-v070' ||
        !('sender' in item.data) ||
        !isHex(item.signature?.data) ||
        item.signature.data.length !== 132 ||
        item.signature.type !== 'secp256k1' ||
        BigInt(item.data.nonce) !== nonce
      )
        throw new Error();
      const operation: AlchemyPreparedOperation = {
        type: 'user-operation-v070',
        chainId: item.chainId,
        data: item.data,
        signatureRequest: {
          type: 'personal_sign',
          data: { raw: getAlchemyOperationHash({ chainId: item.chainId, data: item.data }) }
        }
      };
      validateAlchemyPreparedCalls(operation, quote.request);
      if (signed.type === 'array') {
        const auth = signed.data[0];
        if (
          signed.data.length !== 2 ||
          auth.type !== 'authorization' ||
          !('address' in auth.data) ||
          !isHex(auth.signature?.data) ||
          auth.signature.data.length !== 132 ||
          auth.signature.type !== 'secp256k1'
        )
          throw new Error();
        validateAlchemyPreparedCalls(
          { type: 'array', data: [{ type: 'authorization', chainId: auth.chainId, data: auth.data }, operation] },
          quote.request
        );
      }
      const id = getAlchemyCallId(operation);
      if (attempt.id && attempt.id.toLowerCase() !== id.toLowerCase()) throw new Error();
      if (value.version === 1)
        return {
          signed,
          id,
          state: attempt.id ? ('pending' as const) : ('unknown' as const),
          checks: 0,
          nextCheckAt: 0
        };
      if (
        !['queued', 'unknown', 'pending', 'failed'].includes(attempt.state) ||
        !Number.isSafeInteger(attempt.checks) ||
        attempt.checks < 0 ||
        !Number.isFinite(attempt.nextCheckAt)
      )
        throw new Error();
      return { ...attempt, id };
    });
    if (
      record.result &&
      record.result.status !== 'failed' &&
      (record.result.status !== 'confirmed' || !isHex(record.result.transactionHash))
    )
      throw new Error();
    return { ...record, version: 2, attempts: migrated };
  } catch {
    // Never discard a damaged record: an operation can still exist on-chain.
    throw new Error('Unsupported batch recovery record');
  }
}
