import React, { FC, useCallback, useEffect, useMemo } from 'react';

import { getRevealFee, ChainIds } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { useForm } from 'react-hook-form-v7';

import { ArtificialError, NotEnoughFundsError, ZeroBalanceError, ZeroTEZBalanceError } from 'app/defaults';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { toastError } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { isTezAsset, TEZ_TOKEN_SLUG, toPenny } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { toLocalFixed, t } from 'lib/i18n';
import { useTezosAssetMetadata, getAssetSymbol } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { validateRecipient as validateAddress } from 'lib/temple/front';
import { mutezToTz } from 'lib/temple/helpers';
import { isValidTezosAddress, isTezosContractAddress, tezosManagerKeyHasManager } from 'lib/tezos';
import { useSafeState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { getAccountAddressForTezos } from 'temple/accounts';
import { useAccountForTezos, useTezosChainByChainId, useVisibleAccounts } from 'temple/front';
import { useSettings } from 'temple/front/ready';
import {
  isTezosDomainsNameValid,
  getTezosToolkitWithSigner,
  getTezosDomainsClient,
  useTezosAddressByDomainName
} from 'temple/front/tezos';

import { BaseForm } from './BaseForm';
import { ConfirmData, SendFormData } from './interfaces';
import { estimateTezosMaxFee, getBaseFeeError, getFeeError, getMaxAmountFiat, getTezosMaxAmountToken } from './utils';

const PENNY = 0.000001;
const RECOMMEDED_ADD_FEE = 0.0001;

interface Props {
  chainId: string;
  assetSlug: string;
  onSelectAssetClick: EmptyFn;
  onConfirm: (data: ConfirmData) => void;
}

export const TezosForm: FC<Props> = ({ chainId, assetSlug, onSelectAssetClick, onConfirm }) => {
  const account = useAccountForTezos();
  const network = useTezosChainByChainId(chainId);

  if (!account || !network) throw new DeadEndBoundaryError();

  const allAccounts = useVisibleAccounts();
  const { contacts } = useSettings();

  const assetMetadata = useTezosAssetMetadata(assetSlug, chainId);
  const assetPrice = useAssetFiatCurrencyPrice(assetSlug, chainId);

  const assetSymbol = useMemo(() => getAssetSymbol(assetMetadata), [assetMetadata]);

  const accountPkh = account.address;
  const tezos = getTezosToolkitWithSigner(network.rpcBaseURL, account.ownerAddress || accountPkh);
  const domainsClient = getTezosDomainsClient(network.chainId, network.rpcBaseURL);

  const formAnalytics = useFormAnalytics('SendForm');

  const { value: balance = ZERO } = useTezosAssetBalance(assetSlug, accountPkh, network);
  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const [shouldUseFiat, setShouldUseFiat] = useSafeState(false);

  const canToggleFiat = network.chainId === ChainIds.MAINNET;

  const form = useForm<SendFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  const { watch, formState, trigger, reset } = form;

  const toValue = watch('to');

  const toFilledWithAddress = useMemo(() => Boolean(toValue && isValidTezosAddress(toValue)), [toValue]);

  const toFilledWithDomain = useMemo(
    () => toValue && isTezosDomainsNameValid(toValue, domainsClient),
    [toValue, domainsClient]
  );

  const { data: resolvedAddress } = useTezosAddressByDomainName(toValue, network);

  const toFilled = useMemo(
    () => (resolvedAddress ? toFilledWithDomain : toFilledWithAddress),
    [toFilledWithAddress, toFilledWithDomain, resolvedAddress]
  );

  const toResolved = useMemo(() => resolvedAddress || toValue, [resolvedAddress, toValue]);

  const isToFilledWithFamiliarAddress = useMemo(() => {
    if (!toFilled) return false;

    let value = false;

    allAccounts.forEach(acc => {
      const tezosAddress = getAccountAddressForTezos(acc);

      if (tezosAddress === toResolved) value = true;
    });

    contacts?.forEach(contact => {
      if (contact.address === toResolved) value = true;
    });

    return value;
  }, [allAccounts, contacts, toFilled, toResolved]);

  const estimateBaseFee = useCallback(async () => {
    try {
      if (!assetMetadata) throw new Error('Metadata not found');

      const to = toResolved;
      const tez = isTezAsset(assetSlug);

      if (balance.isZero()) {
        throw new ZeroBalanceError();
      }

      if (!tez) {
        if (tezBalance.isZero()) {
          throw new ZeroTEZBalanceError();
        }
      }

      const [transferParams, manager] = await Promise.all([
        toTransferParams(tezos, assetSlug, assetMetadata, accountPkh, to, toPenny(assetMetadata)),
        tezos.rpc.getManagerKey(account.ownerAddress || accountPkh)
      ]);

      const estmtnMax = await estimateTezosMaxFee(account, tez, tezos, to, balance, transferParams, manager);

      let estimatedBaseFee = mutezToTz(estmtnMax.burnFeeMutez + estmtnMax.suggestedFeeMutez);
      if (!tezosManagerKeyHasManager(manager)) {
        estimatedBaseFee = estimatedBaseFee.plus(mutezToTz(getRevealFee(to)));
      }

      if (tez ? estimatedBaseFee.isGreaterThanOrEqualTo(balance) : estimatedBaseFee.isGreaterThan(tezBalance)) {
        throw new NotEnoughFundsError();
      }

      return estimatedBaseFee;
    } catch (err) {
      console.error(err);

      if (err instanceof ArtificialError) {
        return err;
      }

      throw err;
    }
  }, [tezBalance, balance, assetMetadata, toResolved, assetSlug, tezos, accountPkh, account]);

  const {
    data: baseFee,
    error: estimateBaseFeeError,
    isValidating: estimating
  } = useTypedSWR(
    () => (toFilled ? ['transfer-base-fee', tezos.clientId, assetSlug, accountPkh, toResolved] : null),
    estimateBaseFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: TEZOS_BLOCK_DURATION
    }
  );
  const feeError = getBaseFeeError(baseFee, estimateBaseFeeError);
  const estimationError = getFeeError(estimating, feeError);

  const maxAddFee = useMemo(() => {
    if (baseFee instanceof BigNumber) {
      return tezBalance?.minus(baseFee).minus(PENNY).toNumber();
    }
    return undefined;
  }, [tezBalance, baseFee]);

  const maxAmount = useMemo(() => {
    if (!(baseFee instanceof BigNumber)) {
      return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), balance) : balance;
    }

    const maxAmountAsset = isTezAsset(assetSlug)
      ? getTezosMaxAmountToken(account.type, balance, baseFee, maxAddFee || RECOMMEDED_ADD_FEE)
      : balance;

    return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), maxAmountAsset) : maxAmountAsset;
  }, [baseFee, assetSlug, account.type, balance, maxAddFee, shouldUseFiat, assetPrice]);

  const validateAmount = useCallback(
    (amount: string) => {
      if (!amount) return t('required');
      if (toValue && !isTezosContractAddress(toValue) && Number(amount) === 0) return t('amountMustBePositive');

      return new BigNumber(amount).isLessThanOrEqualTo(maxAmount) || t('maximalAmount', toLocalFixed(maxAmount));
    },
    [maxAmount, toValue]
  );

  const validateRecipient = useCallback(
    (address: string) => {
      if (!address) return t('required');

      return validateAddress(address, domainsClient);
    },
    [domainsClient]
  );

  const maxAmountStr = maxAmount?.toString();
  useEffect(() => {
    if (formState.dirtyFields.amount) {
      trigger('amount');
    }
  }, [formState.dirtyFields, trigger, maxAmountStr]);

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

      if (estimationError) {
        toastError('Failed to estimate transaction.');
        return;
      }

      formAnalytics.trackSubmit();

      try {
        if (!assetMetadata) throw new Error('Metadata not found');

        const actualAmount = shouldUseFiat ? toAssetAmount(amount) : amount;

        onConfirm({ amount: actualAmount, to: toResolved });

        // if (isTezosContractAddress(accountPkh)) {
        //   const michelsonLambda = isTezosContractAddress(toResolved) ? transferToContract : transferImplicit;
        //
        //   const contract = await loadContract(tezos, accountPkh);
        //   await contract.methodsObject.do(michelsonLambda(toResolved, tzToMutez(amount))).send({ amount: 0 });
        // } else {
        //   const actualAmount = shouldUseFiat ? toAssetAmount(amount) : amount;
        //   const transferParams = await toTransferParams(
        //     tezos,
        //     assetSlug,
        //     assetMetadata,
        //     accountPkh,
        //     toResolved,
        //     actualAmount
        //   );
        //   const estmtn = await tezos.estimate.transfer(transferParams);
        //   const fee = estmtn.suggestedFeeMutez;
        //   await tezos.wallet.transfer({ ...transferParams, fee }).send();
        // }

        reset({ amount: '', to: '' });

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        console.error(err);

        formAnalytics.trackSubmitFail();

        if (err?.message === 'Declined') {
          return;
        }

        toastError('Oops, Something went wrong!');
      }
    },
    [
      accountPkh,
      assetMetadata,
      assetSlug,
      formAnalytics,
      formState.isSubmitting,
      reset,
      shouldUseFiat,
      tezos,
      toAssetAmount,
      toResolved
    ]
  );

  return (
    <BaseForm
      form={form}
      network={network}
      accountPkh={accountPkh}
      assetSlug={assetSlug}
      assetSymbol={assetSymbol}
      assetPrice={assetPrice}
      maxAmount={maxAmount}
      maxEstimating={estimating}
      canToggleFiat={canToggleFiat}
      shouldUseFiat={shouldUseFiat}
      setShouldUseFiat={setShouldUseFiat}
      assetDecimals={assetMetadata?.decimals ?? 0}
      validateAmount={validateAmount}
      validateRecipient={validateRecipient}
      onSelectAssetClick={onSelectAssetClick}
      isToFilledWithFamiliarAddress={isToFilledWithFamiliarAddress}
      onSubmit={onSubmit}
    />
  );
};
