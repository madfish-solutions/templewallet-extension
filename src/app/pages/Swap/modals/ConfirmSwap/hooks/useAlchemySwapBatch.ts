import { useEffect, useRef, useState } from 'react';

import type { LiFiStep } from '@lifi/sdk';
import { formatUnits, numberToHex, type Hex } from 'viem';

import {
  getAlchemyCallsStatus,
  prepareAlchemyCalls,
  sendAlchemyCalls
} from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { browser } from 'lib/browser';
import { AlchemySubmission, getAlchemySubmission, getAlchemySubmissionKey } from 'lib/evm/alchemy/submission';
import { buildAlchemySwapCalls } from 'lib/evm/alchemy/swap';
import type { AlchemyBatchQuote } from 'lib/evm/alchemy/types';
import {
  ALCHEMY_QUOTE_LIFETIME,
  getAlchemyMaxFee,
  getAlchemyOperation,
  validateAlchemyPreparedCalls
} from 'lib/evm/alchemy/validation';
import { useTempleClient } from 'lib/temple/front';
import { delay } from 'lib/utils';
import type { EvmChain } from 'temple/front';

interface Params {
  steps?: LiFiStep[];
  account: Hex;
  network: EvmChain;
}

export function useAlchemySwapBatch({ steps, account, network }: Params) {
  const { signAlchemyBatch } = useTempleClient();
  const [quote, setQuote] = useState<AlchemyBatchQuote>();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [replacementReady, setReplacementReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [revision, setRevision] = useState(0);
  const submission = useRef<AlchemySubmission | undefined>(undefined);
  const lock = useRef(false);
  const mounted = useRef(true);
  const key = getAlchemySubmissionKey(account, network.chainId);

  const saveSubmission = async (value: AlchemySubmission): Promise<void> => {
    // Save the signature before submission so a lost response cannot create a second swap.
    await browser.storage.local.set({ [key]: value });
    submission.current = value;
    setSubmitted(true);
    setReplacementReady(false);
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!steps) return;
    const controller = new AbortController();
    setBusy(true);
    setQuote(undefined);
    setError(undefined);
    setExpired(false);
    setReplacementReady(false);
    const prepare = async (): Promise<void> => {
      const stored = await getAlchemySubmission(account, network.chainId);
      if (controller.signal.aborted) return;
      if (stored) {
        if (stored.version !== 1) throw new Error('Unsupported batch recovery record');
        submission.current = stored;
        setSubmitted(true);
        setQuote(stored.quote);
        return;
      }
      const { calls } = await buildAlchemySwapCalls(steps, account, network, controller.signal);
      const request = { from: account, chainId: numberToHex(network.chainId), calls };
      const prepared = await prepareAlchemyCalls(request, controller.signal);
      validateAlchemyPreparedCalls(prepared, request);
      if (!controller.signal.aborted) setQuote({ request, prepared, expiresAt: Date.now() + ALCHEMY_QUOTE_LIFETIME });
    };
    void prepare()
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [steps, account, network, revision, key]);

  useEffect(() => {
    if (!quote || submitted) return;
    const timer = setTimeout(() => setExpired(true), Math.max(0, quote.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [quote, submitted]);

  const refresh = (): void => {
    setRevision(value => value + 1);
  };

  const findReceipt = async (): Promise<Hex | undefined> => {
    let current = submission.current;
    if (!current) return;
    let pending = false;
    let statusError: unknown;
    for (const [index, attempt] of current.attempts.entries()) {
      try {
        let callId = attempt.id;
        if (!callId) {
          // A lost response must reuse the identical signature and nonce.
          const { id } = await sendAlchemyCalls(attempt.signed);
          callId = id;
          current = {
            ...current,
            attempts: current.attempts.map((value, i) => (i === index ? { ...value, id } : value))
          };
          await saveSubmission(current);
        }
        const status = await getAlchemyCallsStatus(callId);
        if (BigInt(status.chainId) !== BigInt(current.quote.request.chainId))
          throw new Error('Alchemy status chain mismatch');
        if (status.status === 200) {
          const receipt = status.receipts?.[0];
          if (!status.atomic || receipt?.status !== '0x1' || !receipt.transactionHash)
            throw new Error('The Alchemy batch failed');
          return receipt.transactionHash;
        }
        if (status.status >= 100 && status.status < 200) pending = true;
        else if (status.status !== 400 && status.status !== 500) {
          throw new Error('Alchemy returned a partial or unknown batch status. Retry the status check.');
        }
      } catch (cause) {
        statusError = cause;
      }
    }
    if (statusError) throw statusError;
    if (!pending) {
      await browser.storage.local.remove(key);
      submission.current = undefined;
      setSubmitted(false);
      setQuote(undefined);
      throw new Error('The Alchemy batch failed. Retry to review a new quote.');
    }
    return undefined;
  };

  const execute = async (): Promise<Hex | undefined> => {
    if (!steps || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    try {
      if (!quote || (!submission.current && Date.now() >= quote.expiresAt)) {
        refresh();
        return;
      }
      if (submission.current) {
        const hash = await findReceipt();
        if (hash) return hash;
        // Alchemy selects the pending nonce and raises the replacement gas price.
        const prepared = await prepareAlchemyCalls(submission.current.quote.request);
        validateAlchemyPreparedCalls(prepared, submission.current.quote.request);
        if (
          getAlchemyOperation(prepared).data.nonce !== getAlchemyOperation(submission.current.quote.prepared).data.nonce
        ) {
          throw new Error('The batch nonce changed. Retry the status check.');
        }
        if (quote === submission.current.quote || Date.now() >= quote.expiresAt) {
          setQuote({
            request: submission.current.quote.request,
            prepared,
            expiresAt: Date.now() + ALCHEMY_QUOTE_LIFETIME
          });
          setExpired(false);
          setReplacementReady(true);
          return;
        }
      }
      const signed = await signAlchemyBatch(account, network, quote);
      const current: AlchemySubmission = {
        version: 1,
        steps,
        quote,
        attempts: [...(submission.current?.attempts ?? []), { signed }]
      };
      await saveSubmission(current);
      for (let attempt = 0; attempt < 30; attempt++) {
        const hash = await findReceipt();
        if (hash) return hash;
        if (!mounted.current) return;
        await delay(2000);
      }
      throw new Error('The batch is pending. Retry to check its status and review a replacement fee.');
    } catch (cause) {
      setError(cause);
      throw cause;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const complete = async (): Promise<void> => {
    await browser.storage.local.remove(key);
    submission.current = undefined;
    setSubmitted(false);
  };

  return {
    enabled: Boolean(steps),
    quote,
    error,
    busy,
    submitted,
    replacementReady,
    expired,
    fee: quote ? formatUnits(getAlchemyMaxFee(quote.prepared), network.currency.decimals) : undefined,
    refresh,
    execute,
    complete
  };
}
