import React, { FC, useCallback, useState } from 'react';

import { OpKind, TransferParams, WalletParamsWithKind } from '@taquito/taquito';
import { FormProvider } from 'react-hook-form';

import { HashChip } from 'app/atoms/HashChip';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { useTezosEstimationData } from 'app/pages/Send/hooks/use-tezos-estimation-data';
import { dispatch } from 'app/store';
import {
  addPendingTezosTransactionAction,
  monitorPendingTezosTransactionsAction
} from 'app/store/tezos/pending-transactions/actions';
import { CurrentAccount } from 'app/templates/current-account';
import { FeeSummary } from 'app/templates/fee-summary';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { TezosTxParamsFormData } from 'app/templates/TransactionTabs/types';
import { useTezosEstimationForm } from 'app/templates/TransactionTabs/use-tezos-estimation-form';
import { ExchangeData } from 'lib/apis/exolix/types';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useTezosAssetBalance } from 'lib/balances';
import { T, t } from 'lib/i18n';
import { useCategorizedTezosAssetMetadata } from 'lib/metadata';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { useTypedSWR } from 'lib/swr';
import { loadContract } from 'lib/temple/contract';
import { TezosEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { isTezosContractAddress } from 'lib/tezos';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { useLedgerWebHidFullViewGuard } from 'lib/ui/ledger-webhid-guard';
import { LedgerFullViewPromptModal } from 'lib/ui/LedgerFullViewPrompt';
import { ZERO } from 'lib/utils/numbers';
import { AccountForChain } from 'temple/accounts';
import { TezosChain, getTezosToolkitWithSigner, useAccount } from 'temple/front';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { useSubmitCrossChainExchange } from '../../hooks/use-submit-cross-chain-exchange';

import { ExpectedResultCard, NetworkRows } from './preview-shared';
import { ConfirmCrossChainReviewData } from './types';

interface Props {
  data: ConfirmCrossChainReviewData;
  exchange: ExchangeData;
  account: AccountForChain<TempleChainKind.Tezos>;
  network: TezosChain;
  onSubmitted: (exchangeId: string) => void;
  onCancel: EmptyFn;
}

const FORM_ID = 'cross-chain-confirm-tezos-form';

export const PreviewBodyTezos: FC<Props> = props => (
  <TezosEstimationDataProvider>
    <PreviewBodyTezosInner {...props} />
  </TezosEstimationDataProvider>
);

const PreviewBodyTezosInner: FC<Props> = ({ data, exchange, account, network, onSubmitted, onCancel }) => {
  const { fromAsset, toAsset, fromAmount, toAmountEstimated, recipient } = data;
  const { rpcBaseURL, chainId } = network;

  const accountPkh = account.address;
  const isLedgerAccount = account.type === TempleAccountType.Ledger;

  const currentAccount = useAccount();
  const getActiveBlockExplorer = useGetTezosActiveBlockExplorer();
  const recordCrossChainExchange = useSubmitCrossChainExchange();

  const assetMetadata = useCategorizedTezosAssetMetadata(fromAsset.assetSlug ?? '', network.chainId);

  const [latestSubmitError, setLatestSubmitError] = useState<unknown>(null);

  const { value: balance = ZERO } = useTezosAssetBalance(fromAsset.assetSlug ?? '', accountPkh, network);
  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const tezos = getTezosToolkitWithSigner(network, account.ownerAddress || accountPkh, true);

  const { data: estimationData, error: estimationError } = useTezosEstimationData({
    to: exchange.depositAddress,
    tezos,
    chainId,
    account,
    accountPkh,
    assetSlug: fromAsset.assetSlug ?? '',
    balance,
    tezBalance,
    assetMetadata: assetMetadata!,
    toFilled: Boolean(assetMetadata)
  });

  const getBasicSendParams = useCallback(async (): Promise<WalletParamsWithKind[]> => {
    if (!assetMetadata) throw new Error(t('tezosMetadataNotAvailable'));
    let transferParams: TransferParams;
    if (isTezosContractAddress(accountPkh)) {
      const michelsonLambda = isTezosContractAddress(exchange.depositAddress) ? transferToContract : transferImplicit;
      const contract = await loadContract(tezos, accountPkh);
      transferParams = contract.methodsObject
        .do(michelsonLambda(exchange.depositAddress, tzToMutez(fromAmount)))
        .toTransferParams();
    } else {
      transferParams = await toTransferParams(
        tezos,
        fromAsset.assetSlug ?? '',
        assetMetadata,
        accountPkh,
        exchange.depositAddress,
        fromAmount
      );
    }
    return [{ kind: OpKind.TRANSACTION, ...transferParams }];
  }, [accountPkh, assetMetadata, exchange.depositAddress, fromAmount, fromAsset.assetSlug, tezos]);

  const { data: basicSendParams } = useTypedSWR(
    assetMetadata
      ? [
          'cross-chain-tezos-basic-params',
          accountPkh,
          fromAmount,
          fromAsset.assetSlug,
          exchange.depositAddress,
          rpcBaseURL
        ]
      : null,
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
    network,
    isEstimationError: Boolean(estimationError)
  });
  const { formState } = form;

  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();
  const { guard, ledgerPromptProps } = useLedgerWebHidFullViewGuard();

  const onSubmitError = useCallback(
    (err: unknown) => {
      setLatestSubmitError(err);
      setTab('error');
    },
    [setTab]
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
          onSubmitError(estimationError ?? new Error(t('estimationNotReady')));
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

          // @ts-expect-error - operation shape from useTezosEstimationForm.submitOperation
          const txHash: string = operation?.hash || operation?.opHash;

          const blockExplorer = getActiveBlockExplorer(network.chainId);
          dispatch(
            addPendingTezosTransactionAction({
              txHash,
              accountPkh,
              network,
              blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.Tezos),
              submittedAt: Date.now(),
              kind: 'cross-chain-send'
            })
          );
          dispatch(monitorPendingTezosTransactionsAction());

          recordCrossChainExchange({
            accountId: currentAccount.id,
            sourceChainKind: TempleChainKind.Tezos,
            sourceChainId: network.chainId,
            senderAddress: accountPkh,
            txHash,
            exchange,
            fromAsset,
            toAsset,
            fromAmount,
            toAmountEstimated,
            recipient
          });

          onSubmitted(exchange.id);
        };

        if (isLedgerAccount) {
          const redirected = await guard(account.type);
          if (redirected) return;
          await runConnectedLedgerOperationFlow(doOperation, setLedgerApprovalModalState, true);
        } else {
          await doOperation();
        }
      } catch (err: unknown) {
        onSubmitError(err);
      }
    },
    [
      formState.isSubmitting,
      assertCustomGasFeeNotTooLow,
      estimationData,
      estimationError,
      onSubmitError,
      submitOperation,
      tezos,
      displayedFeeOptions,
      getActiveBlockExplorer,
      accountPkh,
      network,
      exchange,
      recipient,
      fromAsset,
      toAsset,
      fromAmount,
      toAmountEstimated,
      currentAccount.id,
      recordCrossChainExchange,
      onSubmitted,
      isLedgerAccount,
      account.type,
      guard,
      setLedgerApprovalModalState
    ]
  );

  return (
    <FormProvider {...form}>
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 flex flex-col gap-y-4">
        <ExpectedResultCard
          fromAsset={fromAsset}
          fromAmount={fromAmount}
          feeFooter={
            <FeeSummary
              embedded
              network={network}
              assetSlug={TEZ_TOKEN_SLUG}
              gasFee={displayedFee}
              storageFee={displayedStorageFee}
              onOpenFeeTab={() => setTab('fee')}
            />
          }
        />

        <CurrentAccount />

        <TransactionTabs<TezosTxParamsFormData>
          network={network}
          nativeAssetSlug={TEZ_TOKEN_SLUG}
          selectedTab={tab}
          setSelectedTab={setTab}
          selectedFeeOption={selectedFeeOption}
          latestSubmitError={latestSubmitError}
          onFeeOptionSelect={handleFeeOptionSelect}
          onSubmit={onSubmit}
          displayedFeeOptions={displayedFeeOptions}
          estimationError={estimationError}
          formId={FORM_ID}
          tabsName="cross-chain-tezos-preview-tabs"
          detailsContent={
            <NetworkRows
              recipientNode={<HashChip hash={recipient} firstCharsCount={6} lastCharsCount={6} />}
              fromAsset={fromAsset}
              toAsset={toAsset}
            />
          }
        />
      </div>

      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        <StyledButton
          size="L"
          className="w-full"
          color="primary-low"
          onClick={onCancel}
          disabled={formState.isSubmitting}
        >
          <T id="cancel" />
        </StyledButton>
        <StyledButton
          type="submit"
          form={FORM_ID}
          size="L"
          className="w-full"
          color="primary"
          loading={formState.isSubmitting}
        >
          <T id={latestSubmitError ? 'retry' : 'confirm'} />
        </StyledButton>
      </ActionsButtonsBox>

      <LedgerApprovalModal
        state={ledgerApprovalModalState}
        onClose={handleLedgerModalClose}
        chainKind={TempleChainKind.Tezos}
      />
      <LedgerFullViewPromptModal {...ledgerPromptProps} />
    </FormProvider>
  );
};
