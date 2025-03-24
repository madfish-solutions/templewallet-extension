import React, { FC, useCallback, useMemo, useState } from 'react';

import { omit } from 'lodash';
import { FormProvider } from 'react-hook-form-v7';
import { TransactionRequest } from 'viem';

import { CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { EvmReviewData } from 'app/pages/Send/form/interfaces';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { EvmTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useEvmEstimationForm } from 'app/templates/TransactionTabs/use-evm-estimation-form';
import { toastError, toastSuccess } from 'app/toaster';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { t } from 'lib/i18n';
import { useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { ZERO } from 'lib/utils/numbers';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';

import { buildBasicEvmSendParams } from '../../build-basic-evm-send-params';

import { BaseContent } from './BaseContent';

interface EvmContentProps {
  data: EvmReviewData;
  onClose: EmptyFn;
}

export const EvmContent: FC<EvmContentProps> = ({ data, onClose }) => {
  const { account, network, assetSlug, to, amount, onConfirm } = data;

  const accountPkh = account.address as HexString;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const { sendEvmTransaction } = useTempleClient();

  const { value: balance = ZERO } = useEvmAssetBalance(assetSlug, accountPkh, network);
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, network);
  const assetMetadata = useEvmCategorizedAssetMetadata(assetSlug, network.chainId);
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const { data: estimationData } = useEvmEstimationData(
    to as HexString,
    assetSlug,
    accountPkh,
    network,
    balance,
    ethBalance,
    true,
    amount
  );
  const basicParams = useMemo(
    () => assetMetadata && buildBasicEvmSendParams(accountPkh, to as HexString, assetMetadata, amount),
    [accountPkh, amount, assetMetadata, to]
  );
  const { form, tab, setTab, selectedFeeOption, handleFeeOptionSelect, feeOptions, displayedFee, getFeesPerGas } =
    useEvmEstimationForm(estimationData, basicParams, account, network.chainId);
  const { formState } = form;
  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

  const onSubmit = useCallback(
    async ({ gasPrice, gasLimit, nonce }: EvmTxParamsFormData) => {
      if (formState.isSubmitting) return;

      const feesPerGas = getFeesPerGas(gasPrice);

      if (!assetMetadata) {
        throw new Error('Asset metadata not found.');
      }

      if (!estimationData || !feesPerGas) {
        toastError('Failed to estimate transaction.');

        return;
      }

      try {
        const { value, to: txDestination } = buildBasicEvmSendParams(
          accountPkh,
          to as HexString,
          assetMetadata,
          amount
        );

        const doOperation = async () => {
          const txHash = await sendEvmTransaction(accountPkh, network, {
            to: txDestination,
            value,
            ...omit(estimationData, 'estimatedFee'),
            ...feesPerGas,
            ...(gasLimit ? { gas: BigInt(gasLimit) } : {}),
            ...(nonce ? { nonce: Number(nonce) } : {})
          } as TransactionRequest);

          onConfirm();
          onClose();

          const blockExplorer = getActiveBlockExplorer(network.chainId.toString());

          setTimeout(
            () =>
              toastSuccess(t('transactionSubmitted'), true, {
                hash: txHash,
                explorerBaseUrl: blockExplorer.url + '/tx/'
              }),
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

        setLatestSubmitError(err.message);
        setTab('error');
      }
    },
    [
      accountPkh,
      amount,
      assetMetadata,
      estimationData,
      formState.isSubmitting,
      getActiveBlockExplorer,
      getFeesPerGas,
      network,
      onClose,
      onConfirm,
      sendEvmTransaction,
      setTab,
      setLedgerApprovalModalState,
      to,
      isLedgerAccount
    ]
  );

  return (
    <FormProvider {...form}>
      <BaseContent<EvmTxParamsFormData>
        ledgerApprovalModalState={ledgerApprovalModalState}
        onLedgerModalClose={handleLedgerModalClose}
        network={network}
        assetSlug={assetSlug}
        amount={amount}
        recipientAddress={to}
        displayedFeeOptions={feeOptions?.displayed}
        selectedTab={tab}
        setSelectedTab={setTab}
        selectedFeeOption={selectedFeeOption}
        latestSubmitError={latestSubmitError}
        displayedFee={displayedFee}
        onFeeOptionSelect={handleFeeOptionSelect}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
