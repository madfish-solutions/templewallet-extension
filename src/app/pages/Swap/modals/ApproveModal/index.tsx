import React, { useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { encodeFunctionData } from 'viem';
import { toHex } from 'viem/utils';

import { Anchor, IconBase } from 'app/atoms';
import { Logo } from 'app/atoms/Logo';
import { ActionsButtonsBox, CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { ReactComponent as LinkIcon } from 'app/icons/base/link.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { buildBasicEvmSendParams } from 'app/pages/Send/build-basic-evm-send-params';
import LiFiImgSrc from 'app/pages/Swap/form/assets/lifi.png';
import { EvmReviewData, SwapReviewData } from 'app/pages/Swap/form/interfaces';
import { parseLiFiTxRequestToViem, timeout } from 'app/pages/Swap/modals/ConfirmSwap/utils';
import { EvmTransactionView } from 'app/templates/EvmTransactionView';
import { toastSuccess } from 'app/toaster';
import { erc20IncreaseAllowanceAbi } from 'lib/abi/erc20';
import { toTokenSlug } from 'lib/assets';
import { t, T } from 'lib/i18n';
import { useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { useTempleClient } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { EvmTransactionRequestWithSender, TempleEvmDAppTransactionPayload } from 'lib/temple/types';
import { estimate as genericEstimate, EvmEstimationData } from 'temple/evm/estimate';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { TempleChainKind } from 'temple/types';

interface ApproveModalProps {
  data: EvmReviewData;
  onClose: EmptyFn;
  onReview: (data: SwapReviewData) => void;
  setLoading: (arg0: boolean) => void;
}

const LIFI = 'https://li.fi/';

const ApproveModal = ({ data, onClose, onReview, setLoading }: ApproveModalProps) => {
  const { lifiStep, account, network, minimumReceived, onConfirm, neededApproval, onChainAllowance } = data;

  if (!lifiStep) throw new DeadEndBoundaryError();

  const { sendEvmTransaction } = useTempleClient();
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();

  const txData = useMemo(() => {
    return encodeFunctionData({
      abi: [erc20IncreaseAllowanceAbi],
      functionName: 'increaseAllowance',
      args: [lifiStep.estimate.approvalAddress as HexString, BigInt(lifiStep.action.fromAmount) - onChainAllowance]
    });
  }, [lifiStep.action.fromAmount, lifiStep.estimate.approvalAddress, onChainAllowance]);

  const assetMetadata = useEvmCategorizedAssetMetadata(
    toTokenSlug(lifiStep.action.fromToken.address, 0),
    network.chainId
  );

  const [finalEvmTransaction, setFinalEvmTransaction] = useState<EvmTransactionRequestWithSender>({
    from: lifiStep.action.fromAddress as HexString
  });
  const [latestSubmitError, setLatestSubmitError] = useState<string | nullish>(null);
  const [estimationData, setEstimationData] = useState<EvmEstimationData | null>(null);

  useEffect(() => {
    if (assetMetadata) {
      const amount = atomsToTokens(
        new BigNumber((BigInt(lifiStep.action.fromAmount) - onChainAllowance).toString()),
        assetMetadata?.decimals ?? 0
      ).toString();

      genericEstimate(network, {
        ...buildBasicEvmSendParams(
          account.address as HexString,
          lifiStep.estimate.approvalAddress as HexString,
          assetMetadata,
          amount
        ),
        from: account.address as HexString
      }).then(estimate => {
        setEstimationData(estimate);
      });
    }
  }, [
    account.address,
    assetMetadata,
    lifiStep.action.fromAmount,
    lifiStep.estimate.approvalAddress,
    network,
    onChainAllowance
  ]);

  const request = useMemo(() => {
    return {
      to: lifiStep.action.fromToken.address as HexString,
      from: lifiStep.transactionRequest?.from as HexString,
      data: finalEvmTransaction ? finalEvmTransaction.data : txData,
      value: toHex(BigInt(0)),
      maxFeePerGas: estimationData?.maxFeePerGas !== undefined ? toHex(estimationData.maxFeePerGas) : undefined,
      gas: estimationData?.gas !== undefined ? toHex(estimationData.gas) : undefined,
      gasPrice: estimationData?.gasPrice !== undefined ? toHex(estimationData.gasPrice) : undefined
    };
  }, [
    estimationData,
    finalEvmTransaction,
    lifiStep.action.fromToken.address,
    lifiStep.transactionRequest?.from,
    txData
  ]);

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
      if (tx) {
        try {
          setLoading(true);
          const txHash = await sendEvmTransaction(account.address as HexString, network, parseLiFiTxRequestToViem(tx));

          const blockExplorer = getActiveBlockExplorer(network.chainId.toString());
          setTimeout(() => {
            toastSuccess(t('transactionSubmitted'), true, {
              hash: txHash,
              explorerBaseUrl: blockExplorer.url + '/tx/'
            });
          }, CLOSE_ANIMATION_TIMEOUT * 2);

          await timeout(1000);
          setLoading(false);

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
        } catch (err: any) {
          console.error(err);
          setLatestSubmitError(err.message);
        } finally {
          setLoading(false);
        }
      }
    },
    [
      account,
      getActiveBlockExplorer,
      lifiStep,
      minimumReceived,
      neededApproval,
      network,
      onChainAllowance,
      onConfirm,
      onReview,
      sendEvmTransaction,
      setLoading
    ]
  );

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

        {estimationData && (
          <EvmTransactionView
            payload={payload}
            formId={'swap-approve'}
            error={null}
            setFinalEvmTransaction={setFinalEvmTransaction}
            onSubmit={onSubmit}
          />
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
    </>
  );
};

export default ApproveModal;
