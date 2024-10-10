import React, { FC, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { isString } from 'lodash';
import { FormProvider, useForm } from 'react-hook-form-v7';
import { formatEther, isAddress } from 'viem';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useFormAnalytics } from 'lib/analytics';
import { useEvmTokenBalance } from 'lib/balances/hooks';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { t, toLocalFixed } from 'lib/i18n';
import { getAssetSymbol } from 'lib/metadata';
import { useSafeState } from 'lib/ui/hooks';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { getAccountAddressForEvm } from 'temple/accounts';
import { useAccountForEvm, useVisibleAccounts } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { useEvmAddressByDomainName } from 'temple/front/evm/ens';
import { useSettings } from 'temple/front/ready';

import { useEvmEstimationData } from '../hooks/use-evm-estimation-data';

import { BaseForm } from './BaseForm';
import { ReviewData, SendFormData } from './interfaces';
import { getMaxAmountFiat } from './utils';

interface Props {
  chainId: number;
  assetSlug: string;
  onSelectAssetClick: EmptyFn;
  onReview: (data: ReviewData) => void;
}

export const EvmForm: FC<Props> = ({ chainId, assetSlug, onSelectAssetClick, onReview }) => {
  const account = useAccountForEvm();
  const network = useEvmChainByChainId(chainId);

  if (!account || !network) throw new DeadEndBoundaryError();

  const allAccounts = useVisibleAccounts();
  const { contacts } = useSettings();

  const accountPkh = account.address as HexString;

  const formAnalytics = useFormAnalytics('SendForm');

  const { value: balance = ZERO } = useEvmTokenBalance(assetSlug, accountPkh, network);

  const [shouldUseFiat, setShouldUseFiat] = useSafeState(false);

  const storedMetadata = useEvmTokenMetadataSelector(network.chainId, assetSlug);
  const assetMetadata = isEvmNativeTokenSlug(assetSlug) ? network?.currency : storedMetadata;

  const assetDecimals = assetMetadata?.decimals ?? 0;

  const assetSymbol = useMemo(() => getAssetSymbol(assetMetadata), [assetMetadata]);

  const assetPrice = useAssetFiatCurrencyPrice(assetSlug, chainId, true);

  const canToggleFiat = assetPrice.gt(ZERO);

  const form = useForm<SendFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  const { watch, formState } = form;

  const toValue = watch('to');

  const { data: resolvedAddress } = useEvmAddressByDomainName(toValue, network);

  const toFilled = useMemo(
    () => Boolean(toValue && (isAddress(toValue) || isString(resolvedAddress))),
    [resolvedAddress, toValue]
  );

  const toResolved = useMemo(() => {
    if (resolvedAddress) return resolvedAddress;

    return toValue;
  }, [resolvedAddress, toValue]);

  const isToFilledWithFamiliarAddress = useMemo(() => {
    if (!toFilled) return false;

    let value = false;

    allAccounts.forEach(acc => {
      const evmAddress = getAccountAddressForEvm(acc);

      if (evmAddress === toResolved) value = true;
    });

    contacts?.forEach(contact => {
      if (contact.address === toResolved) value = true;
    });

    return value;
  }, [allAccounts, contacts, toFilled, toResolved]);

  const { data: estimationData, isValidating: estimating } = useEvmEstimationData(
    toResolved as HexString,
    assetSlug,
    accountPkh,
    network,
    toFilled
  );

  const maxAmount = useMemo(() => {
    const fee = estimationData?.estimatedFee;

    if (!fee) return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), balance) : balance;

    const maxAmountAsset = isEvmNativeTokenSlug(assetSlug)
      ? balance.minus(new BigNumber(fee ? formatEther(fee) : 0))
      : balance;

    return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), maxAmountAsset) : maxAmountAsset;
  }, [estimationData, assetSlug, balance, shouldUseFiat, assetPrice]);

  const validateAmount = useCallback(
    (amount: string) => {
      if (!amount) return t('required');
      if (Number(amount) === 0) return t('amountMustBePositive');

      return new BigNumber(amount).isLessThanOrEqualTo(maxAmount) || t('maximalAmount', toLocalFixed(maxAmount));
    },
    [maxAmount]
  );

  const validateRecipient = useCallback(
    (address: string) => {
      if (!address) return t('required');

      return isString(resolvedAddress) || isAddress(address) || t('invalidAddressOrDomain');
    },
    [resolvedAddress]
  );

  const toAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value) =>
      new BigNumber(fiatAmount)
        .dividedBy(assetPrice ?? 1)
        .toFormat(assetMetadata?.decimals ?? 0, BigNumber.ROUND_FLOOR, {
          decimalSeparator: '.'
        }),
    [assetPrice, assetMetadata?.decimals]
  );

  const onSubmit = useCallback(
    async ({ amount }: SendFormData) => {
      if (formState.isSubmitting) return;

      formAnalytics.trackSubmit();

      const actualAmount = shouldUseFiat ? toAssetAmount(amount) : amount;

      onReview({ account, assetSlug, network, amount: actualAmount, to: toResolved });

      formAnalytics.trackSubmitSuccess();
    },
    [
      account,
      assetSlug,
      formAnalytics,
      formState.isSubmitting,
      network,
      onReview,
      shouldUseFiat,
      toAssetAmount,
      toResolved
    ]
  );

  return (
    <FormProvider {...form}>
      <BaseForm
        evm
        network={network}
        accountPkh={accountPkh}
        assetSlug={assetSlug}
        assetSymbol={assetSymbol}
        assetPrice={assetPrice}
        maxAmount={maxAmount}
        maxEstimating={estimating}
        assetDecimals={assetDecimals}
        canToggleFiat={canToggleFiat}
        shouldUseFiat={shouldUseFiat}
        setShouldUseFiat={setShouldUseFiat}
        validateAmount={validateAmount}
        validateRecipient={validateRecipient}
        onSelectAssetClick={onSelectAssetClick}
        isToFilledWithFamiliarAddress={isToFilledWithFamiliarAddress}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};
