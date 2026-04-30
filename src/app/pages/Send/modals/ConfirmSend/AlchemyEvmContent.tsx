import React, { FC, useCallback, useMemo, useState } from 'react';

import axios from 'axios';
import { numberToHex } from 'viem';

import { HashChip } from 'app/atoms/HashChip';
import { Loader } from 'app/atoms/Loader';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import {
  ALCHEMY_GAS_PAYMENT_TOKEN_SYMBOL,
  getAlchemyGasPaymentAssetSlug,
  getAlchemyGasPaymentChainId
} from 'app/pages/Send/alchemy-pay-gas-with-token';
import { EvmReviewData } from 'app/pages/Send/form/interfaces';
import { useAlchemyGasPaymentEstimationData } from 'app/pages/Send/hooks/use-alchemy-gas-payment-estimation-data';
import { dispatch } from 'app/store';
import { addPendingEvmTransferAction, monitorPendingTransfersAction } from 'app/store/evm/pending-transactions/actions';
import { BalancesChangesView } from 'app/templates/balances-changes-view';
import { ChartListItem } from 'app/templates/chart-list-item';
import { CurrentAccount } from 'app/templates/current-account';
import {
  AlchemyPreparedCallBase,
  AlchemyPreparedCallSingle,
  AlchemyCallsStatusResult,
  AlchemyPrepareCallsResult,
  AlchemySignatureRequest,
  AlchemySendPreparedCallsResult,
  getAlchemyCallsStatus,
  isAlchemyPreparedCallArray,
  prepareAlchemyWalletCalls,
  sendAlchemyPreparedCalls
} from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { T, t } from 'lib/i18n';
import { getAssetSymbol, useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { useTempleClient } from 'lib/temple/front';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { delay } from 'lib/utils';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { buildBasicEvmSendParams } from '../../build-basic-evm-send-params';

import { TxData } from './types';
import { useSendBalancesChanges } from './use-send-balances-changes';

interface AlchemyEvmContentProps {
  data: EvmReviewData;
  onClose: EmptyFn;
  onSuccess: (txData: TxData<TempleChainKind.EVM>) => void;
}

const ALCHEMY_STATUS_POLL_INTERVAL = 3_000;
const ALCHEMY_STATUS_POLL_ATTEMPTS = 30;

const isAlchemyPendingStatus = (status: number) => status >= 100 && status < 200;
const getReadableErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    if (responseData && typeof responseData === 'object') {
      const message =
        'error' in responseData && responseData.error && typeof responseData.error === 'object'
          ? (responseData.error as { message?: string }).message
          : undefined;

      if (message) {
        return message;
      }
    }

    return error.message;
  }

  return t('unknownError');
};

