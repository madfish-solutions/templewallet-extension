import React, { FC, useCallback, useMemo } from 'react';

import { useForm } from 'react-hook-form';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useFormAnalytics } from 'lib/analytics';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { getAssetSymbol } from 'lib/metadata';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useAccountForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { BaseForm } from './BaseForm';
import { SendFormData } from './interfaces';

interface Props {
  chainId: number;
  assetSlug: string;
  onSelectMyAccountClick: EmptyFn;
  onSelectAssetClick: EmptyFn;
  onAddContactRequested: (address: string) => void;
}

export const EvmForm: FC<Props> = ({ chainId, assetSlug, onSelectAssetClick }) => {
  const account = useAccountForEvm();
  const network = useEvmChainByChainId(chainId);

  if (!account || !network) throw new DeadEndBoundaryError();

  const formAnalytics = useFormAnalytics('SendForm');

  const storedMetadata = useEvmTokenMetadataSelector(network.chainId, assetSlug);
  const assetMetadata = isEvmNativeTokenSlug(assetSlug) ? network?.currency : storedMetadata;

  const assetSymbol = useMemo(() => getAssetSymbol(assetMetadata), [assetMetadata]);

  const assetPrice = useAssetFiatCurrencyPrice(assetSlug, chainId, true);

  const accountPkh = account.address as HexString;

  const form = useForm<SendFormData>({
    mode: 'onChange'
  });

  const { formState, reset } = form;

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;

    formAnalytics.trackSubmit();

    try {
      reset({ to: '' });

      formAnalytics.trackSubmitSuccess();
    } catch (err: any) {
      console.error(err);

      formAnalytics.trackSubmitFail();

      if (err?.message === 'Declined') {
        return;
      }
    }
  }, [formState.isSubmitting, reset, formAnalytics]);

  return (
    <BaseForm
      form={form}
      network={network}
      accountPkh={accountPkh}
      assetSlug={assetSlug}
      assetSymbol={assetSymbol}
      assetPrice={assetPrice}
      assetDecimals={assetMetadata?.decimals ?? 0}
      validateAmount={(value: string) => Boolean(value)}
      validateRecipient={(value: string) => Boolean(value)}
      onSelectAssetClick={onSelectAssetClick}
      onSubmit={onSubmit}
    />
  );
};
