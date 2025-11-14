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
import {
  EvmTransactionRequestWithSender,
  SerializedEvmEstimationDataWithFallback,
  TempleAccountType,
  TempleEvmDAppTransactionPayload
} from 'lib/temple/types';
import { runConnectedLedgerOperationFlow } from 'lib/ui';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { ZERO } from 'lib/utils/numbers';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

import Route3ImgSrc from '../../form/assets/3route.png';
import LiFiImgSrc from '../../form/assets/lifi.png';
import { EvmStepReviewData, getCommonStepProps, isLifiStep } from '../../form/interfaces';
import { parseTxRequestToViem, timeout } from '../ConfirmSwap/utils';

interface ApproveModalProps {
  stepReviewData: EvmStepReviewData;
  onClose: EmptyFn;
  onStepCompleted: EmptyFn;
  submitDisabled?: boolean;
}

const ApproveModal: FC<ApproveModalProps> = ({ stepReviewData, onClose, onStepCompleted, submitDisabled }) => {
  const { account, inputNetwork, routeStep } = stepReviewData;
  const currentStepIsLifi = isLifiStep(routeStep);
  const appName = currentStepIsLifi ? 'li.fi' : '3Route';
  const appUrl = currentStepIsLifi ? 'https://li.fi/' : 'https://3route.io/';
  const accountAddress = account.address as HexString;
  const { approvalAddress, fromAmount, fromToken, fromAddress } = getCommonStepProps(routeStep);

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
      args: [approvalAddress as HexString, BigInt(fromAmount)]
    });
  }, [fromAmount, approvalAddress]);

  const assetSlug = useMemo(() => toTokenSlug(fromToken.address, 0), [fromToken.address]);

  const [finalEvmTransaction, setFinalEvmTransaction] = useState<EvmTransactionRequestWithSender>({
    from: fromAddress as HexString
  });
  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);

  const amount = useMemo(
    () => atomsToTokens(new BigNumber(fromAmount), fromToken.decimals ?? 0).toFixed(),
    [fromAmount, fromToken.decimals]
  );

  const { value: balance = ZERO } = useEvmAssetBalance(assetSlug, accountAddress, inputNetwork);
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountAddress, inputNetwork);

  const { data: estimationData } = useEvmEstimationData({
    to: approvalAddress as HexString,
    assetSlug: assetSlug,
    accountPkh: accountAddress,
    network: inputNetwork,
    balance,
    ethBalance,
    toFilled: true,
    amount,
    silent: true
  });

  const request = useMemo(() => {
    return {
      to: fromToken.address as HexString,
      from: fromAddress as HexString,
      data: finalEvmTransaction?.data ? finalEvmTransaction.data : txData,
      value: toHex(BigInt(0)),
      maxFeePerGas: estimationData?.maxFeePerGas === undefined ? undefined : toHex(estimationData.maxFeePerGas),
      gas: estimationData?.gas === undefined ? undefined : toHex(estimationData.gas),
      gasPrice: estimationData?.gasPrice === undefined ? undefined : toHex(estimationData.gasPrice)
    };
  }, [estimationData, finalEvmTransaction, fromToken.address, fromAddress, txData]);

  const payload = useMemo<TempleEvmDAppTransactionPayload>(() => {
    return {
      type: 'confirm_operations' as const,
      req: request as EvmTransactionRequestWithSender,
      estimationData: estimationData as SerializedEvmEstimationDataWithFallback | undefined,
      chainId: inputNetwork.chainId.toString(),
      chainType: TempleChainKind.EVM,
      origin: appUrl,
      appMeta: { name: appName }
    };
  }, [request, estimationData, inputNetwork.chainId, appUrl, appName]);

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
      sendEvmTransaction,
      account.address,
      inputNetwork,
      getActiveBlockExplorer,
      onStepCompleted,
      isLedgerAccount,
      setLedgerApprovalModalState,
      submitDisabled
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
            <img src={currentStepIsLifi ? LiFiImgSrc : Route3ImgSrc} alt={appName} className="w-6 h-6" />
          </div>
          <Anchor className="flex pl-1 items-center" href={appUrl}>
            <span className="text-font-description-bold">{appName}</span>
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
            minAllowance={BigInt(fromAmount)}
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
    </>
  );
};

export default ApproveModal;
