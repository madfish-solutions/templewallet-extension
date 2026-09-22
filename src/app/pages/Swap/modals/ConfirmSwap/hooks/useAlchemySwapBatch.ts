import { useEffect, useRef, useState } from 'react';

import type { LiFiStep } from '@lifi/sdk';
import { formatUnits, numberToHex, type Hex } from 'viem';

import { AlchemyRpcError, prepareAlchemyCalls } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { browser } from 'lib/browser';
import {
  getAlchemySubmission,
  getAlchemySubmissionKey,
  parseAlchemySubmission,
  type AlchemySubmission
} from 'lib/evm/alchemy/submission';
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
  steps: LiFiStep[];
  account: Hex;
  network: EvmChain;
}
type BatchState =
  | { phase: 'preparing' }
  | { phase: 'error'; error: unknown }
  | { phase: 'pending' }
  | { phase: 'ready' | 'replacement' | 'expired'; quote: AlchemyBatchQuote; steps: LiFiStep[] };

const scaleFeeValue = (value: bigint, from: AlchemyFeeOption, to: AlchemyFeeOption): bigint => {
  const fromPercent = BigInt(Math.round(ALCHEMY_FEE_MULTIPLIERS[from] * 100));
  const toPercent = BigInt(Math.round(ALCHEMY_FEE_MULTIPLIERS[to] * 100));
  return (value * toPercent + fromPercent - 1n) / fromPercent;
};

