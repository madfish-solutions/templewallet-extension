import React, { FC, useCallback, useImperativeHandle, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { isString } from 'lodash';
import { FormProvider, useForm } from 'react-hook-form';
import { formatEther, isAddress } from 'viem';

import { SettingsCheckbox } from 'app/atoms/SettingsCheckbox';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useFormAnalytics } from 'lib/analytics';
import { fromAssetSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { VITALIK_ADDRESS } from 'lib/constants';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { t, toLocalFixed } from 'lib/i18n';
import { getAssetSymbol, useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { isEvmCollectible } from 'lib/metadata/utils';
import { TempleAccountType } from 'lib/temple/types';
import { useSafeState } from 'lib/ui/hooks';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { getAccountAddressForEvm } from 'temple/accounts';
import { useAccountForEvm, useVisibleAccounts } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { useEvmAddressByDomainName } from 'temple/front/evm/ens';
import { useSettings } from 'temple/front/ready';

import { isAlchemyGasPaymentSupportedAsset } from '../alchemy-pay-gas-with-token';
import { useSendFormControl } from '../context';
import { useAlchemyGasPaymentEstimationData } from '../hooks/use-alchemy-gas-payment-estimation-data';
import { useEvmEstimationData } from '../hooks/use-evm-estimation-data';

import { BaseForm } from './BaseForm';
import { ReviewData, SendFormData } from './interfaces';
import { getMaxAmountFiat } from './utils';

interface Props {
  chainId: number;
  assetSlug: string;
  onSelectAssetClick: EmptyFn;
  onReview: SyncFn<ReviewData>;
}

export const EvmForm: FC<Props> = ({ chainId, assetSlug, onSelectAssetClick, onReview }) => {
  const account = useAccountForEvm();
  const network = useEvmChainByChainId(chainId);

  const formControlRef = useSendFormControl();

  if (!account || !network) throw new DeadEndBoundaryError();

  const assetMetadata = useEvmCategorizedAssetMetadata(assetSlug, network.chainId);

  if (!assetMetadata) throw new Error('Metadata not found');

  const allAccounts = useVisibleAccounts();
  const { contacts } = useSettings();

  const accountPkh = account.address as HexString;

  const formAnalytics = useFormAnalytics('SendForm');

  const { value: balance = ZERO } = useEvmAssetBalance(assetSlug, accountPkh, network);
  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh, network);

  const [shouldUseFiat, setShouldUseFiat] = useSafeState(false);

  const isNft = isEvmCollectible(assetMetadata);
  const assetDecimals = assetMetadata.decimals ?? 0;

  const assetSymbol = useMemo(() => getAssetSymbol(assetMetadata), [assetMetadata]);

  const assetPrice = useAssetFiatCurrencyPrice(assetSlug, chainId, true);

  const canToggleFiat = !network.testnet && assetPrice.isGreaterThan(ZERO);

  const form = useForm<SendFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  const { watch, formState, reset } = form;

  const toValue = watch('to');
  const amountValue = watch('amount');

  const { data: resolvedAddress } = useEvmAddressByDomainName(toValue, network);

  const toFilled = Boolean(toValue && (isAddress(toValue) || isString(resolvedAddress)));

  const toResolved = resolvedAddress || toValue;
  const alchemyGasPaymentSupported = useMemo(
    () => account.type !== TempleAccountType.Ledger && isAlchemyGasPaymentSupportedAsset(assetSlug, network.chainId),
    [account.type, assetSlug, network.chainId]
  );
  const [shouldUseAlchemyGasPayment, setShouldUseAlchemyGasPayment] = useSafeState(false);
  const minimalAlchemyEstimateAmount = useMemo(
    () => (assetDecimals > 0 ? `0.${'0'.repeat(assetDecimals - 1)}1` : '1'),
    [assetDecimals]
  );
  const alchemyEstimateAmount = useMemo(() => {
    if (!alchemyGasPaymentSupported) {
      return undefined;
    }

    return amountValue && Number(amountValue) > 0 ? amountValue : minimalAlchemyEstimateAmount;
  }, [alchemyGasPaymentSupported, amountValue, minimalAlchemyEstimateAmount]);

  const isToFilledWithFamiliarAddress = useMemo(() => {
    if (!toFilled) return false;

    if (allAccounts.some(acc => getAccountAddressForEvm(acc) === toResolved)) return true;
    if (contacts?.some(contact => contact.address === toResolved)) return true;

    return false;
  }, [allAccounts, contacts, toFilled, toResolved]);

  const { data: estimationData, isValidating: estimating } = useEvmEstimationData({
    to: toResolved as HexString,
    assetSlug,
    accountPkh,
    network,
    balance,
    ethBalance,
    toFilled: toFilled && !shouldUseAlchemyGasPayment
  });
  const { data: toVitalikEstimationData, isValidating: toVitalikEstimating } = useEvmEstimationData({
    to: VITALIK_ADDRESS,
    assetSlug,
    accountPkh,
    network,
    balance,
    ethBalance,
    toFilled: !shouldUseAlchemyGasPayment,
    silent: true
  });
  const { feeAmount: alchemyFeeAmount, isValidating: alchemyEstimating } = useAlchemyGasPaymentEstimationData({
    to: (toFilled ? toResolved : VITALIK_ADDRESS) as HexString,
    assetSlug,
    accountPkh,
    network,
    amount: alchemyEstimateAmount ?? minimalAlchemyEstimateAmount,
    enabled: shouldUseAlchemyGasPayment && alchemyGasPaymentSupported
  });

  const maxAmount = useMemo(() => {
    if (shouldUseAlchemyGasPayment) {
      if (!alchemyFeeAmount) {
        return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), balance) : balance;
      }

      const maxAmountAsset = BigNumber.max(balance.minus(alchemyFeeAmount), ZERO);

      return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), maxAmountAsset) : maxAmountAsset;
    }

    const fee = estimationData?.estimatedFee ?? toVitalikEstimationData?.estimatedFee;

    if (!fee) return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), balance) : balance;

    const maxAmountAsset = isEvmNativeTokenSlug(assetSlug)
      ? BigNumber.max(balance.minus(formatEther(fee)), ZERO)
      : balance;

    return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), maxAmountAsset) : maxAmountAsset;
  }, [
    alchemyFeeAmount,
    assetPrice,
    assetSlug,
    balance,
    estimationData,
    shouldUseAlchemyGasPayment,
    shouldUseFiat,
    toVitalikEstimationData
  ]);

  const validateAmount = useCallback(
    (amount: string) => {
      if (!amount) return t('required');
      if (Number(amount) === 0) return t('amountMustBePositive');

      if (shouldUseAlchemyGasPayment && alchemyFeeAmount) {
        return (
          new BigNumber(amount).plus(alchemyFeeAmount).isLessThanOrEqualTo(balance) ||
          t('maximalAmount', toLocalFixed(maxAmount, Math.min(assetDecimals, 6)))
        );
      }

      return (
        new BigNumber(amount).isLessThanOrEqualTo(maxAmount) ||
        t('maximalAmount', toLocalFixed(maxAmount, Math.min(assetDecimals, 6)))
      );
    },
    [alchemyFeeAmount, assetDecimals, balance, maxAmount, shouldUseAlchemyGasPayment]
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
      new BigNumber(fiatAmount).dividedBy(assetPrice ?? 1).toFormat(assetDecimals, BigNumber.ROUND_FLOOR, {
        decimalSeparator: '.'
      }),
    [assetPrice, assetDecimals]
  );

  const resetForm = useCallback(() => {
    reset({ to: '', amount: '' });
    setShouldUseFiat(false);
    setShouldUseAlchemyGasPayment(false);
  }, [reset, setShouldUseAlchemyGasPayment, setShouldUseFiat]);

  useImperativeHandle(formControlRef, () => ({ resetForm }));

  const onSubmit = useCallback(
    async ({ amount }: SendFormData) => {
      if (formState.isSubmitting) return;

      const actualAmount = shouldUseFiat ? toAssetAmount(amount) : amount;
      const contract = isEvmNativeTokenSlug(assetSlug)
        ? 'gas'
        : (() => {
            const [contractAddress] = fromAssetSlug<HexString>(assetSlug);
            return contractAddress;
          })();

      const analyticsPayload = {
        network: network.name,
        inputAsset: assetSymbol,
        inputAmount: String(actualAmount),
        contract
      };

      formAnalytics.trackSubmit(analyticsPayload);

      onReview({
        account,
        assetSlug,
        network,
        amount: actualAmount,
        to: toResolved,
        useAlchemyGasPayment: shouldUseAlchemyGasPayment,
        onConfirm: resetForm
      });
      formAnalytics.trackSubmitSuccess(analyticsPayload);
    },
    [
      account,
      assetSlug,
      assetSymbol,
      formAnalytics,
      formState.isSubmitting,
      network,
      onReview,
      resetForm,
      shouldUseAlchemyGasPayment,
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
        isCollectible={isNft}
        maxAmount={maxAmount}
        assetDecimals={assetDecimals}
        canToggleFiat={canToggleFiat}
        shouldUseFiat={shouldUseFiat}
        setShouldUseFiat={setShouldUseFiat}
        validateAmount={validateAmount}
        validateRecipient={validateRecipient}
        onSelectAssetClick={onSelectAssetClick}
        isToFilledWithFamiliarAddress={isToFilledWithFamiliarAddress}
        shouldShowConvertedAmountBlock={!isEvmCollectible(assetMetadata)}
        extraContent={
          alchemyGasPaymentSupported ? (
            <SettingsCheckbox
              checked={shouldUseAlchemyGasPayment}
              onChange={setShouldUseAlchemyGasPayment}
              label="Pay gas with this token (Alchemy demo)"
            />
          ) : undefined
        }
        onSubmit={onSubmit}
        maxEstimating={shouldUseAlchemyGasPayment ? alchemyEstimating : toFilled ? estimating : toVitalikEstimating}
      />
    </FormProvider>
  );
};
