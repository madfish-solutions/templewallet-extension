import React, { FC, useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { encodeFunctionData } from 'viem';
import { toHex } from 'viem/utils';

import { Anchor, IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { Logo } from 'app/atoms/Logo';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { ReactComponent as LinkIcon } from 'app/icons/base/link.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { useEvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import LiFiImgSrc from 'app/pages/Swap/form/assets/lifi.png';
import { EvmStepReviewData } from 'app/pages/Swap/form/interfaces';
import { parseTxRequestToViem, timeout } from 'app/pages/Swap/modals/ConfirmSwap/utils';
import { EvmTransactionView } from 'app/templates/EvmTransactionView';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { erc20ApproveAbi } from 'lib/abi/erc20';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { T } from 'lib/i18n';
import { getHumanErrorMessage } from 'lib/temple/error-messages';
import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { EvmTransactionRequestWithSender, TempleAccountType, TempleEvmDAppTransactionPayload } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow, LedgerOperationState } from 'lib/ui';
import { useLedgerWebHidFullViewGuard } from 'lib/ui/ledger-webhid-guard';
import { LedgerFullViewPromptModal } from 'lib/ui/LedgerFullViewPrompt';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { ZERO } from 'lib/utils/numbers';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

interface ApproveModalProps {
  stepReviewData: EvmStepReviewData;
  onClose: EmptyFn;
  onStepCompleted: EmptyFn;
  submitDisabled?: boolean;
}

const LIFI = 'https://li.fi/';

const ApproveModal: FC<ApproveModalProps> = ({ stepReviewData, onClose, onStepCompleted, submitDisabled }) => {
  const { account, inputNetwork, routeStep } = stepReviewData;

  const [loading, setLoading] = useState(false);

  const { sendEvmTransaction } = useTempleClient();
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const isLedgerAccount = account.type === TempleAccountType.Ledger;
  const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
    useLedgerApprovalModalState();

  const txData = useMemo(() => {
    return encodeFunctionData({
      abi: [erc20ApproveAbi],
      functionName: 'approve',
      args: [routeStep.estimate.approvalAddress as HexString, BigInt(routeStep.action.fromAmount)]
    });
  }, [routeStep.action.fromAmount, routeStep.estimate.approvalAddress]);

  const assetSlug = useMemo(
    () => toTokenSlug(routeStep.action.fromToken.address, 0),
    [routeStep.action.fromToken.address]
  );

  const [finalEvmTransaction, setFinalEvmTransaction] = useState<EvmTransactionRequestWithSender>({
    from: routeStep.action.fromAddress as HexString
  });
  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);
  const { guard, preconnectIfNeeded, ledgerPromptProps } = useLedgerWebHidFullViewGuard();

  const amount = useMemo(
    () =>
      atomsToTokens(
        new BigNumber(BigInt(routeStep.action.fromAmount).toString()),
        routeStep.action.fromToken.decimals ?? 0
      ).toString(),
    [routeStep.action.fromAmount, routeStep.action.fromToken.decimals]
  );

  const { value: balance = ZERO } = useEvmAssetBalance(assetSlug, account.address as HexString, inputNetwork);
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, account.address as HexString, inputNetwork);

  const { data: estimationData } = useEvmEstimationData({
    to: routeStep.estimate.approvalAddress as HexString,
    assetSlug: assetSlug,
    accountPkh: account.address as HexString,
    network: inputNetwork,
    balance,
    ethBalance,
    toFilled: true,
    amount,
    silent: true
  });

  const request = useMemo(() => {
    return {
      to: routeStep.action.fromToken.address as HexString,
      from: routeStep.action.fromAddress as HexString,
      data: finalEvmTransaction?.data ? finalEvmTransaction.data : txData,
      value: toHex(BigInt(0)),
      maxFeePerGas: estimationData?.maxFeePerGas !== undefined ? toHex(estimationData.maxFeePerGas) : undefined,
      gas: estimationData?.gas !== undefined ? toHex(estimationData.gas) : undefined,
      gasPrice: estimationData?.gasPrice !== undefined ? toHex(estimationData.gasPrice) : undefined
    };
  }, [estimationData, finalEvmTransaction, routeStep.action.fromToken.address, routeStep.action.fromAddress, txData]);

  const payload = useMemo(() => {
    return {
      type: 'confirm_operations' as const,
      req: request,
      estimationData,
      chainId: inputNetwork.chainId.toString(),
      chainType: TempleChainKind.EVM,
      origin: LIFI,
      appMeta: { name: 'li.fi' }
    } as unknown as TempleEvmDAppTransactionPayload;
  }, [request, estimationData, inputNetwork.chainId]);

  const onSubmit = useCallback(
    async (tx?: EvmTransactionRequestWithSender) => {
      if (submitDisabled) return;
      if (!tx) return;

      const doOperation = async () => {
        setLoading(true);
        const txParams = parseTxRequestToViem(tx);
        if (!txParams) {
          console.error('Failed to parse txParams');
          return;
        }

        const txHash = await sendEvmTransaction(account.address as HexString, inputNetwork, txParams);
        const blockExplorer = getActiveBlockExplorer(inputNetwork.chainId.toString());
        showTxSubmitToastWithDelay(TempleChainKind.EVM, txHash, blockExplorer.url);
        await timeout(1000);

        onStepCompleted();
      };

      try {
        if (isLedgerAccount) {
          const redirected = await guard(account.type);
          if (redirected) return;
          setLedgerApprovalModalState(LedgerOperationState.InProgress);
          await preconnectIfNeeded(account.type, TempleChainKind.EVM);
          await runConnectedLedgerOperationFlow(doOperation, setLedgerApprovalModalState, true);
        } else {
          await doOperation();
        }
      } catch (err: any) {
        console.error(err);
        setLatestSubmitError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [
      submitDisabled,
      sendEvmTransaction,
      account.address,
      account.type,
      inputNetwork,
      getActiveBlockExplorer,
      onStepCompleted,
      isLedgerAccount,
      guard,
      setLedgerApprovalModalState,
      preconnectIfNeeded
    ]
  );

  const handleSubmitError = useCallback((error: unknown) => setLatestSubmitError(getHumanErrorMessage(error)), []);

  if (loading && !isLedgerAccount) {
    return <PageLoader stretch />;
  }

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll bg-background">
        <div className="my-4 mx-3 flex items-center justify-between">
          <div className="flex items-center">
            <Logo size={22} type="icon" />
            <IconBase Icon={LinkIcon} size={12} className="text-black -ml-1 mr-0.5" />
            <img src={LiFiImgSrc} alt="lifi" className="w-6 h-6" />
          </div>
          <Anchor className="flex pl-1 items-center" href={LIFI}>
            <span className="text-font-description-bold">{'li.fi'}</span>
            <IconBase Icon={OutLinkIcon} size={16} className="text-secondary" />
          </Anchor>
        </div>

        {estimationData ? (
          <EvmTransactionView
            payload={payload}
            formId="swap-approve"
            error={null}
            setError={handleSubmitError}
            setFinalEvmTransaction={setFinalEvmTransaction}
            onSubmit={onSubmit}
            minAllowance={BigInt(routeStep.action.fromAmount)}
          />
        ) : (
          <PageLoader />
        )}
      </div>
      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onClose}>
          <T id="cancel" />
        </StyledButton>

        <StyledButton
          type="submit"
          form="swap-approve"
          color="primary"
          size="L"
          className="w-full"
          disabled={Boolean(submitDisabled)}
        >
          <T id={latestSubmitError ? 'retry' : 'confirm'} />
        </StyledButton>
      </ActionsButtonsBox>

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={handleLedgerModalClose} />
      <LedgerFullViewPromptModal {...ledgerPromptProps} />
    </>
  );
};

export default ApproveModal;
