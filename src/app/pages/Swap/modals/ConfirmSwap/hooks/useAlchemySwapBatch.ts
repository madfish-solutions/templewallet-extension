import { useEffect, useRef, useState } from 'react';

import type { LiFiStep } from '@lifi/sdk';
import { formatUnits, numberToHex, type Hex } from 'viem';

import {
  AlchemyRpcError,
  getAlchemyCallsStatus,
  prepareAlchemyCalls,
  sendAlchemyCalls
} from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { browser } from 'lib/browser';
import { AlchemySubmission, getAlchemySubmission, getAlchemySubmissionKey } from 'lib/evm/alchemy/submission';
import { buildAlchemySwapCalls } from 'lib/evm/alchemy/swap';
import type { AlchemyBatchQuote, AlchemyFeeOption } from 'lib/evm/alchemy/types';
import {
  ALCHEMY_FEE_MULTIPLIERS,
  ALCHEMY_QUOTE_LIFETIME,
  addAlchemyGasParamsOverride,
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

const feeMultiplierPercent: Record<AlchemyFeeOption, number> = { slow: 100, mid: 105, fast: 110 };

const scaleFeeValue = (value: bigint, from: AlchemyFeeOption, to: AlchemyFeeOption): bigint =>
  (value * BigInt(feeMultiplierPercent[to]) + BigInt(feeMultiplierPercent[from] - 1)) /
  BigInt(feeMultiplierPercent[from]);

const isDefinitiveAlchemyRejection = (error: unknown): error is AlchemyRpcError =>
  error instanceof AlchemyRpcError &&
  error.code !== 429 &&
  !/unavailable|rate limit|replacement underpriced|already known/i.test(error.message);

export function useAlchemySwapBatch({ steps, account, network }: Params) {
  const { signAlchemyBatch } = useTempleClient();
  const [quote, setQuote] = useState<AlchemyBatchQuote>();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [replacementReady, setReplacementReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [selectedFeeOption, setSelectedFeeOption] = useState<AlchemyFeeOption>('mid');
  const [revision, setRevision] = useState(0);
  const submission = useRef<AlchemySubmission | undefined>(undefined);
  const currentQuote = useRef<AlchemyBatchQuote | undefined>(undefined);
  const selectedFeeOptionRef = useRef<AlchemyFeeOption>('mid');
  const preparationController = useRef<AbortController | undefined>(undefined);
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
      preparationController.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!steps) return;
    const controller = new AbortController();
    preparationController.current?.abort();
    preparationController.current = controller;
    setBusy(true);
    setQuote(undefined);
    currentQuote.current = undefined;
    setError(undefined);
    setExpired(false);
    setReplacementReady(false);
    const prepare = async (): Promise<void> => {
      const stored = await getAlchemySubmission(account, network.chainId);
      if (controller.signal.aborted) return;
      if (stored) {
        submission.current = stored;
        setSubmitted(true);
        setSelectedFeeOption(stored.quote.feeOption);
        selectedFeeOptionRef.current = stored.quote.feeOption;
        setQuote(stored.quote);
        currentQuote.current = stored.quote;
        return;
      }
      const { calls } = await buildAlchemySwapCalls(steps, account, network, controller.signal);
      const request = addAlchemyGasParamsOverride(
        { from: account, chainId: numberToHex(network.chainId), calls },
        selectedFeeOptionRef.current
      );
      const prepared = await prepareAlchemyCalls(request, controller.signal);
      validateAlchemyPreparedCalls(prepared, request);
      if (!controller.signal.aborted) {
        const nextQuote = {
          request,
          prepared,
          expiresAt: Date.now() + ALCHEMY_QUOTE_LIFETIME,
          feeOption: selectedFeeOptionRef.current
        };
        setQuote(nextQuote);
        currentQuote.current = nextQuote;
      }
    };
    void prepare()
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause);
      })
      .finally(() => {
        if (!controller.signal.aborted && preparationController.current === controller) setBusy(false);
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
      let callId = attempt.id;
      try {
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
        if (!callId && isDefinitiveAlchemyRejection(cause)) {
          const attempts = current.attempts.filter((_, i) => i !== index);
          if (attempts.length) {
            current = { ...current, attempts };
            await saveSubmission(current);
          } else {
            await browser.storage.local.remove(key);
            submission.current = undefined;
            setSubmitted(false);
            setQuote(undefined);
          }
          throw cause;
        }
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
            expiresAt: Date.now() + ALCHEMY_QUOTE_LIFETIME,
            feeOption: submission.current.quote.feeOption
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

  const selectFeeOption = (feeOption: AlchemyFeeOption): void => {
    const previousQuote = currentQuote.current;
    if (submitted || busy || !previousQuote || feeOption === selectedFeeOption) return;

    setSelectedFeeOption(feeOption);
    selectedFeeOptionRef.current = feeOption;
    setError(undefined);
    const controller = new AbortController();
    preparationController.current?.abort();
    preparationController.current = controller;
    setBusy(true);

    const request = addAlchemyGasParamsOverride(
      {
        from: previousQuote.request.from,
        chainId: previousQuote.request.chainId,
        calls: previousQuote.request.calls
      },
      feeOption
    );

    void prepareAlchemyCalls(request, controller.signal)
      .then(prepared => {
        validateAlchemyPreparedCalls(prepared, request);
        if (controller.signal.aborted) return;

        const nextQuote = {
          request,
          prepared,
          expiresAt: Date.now() + ALCHEMY_QUOTE_LIFETIME,
          feeOption
        };
        setQuote(nextQuote);
        currentQuote.current = nextQuote;
        setExpired(false);
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause);
      })
      .finally(() => {
        if (!controller.signal.aborted && preparationController.current === controller) setBusy(false);
      });
  };

  const feeOptions = (() => {
    if (!quote) return undefined;
    const selectedFee = getAlchemyMaxFee(quote.prepared);

    return Object.fromEntries(
      (Object.keys(ALCHEMY_FEE_MULTIPLIERS) as AlchemyFeeOption[]).map(option => [
        option,
        formatUnits(scaleFeeValue(selectedFee, quote.feeOption, option), network.currency.decimals)
      ])
    ) as Record<AlchemyFeeOption, string>;
  })();

  const operation = quote ? getAlchemyOperation(quote.prepared) : undefined;

  return {
    enabled: Boolean(steps),
    quote,
    error,
    busy,
    submitted,
    replacementReady,
    expired,
    selectedFeeOption,
    selectFeeOption,
    feeOptions,
    fee: feeOptions?.[selectedFeeOption],
    gasPrice:
      operation && quote
        ? formatUnits(scaleFeeValue(BigInt(operation.data.maxFeePerGas), quote.feeOption, selectedFeeOption), 9)
        : undefined,
    advancedValues: operation
      ? {
          gasLimit: BigInt(operation.data.callGasLimit).toString(),
          nonce: BigInt(operation.data.nonce).toString(),
          data: operation.data.callData,
          rawTransaction: JSON.stringify(
            { type: operation.type, chainId: operation.chainId, data: operation.data },
            null,
            2
          )
        }
      : undefined,
    delegationRequired: quote?.prepared.type === 'array',
    refresh,
    execute,
    complete
  };
}
