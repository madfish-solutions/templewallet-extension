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
  const local = (await browser.storage.local.get(key))[key];
  // Migrate session records to durable storage before a retry or browser restart.
  const previous = local === undefined ? (await browser.storage.session?.get(key))?.[key] : undefined;
  const stored = migrateAlchemySubmission(local ?? previous);
  if (previous !== undefined && stored) {
    await browser.storage.local.set({ [key]: stored });
    await browser.storage.session?.remove(key);
  }
  return stored;
}

export function migrateAlchemySubmission(value: unknown): AlchemySubmission | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) {
    throw new Error('Unsupported batch recovery record');
  }
  return value as AlchemySubmission;
}