export function useAlchemySwapBatch({ steps, account, network }: Params) {
  const { submitAlchemyBatch, checkAlchemyBatch, completeAlchemyBatch } = useTempleClient();
  const [state, setState] = useState<BatchState>({ phase: 'preparing' });
  const [submission, setSubmission] = useState<AlchemySubmission>();
  const [executing, setExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<unknown>();
  const [selectedFeeOption, setSelectedFeeOption] = useState<AlchemyFeeOption>('mid');
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const mounted = useRef(true);
  const key = getAlchemySubmissionKey(account, network.chainId);
  const submitted = Boolean(submission && submission.result?.status !== 'failed');
  const activeSubmission = submitted ? submission : undefined;
  const quote = 'quote' in state ? state.quote : activeSubmission?.quote;
  const reviewSteps = 'steps' in state ? state.steps : (activeSubmission?.steps ?? steps);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area !== 'local' || !changes[key]) return;
      try {
        setSubmission(parseAlchemySubmission(changes[key].newValue));
      } catch (error) {
        setState({ phase: 'error', error });
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [key]);

  useEffect(() => {
    const controller = new AbortController();
    setState({ phase: 'preparing' });
    setExecutionError(undefined);
    const prepare = async (): Promise<void> => {
      const stored = await getAlchemySubmission(account, network.chainId);
      if (controller.signal.aborted) return;
      setSubmission(stored);
      if (stored && stored.result?.status !== 'failed') {
        setSelectedFeeOption(stored.quote.feeOption);
        setState({ phase: 'pending' });
        return;
      }
      const result = await buildAlchemySwapCalls(steps, account, network, controller.signal);
      const request = addAlchemyGasParamsOverride(
        { from: account, chainId: numberToHex(network.chainId), calls: result.calls },
        selectedFeeOption
      );
      const prepared = await prepareAlchemyCalls(request, controller.signal);
      validateAlchemyPreparedCalls(prepared, request);
      if (!controller.signal.aborted)
        setState({
          phase: 'ready',
          steps: result.steps,
          quote: {
            request,
            prepared,
            expiresAt: Date.now() + ALCHEMY_QUOTE_LIFETIME,
            feeOption: selectedFeeOption
          }
        });
    };
    void prepare().catch(error => {
      if (!controller.signal.aborted) setState({ phase: 'error', error });
    });
    return () => controller.abort();
  }, [steps, account, network, revision, selectedFeeOption]);

  useEffect(() => {
    if (state.phase !== 'ready' && state.phase !== 'replacement') return;
    const timer = setTimeout(
      () => setState(current => (current === state ? { ...state, phase: 'expired' } : current)),
      Math.max(0, state.quote.expiresAt - Date.now())
    );
    return () => clearTimeout(timer);
  }, [state]);

  const refresh = (): void => {
    setRevision(value => value + 1);
  };
  const execute = async (): Promise<Hex | undefined> => {
    if (lock.current) return;
    lock.current = true;
    setExecuting(true);
    setExecutionError(undefined);
    try {
      let stored = await checkAlchemyBatch(account, network.chainId);
      setSubmission(stored);
      if (stored?.result?.status === 'confirmed') return stored.result.transactionHash;
      if (stored && stored.result?.status !== 'failed') {
        if (stored.attempts.some(attempt => attempt.state === 'unknown' || attempt.state === 'queued'))
          throw new Error('The batch submission is unresolved. Retry the status check.');
        if (state.phase !== 'replacement' || Date.now() >= state.quote.expiresAt) {
          const prepared = await prepareAlchemyCalls(stored.quote.request);
          validateAlchemyPreparedCalls(prepared, stored.quote.request);
          if (
            BigInt(getAlchemyOperation(prepared).data.nonce) !==
            BigInt(getAlchemyOperation(stored.quote.prepared).data.nonce)
          )
            throw new Error('The batch nonce changed. Retry the status check.');
          setState({
            phase: 'replacement',
            steps: stored.steps,
            quote: {
              ...stored.quote,
              prepared,
              expiresAt: Date.now() + ALCHEMY_QUOTE_LIFETIME
            }
          });
          return;
        }
      } else if (state.phase !== 'ready' || Date.now() >= state.quote.expiresAt) {
        refresh();
        return;
      }
      if (!('quote' in state)) return;
      stored = await submitAlchemyBatch(account, network, state.quote, state.steps);
      setSubmission(stored);
      setState({ phase: 'pending' });
      // Only read local results here. The background owns all network status checks.
      for (let attempt = 0; attempt < 45; attempt++) {
        if (stored?.result?.status === 'confirmed') return stored.result.transactionHash;
        if (stored?.result?.status === 'failed')
          throw stored.error?.code !== undefined
            ? new AlchemyRpcError(stored.error.code, stored.error.message, stored.error.data)
            : new Error(stored.error?.message ?? 'The Alchemy batch failed. Retry to review a new quote.');
        if (!mounted.current) return;
        await delay(1000);
        stored = await getAlchemySubmission(account, network.chainId);
      }
      throw new Error('The batch is pending. Retry to check its status and review a replacement fee.');
    } catch (error) {
      setExecutionError(error);
      throw error;
    } finally {
      lock.current = false;
      setExecuting(false);
    }
  };

  const complete = async (transactionHash: Hex): Promise<void> => {
    await completeAlchemyBatch(account, network.chainId, transactionHash);
    setSubmission(undefined);
  };

  const selectFeeOption = (option: AlchemyFeeOption): void => {
    if (!submitted && !executing && state.phase !== 'preparing') setSelectedFeeOption(option);
  };
  const feeOptions = quote
    ? (Object.fromEntries(
        (Object.keys(ALCHEMY_FEE_MULTIPLIERS) as AlchemyFeeOption[]).map(option => [
          option,
          formatUnits(
            scaleFeeValue(getAlchemyMaxFee(quote.prepared), quote.feeOption, option),
            network.currency.decimals
          )
        ])
      ) as Record<AlchemyFeeOption, string>)
    : undefined;
  const operation = quote ? getAlchemyOperation(quote.prepared) : undefined;

  return {
    quote,
    reviewSteps,
    error: executionError ?? (state.phase === 'error' ? state.error : undefined),
    busy: executing || state.phase === 'preparing',
    submitted,
    replacementReady: state.phase === 'replacement',
    expired: state.phase === 'expired',
    selectedFeeOption,
    selectFeeOption,
    feeOptions,
    fee: feeOptions?.[selectedFeeOption],
    gasPrice: operation ? formatUnits(BigInt(operation.data.maxFeePerGas), 9) : undefined,
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
    checkSubmission: () => checkAlchemyBatch(account, network.chainId),
    execute,
    complete
  };
}
