import React, { FC, useCallback, useMemo, useRef, useState } from 'react';

import { formatEther, parseEther } from 'viem';

import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import SegmentedControl from 'app/atoms/SegmentedControl';
import { StyledButton } from 'app/atoms/StyledButton';
import { SendFormData } from 'app/pages/Send/form/interfaces';
import { toastError, toastSuccess } from 'app/toaster';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { getReadOnlyEvm } from 'temple/evm';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { CurrentAccount } from './components/CurrentAccount';
import { Header } from './components/Header';
import { AdvancedTab } from './tabs/Advanced';
import { DetailsTab } from './tabs/Details';
import { FeeTab } from './tabs/Fee';

interface ConfirmSendModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  chainAssetSlug: string;
  data: SendFormData | null;
}

export const ConfirmSendModal: FC<ConfirmSendModalProps> = ({ opened, onRequestClose, chainAssetSlug, data }) => (
  <PageModal title="Confirm Send" opened={opened} onRequestClose={onRequestClose}>
    {data && <Content chainAssetSlug={chainAssetSlug} data={data} onRequestClose={onRequestClose} />}
  </PageModal>
);

interface ContentProps extends Omit<ConfirmSendModalProps, 'opened'> {
  data: SendFormData;
}

const Content: FC<ContentProps> = ({ chainAssetSlug, data, onRequestClose }) => {
  const { to, amount } = data;

  const { sendEvmTransaction } = useTempleClient();

  const [isConfirming, setIsConfirming] = useState(false);

  const [_, chainId, assetSlug] = useMemo(() => parseChainAssetSlug(chainAssetSlug), [chainAssetSlug]);

  const accountPkh = useAccountAddressForEvm()!;

  const network = useEvmChainByChainId(chainId as number)!;

  const estimateFee = useCallback(async () => {
    try {
      const publicClient = getReadOnlyEvm(network.rpcBaseURL);
      let gas = BigInt(0);

      if (isEvmNativeTokenSlug(assetSlug)) {
        gas = await publicClient.estimateGas({
          account: accountPkh,
          to: to as HexString,
          value: parseEther(amount)
        });
      }

      const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas();

      return { estimatedFee: gas * maxFeePerGas, gas, maxFeePerGas, maxPriorityFeePerGas };
    } catch (err) {
      console.warn(err);

      return undefined;
    }
  }, [accountPkh, assetSlug, amount, to, network.rpcBaseURL]);

  const { data: estimationData, isValidating: estimatingFee } = useTypedSWR(
    ['evm-transaction-fee', chainId, assetSlug, accountPkh, to],
    estimateFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 10_000
    }
  );

  const [tab, setTab] = useState('details');

  const activeIndexRef = useRef<number | null>(null);

  const goToFeeTab = useCallback(() => {
    activeIndexRef.current = 1;
    setTab('fee');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (isConfirming) return;

    if (!estimationData) {
      toastError('Failed to estimate transaction.');

      return;
    }

    setIsConfirming(true);

    try {
      onRequestClose();

      const txHash = await sendEvmTransaction(accountPkh, {
        to: to as HexString,
        amount: parseEther(amount),
        ...estimationData
      });
      toastSuccess('Transaction Submitted. Hash: ', true, txHash);
    } catch (err: any) {
      console.log(err);

      toastError('Oops, Something went wrong!');
    } finally {
      setIsConfirming(false);
    }
  }, [accountPkh, amount, estimationData, isConfirming, onRequestClose, sendEvmTransaction, to]);

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <Header chainAssetSlug={chainAssetSlug} amount={amount} />

        <CurrentAccount />

        <SegmentedControl
          name="confirm-send-tabs"
          setActiveSegment={val => setTab(val)}
          controlRef={useRef<HTMLDivElement>(null)}
          activeIndexRef={activeIndexRef}
          className="mt-6 mb-4"
          segments={[
            {
              label: 'Details',
              value: 'details',
              ref: useRef<HTMLDivElement>(null)
            },
            {
              label: 'Fee',
              value: 'fee',
              ref: useRef<HTMLDivElement>(null)
            },
            {
              label: 'Advanced',
              value: 'advanced',
              ref: useRef<HTMLDivElement>(null)
            }
          ]}
        />

        <div className="flex-1 flex flex-col">
          {(() => {
            switch (tab) {
              case 'fee':
                return <FeeTab />;
              case 'advanced':
                return <AdvancedTab />;
              default:
                return (
                  <DetailsTab
                    chainAssetSlug={chainAssetSlug}
                    recipientAddress={to}
                    estimatingFee={estimatingFee}
                    estimatedFee={estimationData ? formatEther(estimationData.estimatedFee) : '0'}
                    goToFeeTab={goToFeeTab}
                  />
                );
            }
          })()}
        </div>
      </div>
      <ActionsButtonsBox flexDirection="row" className="gap-x-2.5">
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onRequestClose}>
          <T id="cancel" />
        </StyledButton>

        <StyledButton size="L" className="w-full" color="primary" onClick={handleConfirm}>
          <T id="confirm" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};
