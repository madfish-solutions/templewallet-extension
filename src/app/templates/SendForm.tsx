import React, {
  Dispatch,
  FC,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { DEFAULT_FEE, WalletOperation } from '@taquito/taquito';
import type { Estimate } from '@taquito/taquito/dist/types/contract/estimate';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import Alert from 'app/atoms/Alert';
import AssetField from 'app/atoms/AssetField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Identicon from 'app/atoms/Identicon';
import Money from 'app/atoms/Money';
import NoSpaceField from 'app/atoms/NoSpaceField';
import Spinner from 'app/atoms/Spinner';
import { ArtificialError, NotEnoughFundsError, ZeroBalanceError, ZeroTEZBalanceError } from 'app/defaults';
import { useAppEnv } from 'app/env';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/chevron-up.svg';
import AdditionalFeeInput from 'app/templates/AdditionalFeeInput';
import AssetSelect from 'app/templates/AssetSelect';
import Balance from 'app/templates/Balance';
import InUSD from 'app/templates/InUSD';
import OperationStatus from 'app/templates/OperationStatus';
import { AnalyticsEventCategory, useAnalytics, useFormAnalytics } from 'lib/analytics';
import { toLocalFixed } from 'lib/i18n/numbers';
import { T, t } from 'lib/i18n/react';
import { transferImplicit, transferToContract } from 'lib/michelson';
import {
  fetchBalance,
  fetchTezosBalance,
  getAssetSymbol,
  hasManager,
  isAddressValid,
  isDomainNameValid,
  isKTAddress,
  isTezAsset,
  loadContract,
  mutezToTz,
  TempleAccountType,
  TEZOS_METADATA,
  toPenny,
  toTransferParams,
  tzToMutez,
  useAccount,
  useAssetMetadata,
  useAssetUSDPrice,
  useBalance,
  useContacts,
  useNetwork,
  useTezos,
  useTezosDomainsClient
} from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';
import { HistoryAction, navigate } from 'lib/woozie';

import { SendFormSelectors } from './SendForm.selectors';
import AddContactModal from './SendForm/AddContactModal';
import ContactsDropdown from './SendForm/ContactsDropdown';
import SendErrorAlert from './SendForm/SendErrorAlert';

interface FormData {
  to: string;
  amount: string;
  fee: number;
}

const PENNY = 0.000001;
const RECOMMENDED_ADD_FEE = 0.0001;

type SendFormProps = {
  assetSlug?: string | null;
};

const SendForm: FC<SendFormProps> = ({ assetSlug }) => {
  assetSlug = assetSlug ?? 'tez';

  const tezos = useTezos();
  const [operation, setOperation] = useSafeState<any>(null, tezos.checksum);
  const [addContactModalAddress, setAddContactModalAddress] = useState<string | null>(null);
  const { trackEvent } = useAnalytics();

  const handleAssetChange = useCallback(
    (aSlug: string) => {
      trackEvent(SendFormSelectors.AssetItemButton, AnalyticsEventCategory.ButtonPress);
      navigate(`/send/${aSlug}`, HistoryAction.Replace);
    },
    [trackEvent]
  );

  const handleAddContactRequested = useCallback(
    (address: string) => {
      setAddContactModalAddress(address);
    },
    [setAddContactModalAddress]
  );

  const closeContactModal = useCallback(() => {
    setAddContactModalAddress(null);
  }, [setAddContactModalAddress]);

  return (
    <>
      {operation && <OperationStatus typeTitle={t('transaction')} operation={operation} />}

      <AssetSelect value={assetSlug} onChange={handleAssetChange} className="mb-6" />

      <Suspense fallback={<SpinnerSection />}>
        <Form assetSlug={assetSlug} setOperation={setOperation} onAddContactRequested={handleAddContactRequested} />
      </Suspense>

      <AddContactModal address={addContactModalAddress} onClose={closeContactModal} />
    </>
  );
};

export default SendForm;

type FormProps = {
  assetSlug: string;
  setOperation: Dispatch<any>;
  onAddContactRequested: (address: string) => void;
};

const Form: FC<FormProps> = ({ assetSlug, setOperation, onAddContactRequested }) => {
  const { registerBackHandler } = useAppEnv();

  const assetMetadata = useAssetMetadata(assetSlug);
  const assetPrice = useAssetUSDPrice(assetSlug);

  const assetSymbol = useMemo(() => getAssetSymbol(assetMetadata), [assetMetadata]);

  const { allContacts } = useContacts();
  const network = useNetwork();
  const acc = useAccount();
  const tezos = useTezos();
  const domainsClient = useTezosDomainsClient();

  const formAnalytics = useFormAnalytics('SendForm');

  const canUseDomainNames = domainsClient.isSupported;
  const accountPkh = acc.publicKeyHash;

  const { data: balanceData, mutate: mutateBalance } = useBalance(assetSlug, accountPkh);
  const balance = balanceData!;

  const { data: tezBalanceData, mutate: mutateTezBalance } = useBalance('tez', accountPkh);
  const tezBalance = tezBalanceData!;

  const [shouldUseUsd, setShouldUseUsd] = useSafeState(false);

  const canToggleUsd = network.type === 'main' && assetPrice !== null;
  const prevCanToggleUsd = useRef(canToggleUsd);

  /**
   * Form
   */

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation, reset, getValues } =
    useForm<FormData>({
      mode: 'onChange',
      defaultValues: {
        fee: RECOMMENDED_ADD_FEE
      }
    });

  const handleUsdToggle = useCallback(
    evt => {
      evt.preventDefault();

      const newShouldUseUsd = !shouldUseUsd;
      setShouldUseUsd(newShouldUseUsd);
      if (!getValues().amount) {
        return;
      }
      const amount = new BigNumber(getValues().amount);
      setValue(
        'amount',
        (newShouldUseUsd ? amount.multipliedBy(assetPrice!) : amount.div(assetPrice!)).toFormat(
          newShouldUseUsd ? 2 : 6,
          BigNumber.ROUND_FLOOR,
          {
            decimalSeparator: '.'
          }
        )
      );
    },
    [setShouldUseUsd, shouldUseUsd, getValues, assetPrice, setValue]
  );
  useEffect(() => {
    if (!canToggleUsd && prevCanToggleUsd.current && shouldUseUsd) {
      setShouldUseUsd(false);
      setValue('amount', undefined);
    }
    prevCanToggleUsd.current = canToggleUsd;
  }, [setShouldUseUsd, canToggleUsd, shouldUseUsd, setValue]);

  const toValue = watch('to');
  const amountValue = watch('amount');
  const feeValue = watch('fee') ?? RECOMMENDED_ADD_FEE;

  const toFieldRef = useRef<HTMLTextAreaElement>(null);
  const amountFieldRef = useRef<HTMLInputElement>(null);

  const toFilledWithAddress = useMemo(() => Boolean(toValue && isAddressValid(toValue)), [toValue]);

  const toFilledWithDomain = useMemo(
    () => toValue && isDomainNameValid(toValue, domainsClient),
    [toValue, domainsClient]
  );

  const domainAddressFactory = useCallback(
    (_k: string, _checksum: string, toValue: string) => domainsClient.resolver.resolveNameToAddress(toValue),
    [domainsClient]
  );
  const { data: resolvedAddress } = useSWR(['tzdns-address', tezos.checksum, toValue], domainAddressFactory, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });

  const toFilled = useMemo(
    () => (resolvedAddress ? toFilledWithDomain : toFilledWithAddress),
    [toFilledWithAddress, toFilledWithDomain, resolvedAddress]
  );

  const toResolved = useMemo(() => resolvedAddress || toValue, [resolvedAddress, toValue]);

  const toFilledWithKTAddress = useMemo(() => isAddressValid(toResolved) && isKTAddress(toResolved), [toResolved]);

  const filledContact = useMemo(
    () => (toResolved && allContacts.find(c => c.address === toResolved)) || null,
    [allContacts, toResolved]
  );

  const cleanToField = useCallback(() => {
    setValue('to', '');
    triggerValidation('to');
  }, [setValue, triggerValidation]);

  useLayoutEffect(() => {
    if (toFilled) {
      toFieldRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [toFilled]);

  useLayoutEffect(() => {
    if (toFilled) {
      return registerBackHandler(() => {
        cleanToField();
        window.scrollTo(0, 0);
      });
    }
    return undefined;
  }, [toFilled, registerBackHandler, cleanToField]);

  const estimateBaseFee = useCallback(async () => {
    try {
      const to = toResolved;
      const tez = isTezAsset(assetSlug);

      const balanceBN = (await mutateBalance(fetchBalance(tezos, assetSlug, assetMetadata, accountPkh)))!;
      if (balanceBN.isZero()) {
        throw new ZeroBalanceError();
      }

      let tezBalanceBN: BigNumber;
      if (!tez) {
        tezBalanceBN = (await mutateTezBalance(fetchTezosBalance(tezos, accountPkh)))!;
        if (tezBalanceBN.isZero()) {
          throw new ZeroTEZBalanceError();
        }
      }

      const [transferParams, manager] = await Promise.all([
        toTransferParams(tezos, assetSlug, assetMetadata, accountPkh, to, toPenny(assetMetadata)),
        tezos.rpc.getManagerKey(acc.type === TempleAccountType.ManagedKT ? acc.owner : accountPkh)
      ]);

      let estmtnMax: Estimate;
      if (acc.type === TempleAccountType.ManagedKT) {
        const michelsonLambda = isKTAddress(to) ? transferToContract : transferImplicit;

        const contract = await loadContract(tezos, acc.publicKeyHash);
        const transferParams = contract.methods.do(michelsonLambda(to, tzToMutez(balanceBN))).toTransferParams();
        estmtnMax = await tezos.estimate.transfer(transferParams);
      } else if (tez) {
        const estmtn = await tezos.estimate.transfer(transferParams);
        let amountMax = balanceBN.minus(mutezToTz(estmtn.totalCost));
        if (!hasManager(manager)) {
          amountMax = amountMax.minus(mutezToTz(DEFAULT_FEE.REVEAL));
        }
        estmtnMax = await tezos.estimate.transfer({
          to,
          amount: amountMax.toString() as any
        });
      } else {
        estmtnMax = await tezos.estimate.transfer(transferParams);
      }

      // console.info({
      //   burnFeeMutez: estmtnMax.burnFeeMutez,
      //   consumedMilligas: estmtnMax.consumedMilligas,
      //   gasLimit: estmtnMax.gasLimit,
      //   minimalFeeMutez: estmtnMax.minimalFeeMutez,
      //   storageLimit: estmtnMax.storageLimit,
      //   suggestedFeeMutez: estmtnMax.suggestedFeeMutez,
      //   totalCost: estmtnMax.totalCost,
      //   usingBaseFeeMutez: estmtnMax.usingBaseFeeMutez,
      // });

      let baseFee = mutezToTz(estmtnMax.totalCost);
      if (!hasManager(manager)) {
        baseFee = baseFee.plus(mutezToTz(DEFAULT_FEE.REVEAL));
      }

      if (tez ? baseFee.isGreaterThanOrEqualTo(balanceBN) : baseFee.isGreaterThan(tezBalanceBN!)) {
        throw new NotEnoughFundsError();
      }

      return baseFee;
    } catch (err: any) {
      // Human delay
      await new Promise(r => setTimeout(r, 300));

      if (err instanceof ArtificialError) {
        return err;
      }

      console.error(err);

      switch (true) {
        default:
          throw err;
      }
    }
  }, [acc, tezos, assetSlug, assetMetadata, accountPkh, toResolved, mutateBalance, mutateTezBalance]);

  const {
    data: baseFee,
    error: estimateBaseFeeError,
    isValidating: estimating
  } = useSWR(
    () => (toFilled ? ['transfer-base-fee', tezos.checksum, assetSlug, accountPkh, toResolved] : null),
    estimateBaseFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 30_000
    }
  );
  const estimationError = !estimating ? (baseFee instanceof Error ? baseFee : estimateBaseFeeError) : null;

  const maxAddFee = useMemo(() => {
    if (baseFee instanceof BigNumber) {
      return tezBalance.minus(baseFee).minus(PENNY).toNumber();
    }
    return undefined;
  }, [tezBalance, baseFee]);

  const safeFeeValue = useMemo(() => (maxAddFee && feeValue > maxAddFee ? maxAddFee : feeValue), [maxAddFee, feeValue]);

  const maxAmount = useMemo(() => {
    if (!(baseFee instanceof BigNumber)) return null;

    const maxAmountAsset = isTezAsset(assetSlug)
      ? BigNumber.max(
          acc.type === TempleAccountType.ManagedKT
            ? balance
            : balance
                .minus(baseFee)
                .minus(safeFeeValue ?? 0)
                .minus(PENNY),
          0
        )
      : balance;
    const maxAmountUsd = assetPrice
      ? maxAmountAsset.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
      : new BigNumber(0);
    return shouldUseUsd ? maxAmountUsd : maxAmountAsset;
  }, [acc.type, assetSlug, balance, baseFee, safeFeeValue, shouldUseUsd, assetPrice]);

  const validateAmount = useCallback(
    (v?: number) => {
      if (v === undefined) return t('required');
      if (!isKTAddress(toValue) && v === 0) {
        return t('amountMustBePositive');
      }
      if (!maxAmount) return true;
      const vBN = new BigNumber(v);
      return vBN.isLessThanOrEqualTo(maxAmount) || t('maximalAmount', toLocalFixed(maxAmount));
    },
    [maxAmount, toValue]
  );

  const handleFeeFieldChange = useCallback(([v]) => (maxAddFee && v > maxAddFee ? maxAddFee : v), [maxAddFee]);

  const maxAmountStr = maxAmount?.toString();
  useEffect(() => {
    if (formState.dirtyFields.has('amount')) {
      triggerValidation('amount');
    }
  }, [formState.dirtyFields, triggerValidation, maxAmountStr]);

  const handleSetMaxAmount = useCallback(() => {
    if (maxAmount) {
      setValue('amount', maxAmount.toString());
      triggerValidation('amount');
    }
  }, [setValue, maxAmount, triggerValidation]);

  const handleAmountFieldFocus = useCallback(evt => {
    evt.preventDefault();
    amountFieldRef.current?.focus({ preventScroll: true });
  }, []);

  const [submitError, setSubmitError] = useSafeState<any>(null, `${tezos.checksum}_${toResolved}`);

  const toAssetAmount = useCallback(
    (usdAmount: BigNumber.Value) =>
      new BigNumber(usdAmount)
        .dividedBy(assetPrice ?? 1)
        .toFormat(assetMetadata?.decimals ?? 0, BigNumber.ROUND_FLOOR, {
          decimalSeparator: '.'
        }),
    [assetPrice, assetMetadata?.decimals]
  );

  const validateRecipient = useCallback(
    async (value: any) => {
      if (!value?.length || value.length < 0) {
        return false;
      }

      if (!canUseDomainNames) {
        return validateAddress(value);
      }

      if (isDomainNameValid(value, domainsClient)) {
        const resolved = await domainsClient.resolver.resolveNameToAddress(value);
        if (!resolved) {
          return t('domainDoesntResolveToAddress', value);
        }

        value = resolved;
      }

      return isAddressValid(value) ? true : t('invalidAddressOrDomain');
    },
    [canUseDomainNames, domainsClient]
  );

  const onSubmit = useCallback(
    async ({ amount, fee: feeVal }: FormData) => {
      if (formState.isSubmitting) return;
      setSubmitError(null);
      setOperation(null);

      formAnalytics.trackSubmit();
      try {
        let op: WalletOperation;
        if (isKTAddress(acc.publicKeyHash)) {
          const michelsonLambda = isKTAddress(toResolved) ? transferToContract : transferImplicit;

          const contract = await loadContract(tezos, acc.publicKeyHash);
          op = await contract.methods.do(michelsonLambda(toResolved, tzToMutez(amount))).send({ amount: 0 });
        } else {
          const actualAmount = shouldUseUsd ? toAssetAmount(amount) : amount;
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
          const fee = addFee.plus(estmtn.usingBaseFeeMutez).toNumber();
          op = await tezos.wallet.transfer({ ...transferParams, fee } as any).send();
        }
        setOperation(op);
        reset({ to: '', fee: RECOMMENDED_ADD_FEE });

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        if (err.message === 'Declined') {
          return;
        }

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setSubmitError(err);
      }
    },
    [
      acc,
      formState.isSubmitting,
      tezos,
      assetSlug,
      assetMetadata,
      setSubmitError,
      setOperation,
      reset,
      accountPkh,
      toResolved,
      shouldUseUsd,
      toAssetAmount,
      formAnalytics
    ]
  );

  const handleAccountSelect = useCallback(
    (account: string) => {
      setValue('to', account);
      triggerValidation('to');
    },
    [setValue, triggerValidation]
  );

  const restFormDisplayed = Boolean(toFilled && (baseFee || estimationError));
  const estimateFallbackDisplayed = toFilled && !baseFee && estimating;

  const [toFieldFocused, setToFieldFocused] = useState(false);

  const handleToFieldFocus = useCallback(() => {
    toFieldRef.current?.focus();
    setToFieldFocused(true);
  }, [setToFieldFocused]);

  const handleToFieldBlur = useCallback(() => {
    setToFieldFocused(false);
  }, [setToFieldFocused]);

  const allContactsWithoutCurrent = useMemo(
    () => allContacts.filter(c => c.address !== accountPkh),
    [allContacts, accountPkh]
  );

  return (
    <form style={{ minHeight: '24rem' }} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="to"
        as={
          <NoSpaceField
            ref={toFieldRef}
            onFocus={handleToFieldFocus}
            dropdownInner={
              allContactsWithoutCurrent.length > 0 ? (
                <ContactsDropdown
                  contacts={allContactsWithoutCurrent}
                  opened={!toFilled ? toFieldFocused : false}
                  onSelect={handleAccountSelect}
                  searchTerm={toValue}
                />
              ) : null
            }
          />
        }
        control={control}
        rules={{
          validate: validateRecipient
        }}
        onChange={([v]) => v}
        onBlur={handleToFieldBlur}
        textarea
        rows={2}
        cleanable={Boolean(toValue)}
        onClean={cleanToField}
        id="send-to"
        label={t('recipient')}
        labelDescription={
          filledContact ? (
            <div className="flex flex-wrap items-center">
              <Identicon
                type="bottts"
                hash={filledContact.address}
                size={14}
                className="flex-shrink-0 shadow-xs opacity-75"
              />
              <div className="ml-1 mr-px font-normal">{filledContact.name}</div> (
              <Balance assetSlug={assetSlug} address={filledContact.address}>
                {bal => (
                  <span className={classNames('text-xs leading-none')}>
                    <Money>{bal}</Money> <span style={{ fontSize: '0.75em' }}>{assetSymbol}</span>
                  </span>
                )}
              </Balance>
              )
            </div>
          ) : (
            <T
              id={canUseDomainNames ? 'tokensRecepientInputDescriptionWithDomain' : 'tokensRecepientInputDescription'}
              substitutions={assetSymbol}
            />
          )
        }
        placeholder={t(canUseDomainNames ? 'recipientInputPlaceholderWithDomain' : 'recipientInputPlaceholder')}
        errorCaption={!toFieldFocused ? errors.to?.message : null}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4"
      />

      {resolvedAddress && (
        <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
          <span className="mr-1 whitespace-no-wrap">{t('resolvedAddress')}:</span>
          <span className="font-normal">{resolvedAddress}</span>
        </div>
      )}

      {toFilled && !filledContact ? (
        <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
          <button
            type="button"
            className="text-xs font-light text-gray-600 underline"
            onClick={() => onAddContactRequested(toResolved)}
          >
            <T id="addThisAddressToContacts" />
          </button>
        </div>
      ) : null}

      <Controller
        name="amount"
        as={<AssetField ref={amountFieldRef} onFocus={handleAmountFieldFocus} />}
        control={control}
        rules={{
          validate: validateAmount
        }}
        onChange={([v]) => v}
        onFocus={() => amountFieldRef.current?.focus()}
        id="send-amount"
        assetSymbol={
          canToggleUsd ? (
            <button
              type="button"
              onClick={handleUsdToggle}
              className={classNames(
                'px-1 rounded-md',
                'flex items-center',
                'font-light',
                'hover:bg-black hover:bg-opacity-5',
                'trasition ease-in-out duration-200',
                'cursor-pointer pointer-events-auto'
              )}
            >
              {shouldUseUsd ? 'USD' : assetSymbol}
              <div className="ml-1 h-4 flex flex-col justify-between">
                <ChevronUpIcon className="h-2 w-auto stroke-current stroke-2" />
                <ChevronDownIcon className="h-2 w-auto stroke-current stroke-2" />
              </div>
            </button>
          ) : (
            assetSymbol
          )
        }
        assetDecimals={shouldUseUsd ? 2 : assetMetadata?.decimals ?? 0}
        label={t('amount')}
        labelDescription={
          restFormDisplayed &&
          maxAmount && (
            <>
              <T id="availableToSend" />{' '}
              <button type="button" className={classNames('underline')} onClick={handleSetMaxAmount}>
                {shouldUseUsd ? <span className="pr-px">$</span> : null}
                {toLocalFixed(maxAmount)}
              </button>
              {amountValue ? (
                <>
                  <br />
                  {shouldUseUsd ? (
                    <div className="mt-1 -mb-3">
                      ≈ <span className="font-normal text-gray-700">{toAssetAmount(amountValue)}</span>{' '}
                      <T id="inAsset" substitutions={getAssetSymbol(assetMetadata, true)} />
                    </div>
                  ) : (
                    <InUSD assetSlug={assetSlug} volume={amountValue} roundingMode={BigNumber.ROUND_FLOOR}>
                      {usdAmount => (
                        <div className="mt-1 -mb-3">
                          ≈{' '}
                          <span className="font-normal text-gray-700">
                            <span className="pr-px">$</span>
                            {usdAmount}
                          </span>{' '}
                          <T id="inUSD" />
                        </div>
                      )}
                    </InUSD>
                  )}
                </>
              ) : null}
            </>
          )
        }
        placeholder={t('amountPlaceholder')}
        errorCaption={restFormDisplayed && errors.amount?.message}
        containerClassName="mb-4"
        autoFocus={Boolean(maxAmount)}
      />

      {estimateFallbackDisplayed ? (
        <SpinnerSection />
      ) : restFormDisplayed ? (
        <>
          {(() => {
            switch (true) {
              case Boolean(submitError):
                return <SendErrorAlert type="submit" error={submitError} />;

              case Boolean(estimationError):
                return <SendErrorAlert type="estimation" error={estimationError} />;

              case toResolved === accountPkh:
                return (
                  <Alert
                    type="warn"
                    title={t('attentionExclamation')}
                    description={<T id="tryingToTransferToYourself" />}
                    className="mt-6 mb-4"
                  />
                );

              case toFilledWithKTAddress:
                return (
                  <Alert
                    type="warn"
                    title={t('attentionExclamation')}
                    description={<T id="tryingToTransferToContract" />}
                    className="mt-6 mb-4"
                  />
                );

              default:
                return null;
            }
          })()}

          <AdditionalFeeInput
            name="fee"
            control={control}
            onChange={handleFeeFieldChange}
            assetSymbol={TEZOS_METADATA.symbol}
            baseFee={baseFee}
            error={errors.fee}
            id="send-fee"
          />

          <T id="send">
            {message => (
              <FormSubmitButton loading={formState.isSubmitting} disabled={Boolean(estimationError)}>
                {message}
              </FormSubmitButton>
            )}
          </T>
        </>
      ) : null}
    </form>
  );
};

function validateAddress(value: any) {
  switch (false) {
    case value?.length > 0:
      return true;

    case isAddressValid(value):
      return 'invalidAddress';

    default:
      return true;
  }
}

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <Spinner className="w-20" />
  </div>
);
