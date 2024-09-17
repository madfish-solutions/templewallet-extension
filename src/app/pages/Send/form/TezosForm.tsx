import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { ManagerKeyResponse } from '@taquito/rpc';
import { getRevealFee, TransferParams, Estimate, TezosToolkit, ChainIds } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { useForm } from 'react-hook-form-v7';

import { ArtificialError, NotEnoughFundsError, ZeroBalanceError, ZeroTEZBalanceError } from 'app/defaults';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useFormAnalytics } from 'lib/analytics';
import { isTezAsset, TEZ_TOKEN_SLUG, toPenny } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { toLocalFixed, t } from 'lib/i18n';
import { useTezosAssetMetadata, getAssetSymbol } from 'lib/metadata';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { useTypedSWR } from 'lib/swr';
import { loadContract } from 'lib/temple/contract';
import { validateRecipient as validateAddress } from 'lib/temple/front';
import { mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { isValidTezosAddress, isTezosContractAddress, tezosManagerKeyHasManager } from 'lib/tezos';
import { useSafeState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { AccountForTezos, getAccountAddressForTezos } from 'temple/accounts';
import { useAccountForTezos, useTezosChainByChainId, useVisibleAccounts } from 'temple/front';
import { useSettings } from 'temple/front/ready';
import {
  isTezosDomainsNameValid,
  getTezosToolkitWithSigner,
  getTezosDomainsClient,
  useTezosAddressByDomainName
} from 'temple/front/tezos';

import { BaseForm } from './BaseForm';
import { SendFormData } from './interfaces';

const PENNY = 0.000001;
const RECOMMENDED_ADD_FEE = 0.0001;

interface Props {
  chainId: string;
  assetSlug: string;
  onSelectAssetClick: EmptyFn;
}

export const TezosForm: FC<Props> = ({ chainId, assetSlug, onSelectAssetClick }) => {
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
  const prevCanToggleFiat = useRef(canToggleFiat);

  const form = useForm<SendFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      fee: RECOMMENDED_ADD_FEE
    }
  });

  const { watch, formState, setValue, trigger, reset } = form;

  useEffect(() => {
    if (!canToggleFiat && prevCanToggleFiat.current && shouldUseFiat) {
      setShouldUseFiat(false);
      setValue('amount', '');
    }
    prevCanToggleFiat.current = canToggleFiat;
  }, [setShouldUseFiat, canToggleFiat, shouldUseFiat, setValue]);

  const toValue = watch('to');
  const feeValue = watch('fee') ?? RECOMMENDED_ADD_FEE;

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

      const estmtnMax = await estimateMaxFee(account, tez, tezos, to, balance, transferParams, manager);

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

  const safeFeeValue = useMemo(() => (maxAddFee && feeValue > maxAddFee ? maxAddFee : feeValue), [maxAddFee, feeValue]);

  const maxAmount = useMemo(() => {
    if (!(baseFee instanceof BigNumber)) return balance;

    const maxAmountAsset = isTezAsset(assetSlug)
      ? getMaxAmountToken(account.type, balance, baseFee, safeFeeValue)
      : balance;

    return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), maxAmountAsset) : maxAmountAsset;
  }, [account, assetSlug, balance, baseFee, safeFeeValue, shouldUseFiat, assetPrice]);

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

  const [submitError, setSubmitError] = useSafeState<any>(null, `${tezos.clientId}_${toResolved}`);

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
    async ({ amount, fee: feeVal }: SendFormData) => {
      if (formState.isSubmitting) return;

      setSubmitError(null);

      formAnalytics.trackSubmit();

      try {
        if (!assetMetadata) throw new Error('Metadata not found');

        if (isTezosContractAddress(accountPkh)) {
          const michelsonLambda = isTezosContractAddress(toResolved) ? transferToContract : transferImplicit;

          const contract = await loadContract(tezos, accountPkh);
          await contract.methodsObject.do(michelsonLambda(toResolved, tzToMutez(amount))).send({ amount: 0 });
        } else {
          const actualAmount = shouldUseFiat ? toAssetAmount(amount) : amount;
          const transferParams = await toTransferParams(
            tezos,
            assetSlug,
            assetMetadata,
            accountPkh,
            toResolved,
            actualAmount
          );
          const estmtn = await tezos.estimate.transfer(transferParams);
          const addFee = tzToMutez(feeVal ?? 0);
          const fee = addFee.plus(estmtn.suggestedFeeMutez).toNumber();
          await tezos.wallet.transfer({ ...transferParams, fee }).send();
        }

        reset({ to: '', fee: RECOMMENDED_ADD_FEE });

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        console.error(err);

        formAnalytics.trackSubmitFail();

        if (err?.message === 'Declined') {
          return;
        }

        setSubmitError(err);
      }
    },
    [
      accountPkh,
      assetMetadata,
      assetSlug,
      formAnalytics,
      formState.isSubmitting,
      reset,
      setSubmitError,
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
      assetDecimals={assetMetadata?.decimals ?? 0}
      validateAmount={validateAmount}
      validateRecipient={validateRecipient}
      onSelectAssetClick={onSelectAssetClick}
      isToFilledWithFamiliarAddress={isToFilledWithFamiliarAddress}
      onSubmit={onSubmit}
    />
  );
};

const getMaxAmountFiat = (assetPrice: number | null, maxAmountAsset: BigNumber) =>
  assetPrice ? maxAmountAsset.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR) : new BigNumber(0);

const getMaxAmountToken = (
  accountType: TempleAccountType,
  balance: BigNumber,
  baseFee: BigNumber,
  safeFeeValue: number
) =>
  BigNumber.max(
    accountType === TempleAccountType.ManagedKT
      ? balance
      : balance
          .minus(baseFee)
          .minus(safeFeeValue ?? 0)
          .minus(PENNY),
    0
  );

type TransferParamsInvariant =
  | TransferParams
  | {
      to: string;
      amount: any;
    };

const estimateMaxFee = async (
  acc: AccountForTezos,
  tez: boolean,
  tezos: TezosToolkit,
  to: string,
  balanceBN: BigNumber,
  transferParams: TransferParamsInvariant,
  manager: ManagerKeyResponse
) => {
  let estmtnMax: Estimate;
  if (acc.type === TempleAccountType.ManagedKT) {
    const michelsonLambda = isTezosContractAddress(to) ? transferToContract : transferImplicit;

    const contract = await loadContract(tezos, acc.address);
    const transferParamsWrapper = contract.methodsObject
      .do(michelsonLambda(to, tzToMutez(balanceBN)))
      .toTransferParams();
    estmtnMax = await tezos.estimate.transfer(transferParamsWrapper);
  } else if (tez) {
    const estmtn = await tezos.estimate.transfer(transferParams);
    let amountMax = balanceBN.minus(mutezToTz(estmtn.totalCost));
    if (!tezosManagerKeyHasManager(manager)) {
      amountMax = amountMax.minus(mutezToTz(getRevealFee(to)));
    }
    estmtnMax = await tezos.estimate.transfer({
      to,
      amount: amountMax.toString() as any
    });
  } else {
    estmtnMax = await tezos.estimate.transfer(transferParams);
  }
  return estmtnMax;
};

const getBaseFeeError = (baseFee: BigNumber | ArtificialError | undefined, estimateBaseFeeError: any) =>
  baseFee instanceof Error ? baseFee : estimateBaseFeeError;

const getFeeError = (estimating: boolean, feeError: any) => (!estimating ? feeError : null);
