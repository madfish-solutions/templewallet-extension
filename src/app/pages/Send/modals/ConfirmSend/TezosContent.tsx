import React, { FC, useCallback, useState } from 'react';

import { OpKind, TransferParams, WalletParamsWithKind } from '@taquito/taquito';
import { FormProvider } from 'react-hook-form-v7';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { TezosReviewData } from 'app/pages/Send/form/interfaces';
import { useTezosEstimationData } from 'app/pages/Send/hooks/use-tezos-estimation-data';
import { TezosTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useTezosEstimationForm } from 'app/templates/TransactionTabs/use-tezos-estimation-form';
import { toastError, toastSuccess } from 'app/toaster';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useTezosAssetBalance } from 'lib/balances';
import { t } from 'lib/i18n';
import { useCategorizedTezosAssetMetadata } from 'lib/metadata';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { useTypedSWR } from 'lib/swr';
import { loadContract } from 'lib/temple/contract';
import { tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { isTezosContractAddress } from 'lib/tezos';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { ZERO } from 'lib/utils/numbers';
import { getTezosToolkitWithSigner } from 'temple/front';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';

import { BaseContent } from './BaseContent';

interface TezosContentProps {
  data: TezosReviewData;
  onClose: EmptyFn;
}

export const TezosContent: FC<TezosContentProps> = ({ data, onClose }) => {
  const { account, network, assetSlug, to, amount, onConfirm } = data;
  const { rpcBaseURL, chainId } = network;

  const assetMetadata = useCategorizedTezosAssetMetadata(assetSlug, network.chainId);

  if (!assetMetadata) throw new Error('Metadata not found');

  const accountPkh = account.address;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const { value: balance = ZERO } = useTezosAssetBalance(assetSlug, accountPkh, network);
  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const getActiveBlockExplorer = useGetTezosActiveBlockExplorer();

  const tezos = getTezosToolkitWithSigner(rpcBaseURL, account.ownerAddress || accountPkh, true);

  const { data: estimationData } = useTezosEstimationData(
    to,
    tezos,
    chainId,
    account,
    accountPkh,
    assetSlug,
    balance,
    tezBalance,
    assetMetadata,
    true
  );

  const getBasicSendParams = useCallback(async (): Promise<WalletParamsWithKind[]> => {
    let transferParams: TransferParams;

    if (isTezosContractAddress(accountPkh)) {
      const michelsonLambda = isTezosContractAddress(to) ? transferToContract : transferImplicit;

      const contract = await loadContract(tezos, accountPkh);
      transferParams = contract.methodsObject.do(michelsonLambda(to, tzToMutez(amount))).toTransferParams();
    } else {
      transferParams = await toTransferParams(tezos, assetSlug, assetMetadata, accountPkh, to, amount);
    }

    return [
      {
        kind: OpKind.TRANSACTION,
        ...transferParams
      }
    ];
  }, [accountPkh, amount, assetMetadata, assetSlug, tezos, to]);

  const { data: basicSendParams } = useTypedSWR(
    ['tezos-basic-send-params', accountPkh, amount, assetSlug, to, rpcBaseURL, account.ownerAddress],
    getBasicSendParams
  );

  const {
    form,
    tab,
    setTab,
    selectedFeeOption,
    handleFeeOptionSelect,
    submitOperation,
    displayedFeeOptions,
    displayedFee,
    displayedStorageFee
  } = useTezosEstimationForm({
    estimationData,
    basicParams: basicSendParams,
    senderAccount: account,
    rpcBaseURL,
    chainId
  });
  const { formState } = form;

  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

  const onSubmit = useCallback(
    async ({ gasFee, storageLimit }: TezosTxParamsFormData) => {
      try {
        if (formState.isSubmitting) return;

        if (!estimationData || !displayedFeeOptions) {
          toastError('Failed to estimate transaction.');

          return;
        }

        const doOperation = async () => {
          const operation = await submitOperation(
            tezos,
            gasFee,
            storageLimit,
            estimationData.revealFee,
            displayedFeeOptions
          );

          onConfirm();
          onClose();

          // @ts-expect-error
          const txHash = operation?.hash || operation?.opHash;

          const blockExplorer = getActiveBlockExplorer(network.chainId);

          setTimeout(
            () =>
              toastSuccess(t('transactionSubmitted'), true, { hash: txHash, explorerBaseUrl: blockExplorer.url + '/' }),
            CLOSE_ANIMATION_TIMEOUT * 2
          );
        };

        if (isLedgerAccount) {
          await runConnectedLedgerOperationFlow(doOperation, setLedgerApprovalModalState, true);
        } else {
          await doOperation();
        }
      } catch (err: any) {
        console.error(err);

        setLatestSubmitError(err.errors ? JSON.stringify(err.errors) : err.message);
        setTab('error');
      }
    },
    [
      displayedFeeOptions,
      estimationData,
      formState.isSubmitting,
      isLedgerAccount,
      setLedgerApprovalModalState,
      getActiveBlockExplorer,
      network.chainId,
      onClose,
      onConfirm,
      setTab,
      submitOperation,
      tezos
    ]
  );

  return (
    <FormProvider {...form}>
      <BaseContent<TezosTxParamsFormData>
        ledgerApprovalModalState={ledgerApprovalModalState}
        onLedgerModalClose={handleLedgerModalClose}
        network={network}
        assetSlug={assetSlug}
        amount={amount}
        recipientAddress={to}
        displayedFeeOptions={displayedFeeOptions}
        displayedFee={displayedFee}
        selectedTab={tab}
        setSelectedTab={setTab}
        latestSubmitError={latestSubmitError}
        displayedStorageFee={displayedStorageFee}
        onFeeOptionSelect={handleFeeOptionSelect}
        selectedFeeOption={selectedFeeOption}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
