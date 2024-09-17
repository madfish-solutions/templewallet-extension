import React, { FC, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { isString } from 'lodash';
import { useForm } from 'react-hook-form-v7';
import { formatEther, getAddress, isAddress, parseEther } from 'viem';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useFormAnalytics } from 'lib/analytics';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmTokenBalance } from 'lib/balances/hooks';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { t, toLocalFixed } from 'lib/i18n';
import { getAssetSymbol } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { getAccountAddressForEvm } from 'temple/accounts';
import { getReadOnlyEvm } from 'temple/evm';
import { useAccountForEvm, useVisibleAccounts } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { useEvmAddressByDomainName } from 'temple/front/evm/ens';
import { useSettings } from 'temple/front/ready';

import { BaseForm } from './BaseForm';
import { SendFormData } from './interfaces';

interface Props {
  chainId: number;
  assetSlug: string;
  onSelectAssetClick: EmptyFn;
}

export const EvmForm: FC<Props> = ({ chainId, assetSlug, onSelectAssetClick }) => {
  const account = useAccountForEvm();
  const network = useEvmChainByChainId(chainId);

  if (!account || !network) throw new DeadEndBoundaryError();

  const allAccounts = useVisibleAccounts();
  const { contacts } = useSettings();

  const accountPkh = account.address as HexString;

  const formAnalytics = useFormAnalytics('SendForm');

  const { value: balance = ZERO } = useEvmTokenBalance(assetSlug, accountPkh, network);
  const { value: nativeBalance = ZERO } = useEvmTokenBalance(EVM_TOKEN_SLUG, accountPkh, network);

  const storedMetadata = useEvmTokenMetadataSelector(network.chainId, assetSlug);
  const assetMetadata = isEvmNativeTokenSlug(assetSlug) ? network?.currency : storedMetadata;

  const assetDecimals = assetMetadata?.decimals ?? 0;

  const assetSymbol = useMemo(() => getAssetSymbol(assetMetadata), [assetMetadata]);

  const assetPrice = useAssetFiatCurrencyPrice(assetSlug, chainId, true);

  const form = useForm<SendFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  const { watch, formState, reset } = form;

  const toValue = watch('to');

  const { data: resolvedAddress } = useEvmAddressByDomainName(toValue, network);

  const toFilled = useMemo(
    () => Boolean(toValue && (isAddress(toValue) || isString(resolvedAddress))),
    [resolvedAddress, toValue]
  );

  const toResolved = useMemo(() => {
    if (resolvedAddress) return resolvedAddress;

    try {
      return getAddress(toValue);
    } catch {
      return undefined;
    }
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

  const estimateMaxFee = useCallback(async () => {
    if (!toResolved) return;

    try {
      const publicClient = getReadOnlyEvm(network.rpcBaseURL);
      let gasLimit = BigInt(0);

      if (isEvmNativeTokenSlug(assetSlug)) {
        gasLimit = await publicClient.estimateGas({
          account: accountPkh,
          to: toResolved,
          value: parseEther('1')
        });
      } else {
        // TODO: Write logic for other token standards
      }

      const { maxFeePerGas: gasPrice } = await publicClient.estimateFeesPerGas();

      // TODO: Handle L1 data fee

      return gasLimit * gasPrice;
    } catch (err) {
      console.warn(err);

      return undefined;
    }
  }, [accountPkh, assetSlug, network.rpcBaseURL, toResolved]);

  const {
    data: estimatedMaxFee,
    error: estimatedMaxFeeError,
    isValidating: estimatingMaxFee
  } = useTypedSWR(
    () => (toFilled ? ['max-transaction-fee', chainId, assetSlug, accountPkh, toResolved] : null),
    estimateMaxFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 10_000
    }
  );

  const maxAmount = useMemo(() => {
    let value = balance;

    if (isEvmNativeTokenSlug(assetSlug)) {
      value = value.minus(new BigNumber(estimatedMaxFee ? formatEther(estimatedMaxFee) : 0));
    }

    if (value.lt(0)) return ZERO;

    return value;
  }, [assetSlug, balance, estimatedMaxFee]);

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
  }, [formAnalytics, formState.isSubmitting, reset]);

  return (
    <BaseForm
      evm
      form={form}
      network={network}
      accountPkh={accountPkh}
      assetSlug={assetSlug}
      assetSymbol={assetSymbol}
      assetPrice={assetPrice}
      maxAmount={maxAmount}
      maxEstimating={estimatingMaxFee}
      assetDecimals={assetDecimals}
      validateAmount={validateAmount}
      validateRecipient={validateRecipient}
      onSelectAssetClick={onSelectAssetClick}
      isToFilledWithFamiliarAddress={isToFilledWithFamiliarAddress}
      onSubmit={onSubmit}
    />
  );
};