export const AlchemyEvmContent: FC<AlchemyEvmContentProps> = ({ data, onClose, onSuccess }) => {
  const { account, network, assetSlug, to, amount, onConfirm } = data;
  const accountPkh = account.address as HexString;
  const alchemyGasPaymentAssetSlug = getAlchemyGasPaymentAssetSlug(network.chainId) ?? assetSlug;

  const assetMetadata = useEvmCategorizedAssetMetadata(assetSlug, network.chainId);
  const alchemyGasPaymentMetadata = useEvmCategorizedAssetMetadata(alchemyGasPaymentAssetSlug, network.chainId);
  const assetSymbol = useMemo(
    () => (alchemyGasPaymentMetadata ? getAssetSymbol(alchemyGasPaymentMetadata) : ALCHEMY_GAS_PAYMENT_TOKEN_SYMBOL),
    [alchemyGasPaymentMetadata]
  );
  const balancesChanges = useSendBalancesChanges(assetSlug, amount, assetMetadata?.decimals);
  const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();
  const { signEvmAuthorization, signEvmHash, signEvmMessage, signEvmTypedData } = useTempleClient();
  const {
    feeAmount,
    error: estimationError,
    isValidating: isEstimating
  } = useAlchemyGasPaymentEstimationData({
    to: to as HexString,
    sendAssetSlug: assetSlug,
    gasPaymentAssetSlug: alchemyGasPaymentAssetSlug,
    accountPkh,
    network,
    amount,
    enabled: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const signSignatureRequest = useCallback(
    async (signatureRequest: AlchemySignatureRequest) => {
      switch (signatureRequest.type) {
        case 'eip7702Auth':
          return signEvmHash(accountPkh, signatureRequest.rawPayload);
        case 'authorization': {
          if (signatureRequest.data.address) {
            return signEvmAuthorization(accountPkh, {
              address: signatureRequest.data.address,
              chainId: signatureRequest.data.chainId,
              nonce: signatureRequest.data.nonce
            });
          }

          if (signatureRequest.data.contractAddress) {
            return signEvmAuthorization(accountPkh, {
              contractAddress: signatureRequest.data.contractAddress,
              chainId: signatureRequest.data.chainId,
              nonce: signatureRequest.data.nonce
            });
          }

          throw new Error('Alchemy authorization request is missing an address');
        }
        case 'eth_signTypedData_v4':
          return signEvmTypedData(accountPkh, signatureRequest.data);
        case 'personal_sign':
          return signEvmMessage(accountPkh, signatureRequest.data);
        default:
          throw new Error('Unsupported Alchemy signature request');
      }
    },
    [accountPkh, signEvmAuthorization, signEvmHash, signEvmMessage, signEvmTypedData]
  );

  const signPreparedCalls = useCallback(
    async (preparedCalls: AlchemyPrepareCallsResult) => {
      const signPreparedCallItem = async (item: AlchemyPreparedCallBase) => ({
        type: item.type,
        data: item.data,
        ...(item.chainId ? { chainId: item.chainId } : {}),
        ...(item.signatureRequest
          ? {
              signature: {
                type: 'secp256k1' as const,
                data: await signSignatureRequest(item.signatureRequest)
              }
            }
          : {})
      });

      if (isAlchemyPreparedCallArray(preparedCalls)) {
        return {
          type: 'array',
          data: await Promise.all(preparedCalls.data.map(signPreparedCallItem))
        };
      }

      const singlePreparedCall: AlchemyPreparedCallSingle = preparedCalls;
      return signPreparedCallItem(singlePreparedCall);
    },
    [signSignatureRequest]
  );

  const waitForTransactionHash = useCallback(async (callId: string) => {
    for (let attempt = 0; attempt < ALCHEMY_STATUS_POLL_ATTEMPTS; attempt++) {
      const response = await getAlchemyCallsStatus<AlchemyCallsStatusResult>({ callId });

      if (response?.error) {
        throw new Error(response.error.message);
      }

      const result = response?.result;

      if (!result) {
        throw new Error('Alchemy calls status is unavailable');
      }

      if (isAlchemyPendingStatus(result.status)) {
        await delay(ALCHEMY_STATUS_POLL_INTERVAL);
        continue;
      }

      if (result.status !== 200) {
        throw new Error(`Alchemy prepared calls failed with status ${result.status}`);
      }

      const receipt = result.receipts?.[0];
      if (!receipt?.transactionHash) {
        throw new Error('Alchemy calls status did not return a transaction hash');
      }

      if (receipt.status && receipt.status !== '0x1') {
        throw new Error('Alchemy prepared calls transaction failed');
      }

      return receipt.transactionHash;
    }

    throw new Error('Timed out while waiting for the Alchemy prepared calls transaction hash');
  }, []);

  const onSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    if (!assetMetadata) {
      setSubmitError(new Error('Asset metadata not found'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const {
        to: txDestination,
        value,
        data: txData
      } = buildBasicEvmSendParams(accountPkh, to as HexString, assetMetadata, amount);

      const prepareResponse = await prepareAlchemyWalletCalls<AlchemyPrepareCallsResult>({
        chainId: getAlchemyGasPaymentChainId(network.chainId),
        from: accountPkh,
        paymasterService: true,
        calls: [
          {
            to: txDestination,
            value: numberToHex(value),
            ...(txData ? { data: txData } : {})
          }
        ]
      });

      if (prepareResponse?.error) {
        throw new Error(prepareResponse.error.message);
      }

      if (!prepareResponse?.result) {
        throw new Error('Alchemy prepare calls response is empty');
      }

      const signedPreparedCalls = await signPreparedCalls(prepareResponse.result);
      const sendResponse = await sendAlchemyPreparedCalls<AlchemySendPreparedCallsResult>(signedPreparedCalls);

      if (sendResponse?.error) {
        throw new Error(sendResponse.error.message);
      }

      const callId = sendResponse?.result?.id;
      if (!callId) {
        throw new Error('Alchemy send prepared calls response is empty');
      }

      const txHash = await waitForTransactionHash(callId);

      onConfirm();
      onSuccess({ txHash });

      const blockExplorer = getActiveBlockExplorer(network.chainId.toString());

      showTxSubmitToastWithDelay(TempleChainKind.EVM, txHash, blockExplorer.url);

      dispatch(
        addPendingEvmTransferAction({
          txHash,
          accountPkh,
          assetSlug,
          network,
          blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, txHash, 'tx', TempleChainKind.EVM),
          submittedAt: Date.now()
        })
      );
      dispatch(monitorPendingTransfersAction());
    } catch (error) {
      console.error(error);
      setSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accountPkh,
    amount,
    assetMetadata,
    assetSlug,
    getActiveBlockExplorer,
    isSubmitting,
    network,
    onConfirm,
    onSuccess,
    signPreparedCalls,
    to,
    waitForTransactionHash
  ]);

  const errorMessage = useMemo(() => {
    const error = submitError ?? estimationError;
    if (!error) {
      return null;
    }

    return getReadableErrorMessage(error);
  }, [estimationError, submitError]);

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <div className="my-4">
          <BalancesChangesView balancesChanges={balancesChanges} chain={network} />
        </div>

        <CurrentAccount />

        <div className="mt-4 flex flex-col px-4 py-3 rounded-lg border-0.5 border-lines bg-white">
          <ChartListItem title="Recipient">
            <HashChip hash={to} firstCharsCount={6} />
          </ChartListItem>

          <ChartListItem title="Gas payment" bottomSeparator={false}>
            {feeAmount ? (
              <span className="text-font-num-12 text-text">
                {feeAmount} {assetSymbol}
              </span>
            ) : (
              <Loader size="XS" trackVariant="dark" className="text-secondary" />
            )}
          </ChartListItem>
        </div>

        <div className="mt-3 px-1 text-font-description text-grey-1">
          Gas will be paid in {assetSymbol} through the Alchemy paymaster demo flow.
        </div>

        {errorMessage ? <div className="mt-3 px-1 text-font-description text-error">{errorMessage}</div> : null}
      </div>

      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onClose} disabled={isSubmitting}>
          <T id="cancel" />
        </StyledButton>

        <StyledButton
          color="primary"
          size="L"
          className="w-full"
          onClick={onSubmit}
          loading={isSubmitting}
          disabled={isEstimating || !feeAmount}
        >
          <T id={submitError ? 'retry' : 'confirm'} />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};
