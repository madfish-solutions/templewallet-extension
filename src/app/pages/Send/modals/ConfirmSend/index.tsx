import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { omit } from 'lodash';
import { useForm } from 'react-hook-form-v7';
import { formatEther, parseEther } from 'viem';

import { CLOSE_ANIMATION_TIMEOUT, PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import SegmentedControl from 'app/atoms/SegmentedControl';
import Spinner from 'app/atoms/Spinner/Spinner';
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
import { EvmConfirmFormData } from './interfaces';
import { AdvancedTab } from './tabs/Advanced';
import { OptionLabel } from './tabs/components/FeeOptions';
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

export interface ModifiableEstimationData {
  estimatedFee: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface EstimationData extends ModifiableEstimationData {
  gas: bigint;
}

interface ContentProps extends Omit<ConfirmSendModalProps, 'opened'> {
  data: SendFormData;
}

const Content: FC<ContentProps> = ({ chainAssetSlug, data, onRequestClose }) => {
  const { to, amount } = data;

  const { sendEvmTransaction } = useTempleClient();

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

  const { data: estimationData } = useTypedSWR(
    ['evm-transaction-fee', chainId, assetSlug, accountPkh, to],
    estimateFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 10_000
    }
  );

  const form = useForm<EvmConfirmFormData>();
  const { watch, formState, handleSubmit } = form;

  const gasPriceValue = watch('gasPrice');

  const [selectedFeeOption, setSelectedFeeOption] = useState<OptionLabel | null>('mid');
  const [modifiedEstimationData, setModifiedEstimationData] = useState<ModifiableEstimationData | null>(null);

  useEffect(() => {
    if (gasPriceValue) setSelectedFeeOption(null);
  }, [gasPriceValue]);

  const [tab, setTab] = useState('details');

  const activeIndexRef = useRef<number | null>(null);

  const goToFeeTab = useCallback(() => {
    activeIndexRef.current = 1;
    setTab('fee');
  }, []);

  const handleFeeOptionSelect = useCallback((label: OptionLabel, option: ModifiableEstimationData) => {
    setSelectedFeeOption(label);
    setModifiedEstimationData(option);
  }, []);

  const onSubmit = useCallback(
    async ({ gasPrice, gasLimit, nonce }: EvmConfirmFormData) => {
      if (formState.isSubmitting) return;

      if (!estimationData) {
        toastError('Failed to estimate transaction.');

        return;
      }

      try {
        const txHash = await sendEvmTransaction(accountPkh, network, {
          to: to as HexString,
          value: parseEther(amount),
          ...omit(estimationData, 'estimatedFee'),
          ...(modifiedEstimationData ? omit(modifiedEstimationData, 'estimatedFee') : {}),
          ...(gasPrice
            ? { maxFeePerGas: parseEther(gasPrice, 'gwei'), maxPriorityFeePerGas: parseEther(gasPrice, 'gwei') }
            : {}),
          ...(gasLimit ? { gas: BigInt(gasLimit) } : {}),
          ...(nonce ? { nonce: Number(nonce) } : {})
        });

        onRequestClose();

        setTimeout(() => toastSuccess('Transaction Submitted. Hash: ', true, txHash), CLOSE_ANIMATION_TIMEOUT * 2);
      } catch (err: any) {
        console.log(err);

        toastError(err.message);
      }
    },
    [
      accountPkh,
      amount,
      estimationData,
      formState.isSubmitting,
      modifiedEstimationData,
      network,
      onRequestClose,
      sendEvmTransaction,
      to
    ]
  );

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

        <form id="confirm-form" className="flex-1 flex flex-col" onSubmit={handleSubmit(onSubmit)}>
          {estimationData ? (
            (() => {
              switch (tab) {
                case 'fee':
                  return (
                    <FeeTab
                      chainAssetSlug={chainAssetSlug}
                      estimationData={estimationData}
                      selectedOption={selectedFeeOption}
                      form={form}
                      onOptionSelect={handleFeeOptionSelect}
                    />
                  );
                case 'advanced':
                  return <AdvancedTab form={form} />;
                default:
                  return (
                    <DetailsTab
                      chainAssetSlug={chainAssetSlug}
                      recipientAddress={to}
                      estimatedFee={formatEther(
                        modifiedEstimationData ? modifiedEstimationData.estimatedFee : estimationData?.estimatedFee
                      )}
                      goToFeeTab={goToFeeTab}
                    />
                  );
              }
            })()
          ) : (
            <div className="flex justify-center my-10">
              <Spinner theme="gray" className="w-20" />
            </div>
          )}
        </form>
      </div>
      <ActionsButtonsBox flexDirection="row" className="gap-x-2.5" shouldChangeBottomShift={false}>
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onRequestClose}>
          <T id="cancel" />
        </StyledButton>

        <StyledButton
          type="submit"
          form="confirm-form"
          color="primary"
          size="L"
          className="w-full"
          disabled={formState.isSubmitting}
        >
          <T id="confirm" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};
