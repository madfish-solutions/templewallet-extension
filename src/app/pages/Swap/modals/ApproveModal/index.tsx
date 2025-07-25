import React, { useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
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
import { EvmReviewData, SwapReviewData } from 'app/pages/Swap/form/interfaces';
import { parseTxRequestToViem, timeout } from 'app/pages/Swap/modals/ConfirmSwap/utils';
import { EvmTransactionView } from 'app/templates/EvmTransactionView';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { erc20ApproveAbi } from 'lib/abi/erc20';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { T } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { EvmTransactionRequestWithSender, TempleAccountType, TempleEvmDAppTransactionPayload } from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { ZERO } from 'lib/utils/numbers';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

interface ApproveModalProps {
  data: EvmReviewData;
  onClose: EmptyFn;
  onReview: (data: SwapReviewData) => void;
}

const LIFI = 'https://li.fi/';

const ApproveModal = ({ data, onClose, onReview }: ApproveModalProps) => {
  const { lifiStep, account, network, minimumReceived, onConfirm, neededApproval, onChainAllowance } = data;

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
      args: [lifiStep.estimate.approvalAddress as HexString, BigInt(lifiStep.action.fromAmount)]
    });
  }, [lifiStep.action.fromAmount, lifiStep.estimate.approvalAddress]);

  const assetSlug = useMemo(
    () => toTokenSlug(lifiStep.action.fromToken.address, 0),
    [lifiStep.action.fromToken.address]
  );

  const [finalEvmTransaction, setFinalEvmTransaction] = useState<EvmTransactionRequestWithSender>({
    from: lifiStep.action.fromAddress as HexString
  });
  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const amount = useMemo(
    () =>
      atomsToTokens(
        new BigNumber(BigInt(lifiStep.action.fromAmount).toString()),
        lifiStep.action.fromToken.decimals ?? 0
      ).toString(),
    [lifiStep.action.fromAmount, lifiStep.action.fromToken.decimals]
  );

  const { value: balance = ZERO } = useEvmAssetBalance(assetSlug, account.address as HexString, network);
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, account.address as HexString, network);

  const { data: estimationData } = useEvmEstimationData({
    to: lifiStep.estimate.approvalAddress as HexString,
    assetSlug: assetSlug,
    accountPkh: account.address as HexString,
    network,
    balance,
    ethBalance,
    toFilled: true,
    amount
  });

  const request = useMemo(() => {
    return {
      to: lifiStep.action.fromToken.address as HexString,
      from: lifiStep.action.fromAddress as HexString,
      data: finalEvmTransaction?.data ? finalEvmTransaction.data : txData,
      value: toHex(BigInt(0)),
      maxFeePerGas: estimationData?.maxFeePerGas !== undefined ? toHex(estimationData.maxFeePerGas) : undefined,
      gas: estimationData?.gas !== undefined ? toHex(estimationData.gas) : undefined,
      gasPrice: estimationData?.gasPrice !== undefined ? toHex(estimationData.gasPrice) : undefined
    };
  }, [estimationData, finalEvmTransaction, lifiStep.action.fromToken.address, lifiStep.action.fromAddress, txData]);

  const payload = useMemo(() => {
    return {
      type: 'confirm_operations' as const,
      req: request,
      estimationData,
      chainId: network.chainId.toString(),
      chainType: TempleChainKind.EVM,
      origin: LIFI,
      appMeta: { name: 'li.fi' }
    } as unknown as TempleEvmDAppTransactionPayload;
  }, [request, estimationData, network.chainId]);

  const onSubmit = useCallback(
    async (tx?: EvmTransactionRequestWithSender) => {
      if (!tx) return;

      const doOperation = async () => {
        setLoading(true);
        const txParams = parseTxRequestToViem(tx);
        if (!txParams) {
          console.error('Failed to parse txParams');
          return;
        }

        const txHash = await sendEvmTransaction(account.address as HexString, network, txParams);
        const blockExplorer = getActiveBlockExplorer(network.chainId.toString());
        showTxSubmitToastWithDelay(TempleChainKind.EVM, txHash, blockExplorer.url);
        await timeout(1000);

        onReview({
          account,
          network,
          needsApproval: false,
          neededApproval,
          onChainAllowance,
          onConfirm,
          minimumReceived,
          lifiStep
        });
      };

      try {
        if (isLedgerAccount) {
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
      account,
      getActiveBlockExplorer,
      isLedgerAccount,
      lifiStep,
      minimumReceived,
      neededApproval,
      network,
      onChainAllowance,
      onConfirm,
      onReview,
      sendEvmTransaction,
      setLedgerApprovalModalState
    ]
  );

  if (loading && !isLedgerAccount) {
    return <PageLoader stretch />;
  }

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <div className="mb-2 flex flex-col items-center gap-2 my-4">
          <div className="flex gap-2 relative">
            <div className="w-13 h-13 flex justify-center items-center bg-white shadow-card rounded">
              <Logo size={30} type="icon" />
            </div>
            <div className="w-13 h-13 flex justify-center items-center bg-white shadow-card rounded">
              <img src={LiFiImgSrc} alt="lifi" className="w-8 h-8" />
            </div>
            <div
              className={clsx(
                'w-5 h-5 rounded-full bg-grey-4 flex justify-center items-center',
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              )}
            >
              <IconBase Icon={LinkIcon} size={12} className="text-grey-1" />
            </div>
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
            setFinalEvmTransaction={setFinalEvmTransaction}
            onSubmit={onSubmit}
            minAllowance={BigInt(lifiStep.action.fromAmount)}
          />
        ) : (
          <PageLoader />
        )}
      </div>
      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onClose}>
          <T id="cancel" />
        </StyledButton>

        <StyledButton type="submit" form="swap-approve" color="primary" size="L" className="w-full">
          <T id={latestSubmitError ? 'retry' : 'confirm'} />
        </StyledButton>
      </ActionsButtonsBox>

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={handleLedgerModalClose} />
    </>
  );
};

export default ApproveModal;
