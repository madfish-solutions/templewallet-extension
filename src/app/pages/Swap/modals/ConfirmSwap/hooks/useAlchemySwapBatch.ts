import { useEffect, useRef, useState } from 'react';

import type { LiFiStep } from '@lifi/sdk';
import { formatUnits, type Hex } from 'viem';

import { prepareAlchemySwapBatch } from 'lib/evm/alchemy/prepare-batch';
import type { AlchemyBatchQuote, AlchemyFeeOption } from 'lib/evm/alchemy/types';
import { ALCHEMY_FEE_MULTIPLIERS, getAlchemyMaxFee, getAlchemyOperation } from 'lib/evm/alchemy/validation';
import { useTempleClient } from 'lib/temple/front';
import { DEFAULT_FEE_OPTION } from 'lib/temple/front/estimation-data-providers';
import type { EvmChain } from 'temple/front';

interface Params {
  steps: LiFiStep[];
  account: Hex;
  network: EvmChain;
}
interface BatchPreview {
  quote: AlchemyBatchQuote;
  steps: LiFiStep[];
}
type BatchState =
  | { phase: 'preparing'; preview?: BatchPreview }
  | { phase: 'error'; error: unknown }
  | { phase: 'ready' | 'pending' | 'expired'; quote: AlchemyBatchQuote; steps: LiFiStep[] };

function getBatchPreview(state: BatchState): BatchPreview | undefined {
  if ('quote' in state) return state;
  return state.phase === 'preparing' ? state.preview : undefined;
}

const scaleFeeValue = (value: bigint, from: AlchemyFeeOption, to: AlchemyFeeOption): bigint => {
  const fromPercent = BigInt(Math.round(ALCHEMY_FEE_MULTIPLIERS[from] * 100));
  const toPercent = BigInt(Math.round(ALCHEMY_FEE_MULTIPLIERS[to] * 100));
  return (value * toPercent + fromPercent - 1n) / fromPercent;
};

const getFeeOptions = (quote: AlchemyBatchQuote, decimals: number): Record<AlchemyFeeOption, string> => {
  const maxFee = getAlchemyMaxFee(quote.prepared);
  const formatOption = (option: AlchemyFeeOption) => {
    return formatUnits(scaleFeeValue(maxFee, quote.feeOption, option), decimals);
  };

  return { slow: formatOption('slow'), mid: formatOption('mid'), fast: formatOption('fast') };
};

export function useAlchemySwapBatch({ steps, account, network }: Params) {
  const { submitAlchemyBatch } = useTempleClient();
  const [state, setState] = useState<BatchState>({ phase: 'preparing' });
  const [callId, setCallId] = useState<Hex>();
  const callIdRef = useRef<Hex | undefined>(undefined);
  const [executing, setExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<unknown>();
  const [selectedFeeOption, setSelectedFeeOption] = useState<AlchemyFeeOption>(DEFAULT_FEE_OPTION);
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const mounted = useRef(true);
  const previousParams = useRef<Params | undefined>(undefined);
  const submitted = Boolean(callId);
  const preview = getBatchPreview(state);
  const quote = preview?.quote;
  const reviewSteps = preview?.steps ?? steps;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const previous = previousParams.current;
    const sameRequest = previous?.steps === steps && previous.account === account && previous.network === network;
    previousParams.current = { steps, account, network };
    // Preserve the current review during fee updates, but never submit this preview.
    setState(current => ({
      phase: 'preparing',
      preview: sameRequest ? getBatchPreview(current) : undefined
    }));
    setExecutionError(undefined);
    const prepare = async (): Promise<void> => {
      const batch = await prepareAlchemySwapBatch(steps, account, network, selectedFeeOption, controller.signal);
      if (!controller.signal.aborted) setState({ phase: 'ready', ...batch });
    };
    void prepare().catch(error => {
      if (!controller.signal.aborted) setState({ phase: 'error', error });
    });
    return () => controller.abort();
  }, [steps, account, network, revision, selectedFeeOption]);

  useEffect(() => {
    if (state.phase !== 'ready') return;
    const timer = setTimeout(
      () => setState(current => (current === state ? { ...state, phase: 'expired' } : current)),
      Math.max(0, state.quote.expiresAt - Date.now())
    );
    return () => clearTimeout(timer);
  }, [state]);

  const refresh = (): void => {
    if (!callIdRef.current) setRevision(value => value + 1);
  };
  const execute = async (): Promise<Hex | undefined> => {
    if (lock.current || state.phase === 'preparing') return;
    lock.current = true;
    setExecuting(true);
    setExecutionError(undefined);
    try {
      if (callIdRef.current) return callIdRef.current;
      if (state.phase !== 'ready' || Date.now() >= state.quote.expiresAt) {
        refresh();
        return;
      }
      const id = await submitAlchemyBatch(account, network, state.quote);
      callIdRef.current = id;
      if (mounted.current) {
        setCallId(id);
        setState({ ...state, phase: 'pending' });
      }
      return id;
    } catch (error) {
      if (mounted.current) setExecutionError(error);
      throw error;
    } finally {
      lock.current = false;
      if (mounted.current) setExecuting(false);
    }
  };

  const selectFeeOption = (option: AlchemyFeeOption): void => {
    if (!submitted && !executing) setSelectedFeeOption(option);
  };
  const feeOptions = quote ? getFeeOptions(quote, network.currency.decimals) : undefined;
  const operation = quote ? getAlchemyOperation(quote.prepared) : undefined;

  return {
    quote,
    reviewSteps,
    error: executionError ?? (state.phase === 'error' ? state.error : undefined),
    busy: executing || state.phase === 'preparing',
    submitted,
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
    execute
  };
}
