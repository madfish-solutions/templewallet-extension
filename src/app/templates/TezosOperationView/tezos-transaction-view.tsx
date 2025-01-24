import React, { memo, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { nanoid } from 'nanoid';
import { FormProvider } from 'react-hook-form-v7';

import { toastError } from 'app/toaster';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTypedSWR } from 'lib/swr';
import { mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { TempleTezosDAppOperationsPayload } from 'lib/temple/types';
import { serializeError } from 'lib/utils/serialize-error';
import { getAccountAddressForTezos } from 'temple/accounts';
import { TezosChain, useAllAccounts, useAllTezosChains } from 'temple/front';
import { StoredTezosNetwork } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { OperationViewLayout } from '../operation-view-layout';
import { TezosTxParamsFormData } from '../TransactionTabs/types';
import { useTezosEstimationForm } from '../TransactionTabs/use-tezos-estimation-form';

export interface TezosTransactionViewProps {
  payload: TempleTezosDAppOperationsPayload;
  formId: string;
  error: any;
  setTotalFee: SyncFn<number>;
  setStorageLimit: SyncFn<number>;
  onSubmit: EmptyFn;
}

export const TezosTransactionView = memo<TezosTransactionViewProps>(
  ({ payload, formId, error: submitError, setTotalFee, setStorageLimit, onSubmit }) => {
    const { networkRpc, opParams, sourcePkh, estimates, error: estimationError } = payload;
    const tezosChains = useAllTezosChains();
    const accounts = useAllAccounts();
    const sendingAccount = useMemo(
      () => accounts.find(acc => getAccountAddressForTezos(acc) === sourcePkh)!,
      [accounts, sourcePkh]
    );

    const estimationData = useMemo(() => {
      if (!estimates) return undefined;

      const revealFeeMutez = new BigNumber(estimates.length > opParams.length ? estimates[0].suggestedFeeMutez : 0);

      return {
        estimates,
        baseFee: mutezToTz(BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez + est.burnFeeMutez))),
        gasFee: mutezToTz(BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez))),
        revealFee: revealFeeMutez
      };
    }, [estimates, opParams.length]);

    const getTezosChain = useCallback(async (): Promise<TezosChain> => {
      const knownTezosChain = Object.values(tezosChains).find(c =>
        c.allRpcs.some(rpc => rpc.rpcBaseURL === networkRpc)
      );

      if (knownTezosChain) {
        return knownTezosChain;
      }

      const tezos = getReadOnlyTezos(networkRpc);
      const chainId = await tezos.rpc.getChainId();
      const rpc: StoredTezosNetwork = {
        chain: TempleChainKind.Tezos,
        chainId,
        id: nanoid(),
        rpcBaseURL: networkRpc,
        name: networkRpc,
        color: '#000000'
      };

      return {
        rpc,
        allRpcs: [rpc],
        kind: TempleChainKind.Tezos,
        chainId,
        rpcBaseURL: networkRpc,
        name: networkRpc,
        allBlockExplorers: [],
        default: false
      };
    }, [networkRpc, tezosChains]);
    const { data: chain } = useTypedSWR(['tezos-chain', networkRpc], getTezosChain, {
      suspense: true,
      revalidateOnFocus: false,
      shouldRetryOnError: false
    });

    const {
      balancesChanges: balancesChanges,
      balancesChangesLoading,
      form,
      tab,
      setTab,
      selectedFeeOption,
      getFeeParams,
      handleFeeOptionSelect,
      displayedFeeOptions,
      displayedFee,
      displayedStorageFee
    } = useTezosEstimationForm(estimationData, opParams, sendingAccount, networkRpc, chain!.chainId, true);

    const handleSubmit = useCallback(
      ({ gasFee: customGasFee, storageLimit: customStorageLimit }: TezosTxParamsFormData) => {
        const { gasFee, storageLimit } = getFeeParams(customGasFee, customStorageLimit);

        if (!gasFee) {
          toastError('Failed to estimate transaction.');

          return;
        }

        setTotalFee(tzToMutez(gasFee).toNumber());
        setStorageLimit(storageLimit.toNumber());
        onSubmit();
      },
      [getFeeParams, onSubmit, setStorageLimit, setTotalFee]
    );

    const displayedEstimationError = useMemo(() => serializeError(estimationError), [estimationError]);
    const displayedSubmitError = useMemo(() => serializeError(submitError), [submitError]);

    return (
      <FormProvider {...form}>
        <OperationViewLayout
          network={chain!}
          nativeAssetSlug={TEZ_TOKEN_SLUG}
          selectedTab={tab}
          setSelectedTab={setTab}
          selectedFeeOption={selectedFeeOption}
          latestSubmitError={displayedSubmitError}
          estimationError={displayedEstimationError}
          onFeeOptionSelect={handleFeeOptionSelect}
          onSubmit={handleSubmit}
          displayedFee={displayedFee}
          displayedFeeOptions={displayedFeeOptions}
          displayedStorageFee={displayedStorageFee}
          formId={formId}
          tabsName="confirm-send-tabs"
          destinationName={null}
          destinationValue={null}
          sendingAccount={sendingAccount}
          balancesChanges={balancesChanges}
          balancesChangesLoading={balancesChangesLoading}
        />
      </FormProvider>
    );
  }
);
