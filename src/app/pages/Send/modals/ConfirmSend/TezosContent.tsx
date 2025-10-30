import React, { FC, useCallback, useState } from 'react';

import { OpKind, TransferParams, WalletParamsWithKind } from '@taquito/taquito';
import { FormProvider } from 'react-hook-form-v7';

import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { TezosReviewData } from 'app/pages/Send/form/interfaces';
import { useTezosEstimationData } from 'app/pages/Send/hooks/use-tezos-estimation-data';
import { TezosTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useTezosEstimationForm } from 'app/templates/TransactionTabs/use-tezos-estimation-form';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useCategorizedTezosAssetMetadata } from 'lib/metadata';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { useTypedSWR } from 'lib/swr';
import { loadContract } from 'lib/temple/contract';
import { tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { isTezosContractAddress } from 'lib/tezos';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { ZERO } from 'lib/utils/numbers';
import { getTezosToolkitWithSigner } from 'temple/front';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

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

  const [latestSubmitError, setLatestSubmitError] = useState<unknown>(null);

  const { value: balance = ZERO } = useTezosAssetBalance(assetSlug, accountPkh, network);
  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const getActiveBlockExplorer = useGetTezosActiveBlockExplorer();

  const tezos = getTezosToolkitWithSigner(network, account.ownerAddress || accountPkh, true);

  const { data: estimationData, error: estimationError } = useTezosEstimationData({
    to,
    tezos,
    chainId,
    account,
    accountPkh,
    assetSlug,
    balance,
    tezBalance,
    assetMetadata,
    toFilled: true
  });

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
    displayedStorageFee,
    assertCustomGasFeeNotTooLow
  } = useTezosEstimationForm({
    estimationData,
    basicParams: basicSendParams,
    senderAccount: account,
    network
  });
  const { formState } = form;

  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

  const onSubmitError = useCallback(
    (err: unknown) => {
      console.error(err);
      setLatestSubmitError(err);
      setTab('error');
    },
    [setLatestSubmitError, setTab]
  );

  const onSubmit = useCallback(
    async ({ gasFee, storageLimit }: TezosTxParamsFormData) => {
      try {
        if (formState.isSubmitting) return;

        try {
          assertCustomGasFeeNotTooLow(gasFee);
        } catch (e) {
          onSubmitError(e);

          return;
        }

        if (!estimationData || estimationError) {
          onSubmitError(estimationError);

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

          showTxSubmitToastWithDelay(TempleChainKind.Tezos, txHash, blockExplorer.url);
        };

        if (isLedgerAccount) {
          await runConnectedLedgerOperationFlow(doOperation, setLedgerApprovalModalState, true);
        } else {
          await doOperation();
        }
      } catch (err: any) {
        onSubmitError(err);
      }
    },
    [
      formState.isSubmitting,
      estimationData,
      displayedFeeOptions,
      isLedgerAccount,
      estimationError,
      submitOperation,
      tezos,
      onConfirm,
      onClose,
      getActiveBlockExplorer,
      network.chainId,
      setLedgerApprovalModalState,
      onSubmitError,
      assertCustomGasFeeNotTooLow
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
        decimals={assetMetadata.decimals}
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
