import { useCallback, useEffect, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { transform } from 'lodash';
import { useForm } from 'react-hook-form-v7';
import { useDebounce } from 'use-debounce';
import {
  FeeValuesEIP1559,
  FeeValuesLegacy,
  TransactionSerializable,
  formatEther,
  parseEther,
  serializeTransaction
} from 'viem';

import { getEvmBalancesChanges } from 'lib/evm/on-chain/get-evm-balances-changes';
import { useTypedSWR } from 'lib/swr';
import { StoredAccount } from 'lib/temple/types';
import { AccountForChain, getAccountAddressForEvm } from 'temple/accounts';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmEstimationData } from 'temple/evm/estimate';
import { useAllEvmChains } from 'temple/front';
import { BalancesChanges, TempleChainKind } from 'temple/types';

import { DEFAULT_INPUT_DEBOUNCE } from './constants';
import { useEvmEstimationDataState } from './context';
import { useEvmFeeOptions } from './hooks/use-evm-fee-options';
import { EvmTxParamsFormData, FeeOptionLabel, Tab } from './types';

const serializeBigint = (value: bigint | nullish) => (typeof value === 'bigint' ? value.toString() : undefined);

export const useEvmEstimationForm = (
  estimationData: EvmEstimationData | undefined,
  basicParams: TransactionSerializable | undefined,
  senderAccount: StoredAccount | AccountForChain<TempleChainKind.EVM>,
  chainId: number,
  simulateOperation?: boolean
) => {
  const accountAddress = useMemo(
    () => ('address' in senderAccount ? (senderAccount.address as HexString) : getAccountAddressForEvm(senderAccount)!),
    [senderAccount]
  );
  const chains = useAllEvmChains();
  const chain = chains[chainId];
  const defaultValues = useMemo<Partial<EvmTxParamsFormData>>(() => {
    if (!basicParams) return {};

    const { nonce, data } = basicParams;
    const rawGasPrice =
      basicParams.type === 'legacy' || basicParams.type === 'eip2930' || basicParams.gasPrice
        ? basicParams.gasPrice
        : basicParams.maxFeePerGas;
    let rawTransaction: string | undefined;
    try {
      rawTransaction = serializeTransaction(basicParams);
    } catch {
      // Do nothing
    }

    return {
      gasPrice: rawGasPrice ? formatEther(rawGasPrice, 'gwei') : undefined,
      gasLimit: serializeBigint(basicParams.gas),
      nonce: nonce?.toString(),
      data,
      rawTransaction
    };
  }, [basicParams]);
  const form = useForm<EvmTxParamsFormData>({ mode: 'onChange', defaultValues });
  const { watch, setValue, formState } = form;

  const gasPriceValue = watch('gasPrice');

  const [debouncedNonce] = useDebounce(watch('nonce'), DEFAULT_INPUT_DEBOUNCE);
  const [debouncedGasLimit] = useDebounce(watch('gasLimit'), DEFAULT_INPUT_DEBOUNCE);
  const [debouncedGasPrice] = useDebounce(gasPriceValue, DEFAULT_INPUT_DEBOUNCE);

  const [tab, setTab] = useState<Tab>('details');
  const [selectedFeeOption, setSelectedFeeOption] = useState<FeeOptionLabel | nullish>(
    defaultValues.gasPrice ? null : 'mid'
  );

  const feeOptions = useEvmFeeOptions(debouncedGasLimit, estimationData);
  const { setData } = useEvmEstimationDataState();

  useEffect(() => {
    if (estimationData && feeOptions) setData({ ...estimationData, feeOptions });
  }, [estimationData, feeOptions, setData]);

  useEffect(() => {
    if (gasPriceValue && selectedFeeOption) setSelectedFeeOption(null);
  }, [gasPriceValue, selectedFeeOption]);

  const feesPerGasFromBasicParams = useMemo(() => {
    if (!basicParams) {
      return null;
    }

    if (basicParams.gasPrice) {
      return { gasPrice: basicParams.gasPrice };
    }

    if (basicParams.maxFeePerGas && isDefined(basicParams.maxPriorityFeePerGas)) {
      return {
        maxFeePerGas: basicParams.maxFeePerGas,
        maxPriorityFeePerGas: basicParams.maxPriorityFeePerGas
      };
    }

    return null;
  }, [basicParams]);

  const getFeesPerGas = useCallback(
    (rawGasPrice: string): FeeValuesLegacy | FeeValuesEIP1559 | null => {
      if (!feeOptions) {
        return null;
      }

      if (!selectedFeeOption && !formState.touchedFields.gasPrice) {
        return feesPerGasFromBasicParams;
      }

      try {
        const parsedGasPrice = rawGasPrice ? parseEther(rawGasPrice, 'gwei') : null;
        const feeOptionValues = feeOptions.gasPrice[selectedFeeOption ?? 'mid'];

        return transform(
          feeOptionValues,
          (acc, value, key) => {
            if (typeof value === 'bigint' && parsedGasPrice) {
              // @ts-expect-error
              acc[key] = parsedGasPrice;
            }

            return acc;
          },
          { ...feeOptionValues }
        );
      } catch (e) {
        console.error(e);

        return null;
      }
    },
    [feeOptions, feesPerGasFromBasicParams, formState.touchedFields.gasPrice, selectedFeeOption]
  );

  const rawTransaction = useMemo(() => {
    if (!basicParams) return null;

    const feesPerGas = getFeesPerGas(debouncedGasPrice);
    const gas = debouncedGasLimit ? BigInt(debouncedGasLimit) : estimationData?.gas ?? basicParams.gas;
    const nonce = debouncedNonce ? Number(debouncedNonce) : estimationData?.nonce ?? basicParams.nonce;

    if (gas === undefined || nonce === undefined || !feesPerGas) return null;

    return serializeTransaction({
      ...basicParams,
      chainId,
      gas,
      nonce,
      ...feesPerGas
    } as TransactionSerializable);
  }, [basicParams, chainId, debouncedGasLimit, debouncedGasPrice, debouncedNonce, estimationData, getFeesPerGas]);
  useEffect(() => {
    if (rawTransaction) setValue('rawTransaction', rawTransaction);
  }, [rawTransaction, setValue]);

  const displayedFee = useMemo(() => {
    if (feeOptions && selectedFeeOption) return feeOptions.displayed[selectedFeeOption];

    if (estimationData && debouncedGasPrice) {
      const gas = debouncedGasLimit ? BigInt(debouncedGasLimit) : estimationData.gas;

      return formatEther(gas * parseEther(debouncedGasPrice, 'gwei'));
    }

    return '0';
  }, [feeOptions, selectedFeeOption, estimationData, debouncedGasPrice, debouncedGasLimit]);

  const handleFeeOptionSelect = useCallback(
    (label: FeeOptionLabel) => {
      setSelectedFeeOption(label);
      setValue('gasPrice', '', { shouldValidate: true });
    },
    [setValue]
  );

  const estimateBalancesChanges = useCallback(
    async (): Promise<BalancesChanges> =>
      basicParams ? getEvmBalancesChanges(basicParams, accountAddress, getReadOnlyEvmForNetwork(chain)) : {},
    [basicParams, chain, accountAddress]
  );
  const estimateBalancesChangesSwrKey = useMemo(
    () =>
      basicParams && simulateOperation
        ? ['estimate-evm-balances-changes', serializeTransaction(basicParams), chainId]
        : null,
    [basicParams, chainId, simulateOperation]
  );
  const { data: balancesChanges, isValidating: balancesChangesLoading } = useTypedSWR(
    estimateBalancesChangesSwrKey,
    estimateBalancesChanges,
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 10000, fallbackData: {} }
  );

  return {
    balancesChanges: balancesChanges!,
    balancesChangesLoading,
    form,
    tab,
    setTab,
    selectedFeeOption,
    handleFeeOptionSelect,
    feeOptions,
    displayedFee,
    getFeesPerGas
  };
};
