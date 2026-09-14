import type { LiFiStep } from '@lifi/sdk';
import type { Hex } from 'viem';

import { browser } from 'lib/browser';

import type { AlchemyBatchQuote, AlchemySignedCalls } from './types';

export interface AlchemySubmission {
  version: 1;
  quote: AlchemyBatchQuote;
  steps: LiFiStep[];
  attempts: { signed: AlchemySignedCalls; id?: Hex }[];
}

export const getAlchemySubmissionKey = (account: Hex, chainId: number): string =>
  `alchemy-swap-v1:${account.toLowerCase()}:${chainId}`;

export async function getAlchemySubmission(account: Hex, chainId: number): Promise<AlchemySubmission | undefined> {
  const key = getAlchemySubmissionKey(account, chainId);
  return parseAlchemySubmission((await browser.storage.local.get(key))[key]);
}

export function parseAlchemySubmission(value: unknown): AlchemySubmission | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) {
    throw new Error('Unsupported batch recovery record');
  }
  if (
    !('quote' in value) ||
    !value.quote ||
    typeof value.quote !== 'object' ||
    !('steps' in value) ||
    !Array.isArray(value.steps) ||
    !('attempts' in value) ||
    !Array.isArray(value.attempts)
  ) {
    throw new Error('Unsupported batch recovery record');
  }
  return value as AlchemySubmission;
}
