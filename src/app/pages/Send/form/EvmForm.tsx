import React, { FC, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { isString } from 'lodash';
import { useForm } from 'react-hook-form';
import { formatEther, getAddress, isAddress, parseEther } from 'viem';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useEvmTokenMetadataSelector } from 'app/store/evm/tokens-metadata/selectors';
import { useFormAnalytics } from 'lib/analytics';
import { useEvmTokenBalance } from 'lib/balances/hooks';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { getAssetSymbol } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ZERO } from 'lib/utils/numbers';
import { getReadOnlyEvm } from 'temple/evm';
import { useAccountForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { useEvmAddressByDomainName } from 'temple/front/evm/ens';

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

  const accountPkh = account.address as HexString;

  const formAnalytics = useFormAnalytics('SendForm');

  const { value: balance = ZERO } = useEvmTokenBalance(assetSlug, accountPkh, network);
  //const { value: nativeBalance = ZERO } = useEvmTokenBalance(EVM_TOKEN_SLUG, accountPkh, network);

  const storedMetadata = useEvmTokenMetadataSelector(network.chainId, assetSlug);
  const assetMetadata = isEvmNativeTokenSlug(assetSlug) ? network?.currency : storedMetadata;

  const assetDecimals = assetMetadata?.decimals ?? 0;

  const assetSymbol = useMemo(() => getAssetSymbol(assetMetadata), [assetMetadata]);

  const assetPrice = useAssetFiatCurrencyPrice(assetSlug, chainId, true);

  const form = useForm<SendFormData>({
    mode: 'onChange'
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
    data: estimatedMaxFee
    //error: estimatedMaxFeeError,
    //isValidating: estimatingMaxFee
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
    } else {
      value = value.div(new BigNumber(10).pow(assetDecimals)).decimalPlaces(assetDecimals, BigNumber.ROUND_DOWN);
    }

    if (value.lt(0)) return ZERO;

    return value;
  }, [assetDecimals, assetSlug, balance, estimatedMaxFee]);

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
      maxAmount={maxAmount}
      assetDecimals={assetDecimals}
      validateAmount={(value: string) => Boolean(value)}
      validateRecipient={(value: string) => Boolean(value)}
      onSelectAssetClick={onSelectAssetClick}
      onSubmit={onSubmit}
    />
  );
};
