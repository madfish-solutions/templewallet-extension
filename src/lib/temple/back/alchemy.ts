import type { LiFiStep } from '@lifi/sdk';
import { parseAbi, type Hex } from 'viem';
import { entryPoint07Address } from 'viem/account-abstraction';

import { browser } from 'lib/browser';
import { reconcileAlchemySubmission } from 'lib/evm/alchemy/recovery';
import {
  ALCHEMY_SUBMISSION_PREFIX,
  getAlchemyCallId,
  getAlchemySubmission,
  getAlchemySubmissionKey,
  parseAlchemySubmission,
  type AlchemySubmission
} from 'lib/evm/alchemy/submission';
import type { AlchemyBatchQuote, AlchemySignedCalls } from 'lib/evm/alchemy/types';
import { getAlchemyMaxCost, getAlchemyOperation, validateAlchemyQuote } from 'lib/evm/alchemy/validation';
import { getViemPublicClient } from 'temple/evm';
import type { EvmChain } from 'temple/front';

const locks = new Map<string, Promise<unknown>>();
const activeKeys = new Set<string>();
let timer: ReturnType<typeof setTimeout> | undefined;

async function withSubmissionLock<T>(key: string, action: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const task = previous.catch(() => undefined).then(action);
  locks.set(key, task);
  try {
    return await task;
  } finally {
    if (locks.get(key) === task) locks.delete(key);
  }
}

const save = async (key: string, record: AlchemySubmission): Promise<void> => {
  await browser.storage.local.set({ [key]: record });
  if (record.result) activeKeys.delete(key);
  else activeKeys.add(key);
};

export async function checkAlchemyBatch(account: Hex, chainId: number): Promise<AlchemySubmission | undefined> {
  const key = getAlchemySubmissionKey(account, chainId);
  return withSubmissionLock(key, async () => {
    const record = await getAlchemySubmission(account, chainId);
    return record && reconcileAlchemySubmission(record, value => save(key, value));
  });
}

export async function completeAlchemyBatch(account: Hex, chainId: number, transactionHash: Hex): Promise<void> {
  const key = getAlchemySubmissionKey(account, chainId);
  await withSubmissionLock(key, async () => {
    const record = await getAlchemySubmission(account, chainId);
    if (!record) return;
    if (record.result?.status !== 'confirmed' || record.result.transactionHash !== transactionHash)
      throw new Error('The batch submission is unresolved. Retry the status check.');
    await browser.storage.local.remove(key);
    activeKeys.delete(key);
  });
}

export async function submitAlchemyBatch(
  account: Hex,
  network: EvmChain,
  quote: AlchemyBatchQuote,
  steps: LiFiStep[],
  sign: () => Promise<AlchemySignedCalls>
): Promise<AlchemySubmission> {
  const key = getAlchemySubmissionKey(account, network.chainId);
  return withSubmissionLock(key, async () => {
    let previous = await getAlchemySubmission(account, network.chainId);
    if (previous && previous.result?.status !== 'failed') {
      previous = await reconcileAlchemySubmission(previous, value => save(key, value), true);
      if (previous.result?.status === 'confirmed') return previous;
      if (previous.attempts.some(attempt => attempt.state === 'unknown' || attempt.state === 'queued'))
        throw new Error('The batch submission is unresolved. Retry the status check.');
      if (previous.result?.status !== 'failed') {
        if (
          BigInt(getAlchemyOperation(previous.quote.prepared).data.nonce) !==
            BigInt(getAlchemyOperation(quote.prepared).data.nonce) ||
          JSON.stringify(previous.quote.request) !== JSON.stringify(quote.request)
        )
          throw new Error('The batch nonce or calls changed. Retry the status check.');
        if (previous.attempts.some(attempt => attempt.id === getAlchemyCallId(getAlchemyOperation(quote.prepared))))
          return previous;
      }
    }
    validateAlchemyQuote(quote);
    const client = getViemPublicClient(network);
    const [balance, deposit] = await Promise.all([
      client.getBalance({ address: account }),
      client.readContract({
        address: entryPoint07Address,
        abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
        functionName: 'balanceOf',
        args: [account]
      })
    ]);
    if (balance < getAlchemyMaxCost(quote, deposit)) throw new Error('Insufficient balance for gas');
    const signed = await sign();
    const record: AlchemySubmission = {
      version: 2,
      quote,
      steps,
      attempts: [
        ...(previous?.result?.status === 'failed' ? [] : (previous?.attempts ?? [])),
        {
          signed,
          id: getAlchemyCallId(getAlchemyOperation(quote.prepared)),
          state: 'queued',
          checks: 0,
          nextCheckAt: 0
        }
      ]
    };
    // The background owns both persistence and submission, even after the popup closes.
    await save(key, record);
    scheduleRecovery();
    return reconcileAlchemySubmission(record, value => save(key, value), true);
  });
}

function scheduleRecovery(): void {
  if (!timer)
    timer = setTimeout(() => {
      timer = undefined;
      void recoverAlchemyBatches().catch(() => undefined);
    }, 3000);
}

async function recoverAlchemyBatches(): Promise<void> {
  for (const key of activeKeys) {
    try {
      await withSubmissionLock(key, async () => {
        const record = parseAlchemySubmission((await browser.storage.local.get(key))[key]);
        if (!record || record.result) {
          activeKeys.delete(key);
          return;
        }
        await reconcileAlchemySubmission(record, value => save(key, value));
      });
    } catch {
      // Keep unreadable records intact. The next review exposes the recovery error.
      activeKeys.delete(key);
    }
  }
  if (activeKeys.size) scheduleRecovery();
}

// Timers stop with the worker. Every new worker restores the durable submission records.
export function startAlchemyRecovery(): Promise<void> {
  return browser.storage.local
    .get(null)
    .then(stored => {
      for (const key of Object.keys(stored)) {
        if (key.startsWith(ALCHEMY_SUBMISSION_PREFIX)) activeKeys.add(key);
      }
      return recoverAlchemyBatches();
    })
    .catch(() => undefined);
}
