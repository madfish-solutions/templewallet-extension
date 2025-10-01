import React, { memo, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { nanoid } from 'nanoid';
import { FormProvider } from 'react-hook-form-v7';

import { toastError } from 'app/toaster';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { useTezosGenericAssetsMetadataLoading } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { TezosEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { TempleTezosDAppOperationsPayload } from 'lib/temple/types';
import { tezosManagerKeyHasManager } from 'lib/tezos';
import { serializeError } from 'lib/utils/serialize-error';
import { getAccountAddressForTezos } from 'temple/accounts';
import { TezosChain, useAllAccounts, useAllTezosChains } from 'temple/front';
import { StoredTezosNetwork } from 'temple/networks';
import { getReadOnlyTezosForNetwork } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { OperationViewLayout } from './operation-view-layout';
import { TezosTxParamsFormData } from './TransactionTabs/types';
import { useTezosEstimationForm } from './TransactionTabs/use-tezos-estimation-form';

interface TezosTransactionViewProps {
  payload: TempleTezosDAppOperationsPayload;
  formId: string;
  error: any;
  setTotalFee: SyncFn<number>;
  setStorageLimit: SyncFn<number>;
  onSubmit: EmptyFn;
}

export const TezosTransactionView = memo<TezosTransactionViewProps>(
  ({ payload, formId, error, setTotalFee, setStorageLimit, onSubmit }) => (
    <TezosEstimationDataProvider>
      <TezosTransactionViewBody
        error={error}
        payload={payload}
        formId={formId}
        setTotalFee={setTotalFee}
        setStorageLimit={setStorageLimit}
        onSubmit={onSubmit}
      />
    </TezosEstimationDataProvider>
  )
);

const TezosTransactionViewBody = memo<TezosTransactionViewProps>(
  ({ payload, formId, error: submitError, setTotalFee, setStorageLimit, onSubmit }) => {
    const { network, opParams, sourcePkh, estimates, error: estimationError } = payload;
    const tezosChains = useAllTezosChains();
    const accounts = useAllAccounts();
    const sendingAccount = useMemo(
      () => accounts.find(acc => getAccountAddressForTezos(acc) === sourcePkh)!,
      [accounts, sourcePkh]
    );
    const metadataLoading = useTezosGenericAssetsMetadataLoading();

    const estimationData = useMemo(() => {
      if (!estimates) return undefined;

      const revealFeeMutez = mutezToTz(estimates.length > opParams.length ? estimates[0].suggestedFeeMutez : 0);

      return {
        estimates,
        baseFee: mutezToTz(BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez + est.burnFeeMutez))),
        gasFee: mutezToTz(BigNumber.sum(...estimates.map(est => est.suggestedFeeMutez))),
        revealFee: revealFeeMutez
      };
    }, [estimates, opParams.length]);

    const tezos = useMemo(() => getReadOnlyTezosForNetwork(network), [network]);

    const getTezosChain = useCallback(async (): Promise<TezosChain> => {
      const knownTezosChain = Object.values(tezosChains).find(c =>
        c.allRpcs.some(rpc => rpc.chainId === network.chainId)
      );

      if (knownTezosChain) {
        return knownTezosChain;
      }

      const rpc: StoredTezosNetwork = {
        chain: TempleChainKind.Tezos,
        chainId: network.chainId,
        id: nanoid(),
        rpcBaseURL: network.rpcBaseURL,
        name: network.rpcBaseURL,
        color: '#000000'
      };

      return {
        rpc,
        allRpcs: [rpc],
        kind: TempleChainKind.Tezos,
        chainId: network.chainId,
        rpcBaseURL: network.rpcBaseURL,
        name: network.rpcBaseURL,
        allBlockExplorers: [],
        default: false
      };
    }, [network, tezosChains]);
    const { data: chain } = useTypedSWR(['tezos-chain', network.chainId], getTezosChain, {
      suspense: true,
      revalidateOnFocus: false,
      shouldRetryOnError: false
    });

    const getSourcePkIsRevealed = useCallback(async () => {
      try {
        return tezosManagerKeyHasManager(await tezos.rpc.getManagerKey(sourcePkh));
      } catch (e) {
        console.error(e);

        return false;
      }
    }, [sourcePkh, tezos]);
    const { data: sourcePkIsRevealed } = useTypedSWR(
      ['source-pk-is-revealed', sourcePkh, network.chainId],
      getSourcePkIsRevealed,
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: TEZOS_BLOCK_DURATION,
        suspense: true
      }
    );

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
    } = useTezosEstimationForm({
      estimationData,
      basicParams: opParams,
      senderAccount: sendingAccount,
      network,
      simulateOperation: true,
      sourcePkIsRevealed
    });

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
          metadataLoading={metadataLoading}
          otherDataLoading={balancesChangesLoading}
        />
      </FormProvider>
    );
  }
);
