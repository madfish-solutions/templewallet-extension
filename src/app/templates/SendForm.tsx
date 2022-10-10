import React, {
  Dispatch,
  FC,
  FocusEventHandler,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { ManagerKeyResponse } from '@taquito/rpc';
import { DEFAULT_FEE, TransferParams, WalletOperation, Estimate } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Controller, FieldError, useForm } from 'react-hook-form';
import useSWR from 'swr';

import { Alert, FormSubmitButton, NoSpaceField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import Identicon from 'app/atoms/Identicon';
import Money from 'app/atoms/Money';
import Spinner from 'app/atoms/Spinner/Spinner';
import { ArtificialError, NotEnoughFundsError, ZeroBalanceError, ZeroTEZBalanceError } from 'app/defaults';
import { useAppEnv } from 'app/env';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/chevron-up.svg';
import AdditionalFeeInput from 'app/templates/AdditionalFeeInput';
import AssetSelect from 'app/templates/AssetSelect/AssetSelect';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import OperationStatus from 'app/templates/OperationStatus';
import { AnalyticsEventCategory, useAnalytics, useFormAnalytics } from 'lib/analytics';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { toLocalFixed } from 'lib/i18n/numbers';
import { T, t } from 'lib/i18n/react';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { fetchBalance, fetchTezosBalance, isTezAsset, toPenny, toTransferParams } from 'lib/temple/assets';
import { loadContract } from 'lib/temple/contract';
import {
  ReactiveTezosToolkit,
  isDomainNameValid,
  useAccount,
  useBalance,
  useChainId,
  useNetwork,
  useTezos,
  useTezosDomainsClient,
  useAssetMetadata,
  useCollectibleTokens,
  useDisplayedFungibleTokens,
  useFilteredContacts,
  validateDelegate,
  useGasToken
} from 'lib/temple/front';
import { hasManager, isAddressValid, isKTAddress, mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { AssetMetadata, getAssetSymbol } from 'lib/temple/metadata';
import { TempleAccountType, TempleAccount, TempleNetworkType } from 'lib/temple/types';
import useSafeState from 'lib/ui/useSafeState';
import { HistoryAction, navigate } from 'lib/woozie';

import { IAsset } from './AssetSelect/interfaces';
import { getSlug } from './AssetSelect/utils';
import { SendFormSelectors } from './SendForm.selectors';
import AddContactModal from './SendForm/AddContactModal';
import ContactsDropdown, { ContactsDropdownProps } from './SendForm/ContactsDropdown';
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

const SendForm: FC<SendFormProps> = ({ assetSlug = 'tez' }) => {
  const chainId = useChainId(true)!;
  const account = useAccount();

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, account.publicKeyHash);
  const { data: collectibles = [] } = useCollectibleTokens(chainId, account.publicKeyHash, true);

  const assets = useMemo<IAsset[]>(() => ['tez' as const, ...tokens, ...collectibles], [tokens, collectibles]);
  const selectedAsset = useMemo(() => assets.find(a => getSlug(a) === assetSlug) ?? 'tez', [assets, assetSlug]);

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

      <AssetSelect value={selectedAsset} assets={assets} onChange={handleAssetChange} className="mb-6" />

      <Suspense fallback={<SpinnerSection />}>
        <Form
          assetSlug={getSlug(selectedAsset)}
          setOperation={setOperation}
          onAddContactRequested={handleAddContactRequested}
        />
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
  const assetPrice = useAssetFiatCurrencyPrice(assetSlug);

  const assetSymbol = useMemo(() => getAssetSymbol(assetMetadata), [assetMetadata]);

  const { allContacts } = useFilteredContacts();
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

  const [shoudUseFiat, setShouldUseFiat] = useSafeState(false);

  const canToggleFiat = getAssetPriceByNetwork(network.type, assetPrice.toNumber());
  const prevCanToggleFiat = useRef(canToggleFiat);

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

  const handleFiatToggle = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      evt.preventDefault();

      const newShouldUseFiat = !shoudUseFiat;
      setShouldUseFiat(newShouldUseFiat);
      if (!getValues().amount) {
        return;
      }
      const amount = new BigNumber(getValues().amount);
      setValue(
        'amount',
        (newShouldUseFiat ? amount.multipliedBy(assetPrice!) : amount.div(assetPrice!)).toFormat(
          newShouldUseFiat ? 2 : 6,
          BigNumber.ROUND_FLOOR,
          {
            decimalSeparator: '.'
          }
        )
      );
    },
    [setShouldUseFiat, shoudUseFiat, getValues, assetPrice, setValue]
  );
  useEffect(() => {
    if (!canToggleFiat && prevCanToggleFiat.current && shoudUseFiat) {
      setShouldUseFiat(false);
      setValue('amount', undefined);
    }
    prevCanToggleFiat.current = canToggleFiat;
  }, [setShouldUseFiat, canToggleFiat, shoudUseFiat, setValue]);

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
    (_k: string, _checksum: string, address: string) => domainsClient.resolver.resolveNameToAddress(address),
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

      const estmtnMax = await estimateMaxFee(acc, tez, tezos, to, balanceBN, transferParams, manager);

      let estimatedBaseFee = mutezToTz(estmtnMax.burnFeeMutez + estmtnMax.suggestedFeeMutez);
      if (!hasManager(manager)) {
        estimatedBaseFee = estimatedBaseFee.plus(mutezToTz(DEFAULT_FEE.REVEAL));
      }

      if (tez ? estimatedBaseFee.isGreaterThanOrEqualTo(balanceBN) : estimatedBaseFee.isGreaterThan(tezBalanceBN!)) {
        throw new NotEnoughFundsError();
      }

      return estimatedBaseFee;
    } catch (err: any) {
      await new Promise(r => setTimeout(r, 300));

      if (err instanceof ArtificialError) {
        return err;
      }

      console.error(err);
      throw err;
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
  const feeError = getBaseFeeError(baseFee, estimateBaseFeeError);
  const estimationError = getFeeError(estimating, feeError);

  const maxAddFee = useMemo(() => {
    if (baseFee instanceof BigNumber) {
      return tezBalance.minus(baseFee).minus(PENNY).toNumber();
    }
    return undefined;
  }, [tezBalance, baseFee]);

  const safeFeeValue = useMemo(() => (maxAddFee && feeValue > maxAddFee ? maxAddFee : feeValue), [maxAddFee, feeValue]);

  const maxAmount = useMemo(() => {
    if (!(baseFee instanceof BigNumber)) return null;

    const maxAmountAsset = isTezAsset(assetSlug) ? getMaxAmountToken(acc, balance, baseFee, safeFeeValue) : balance;
    const maxAmountFiat = getMaxAmountFiat(assetPrice.toNumber(), maxAmountAsset);
    return shoudUseFiat ? maxAmountFiat : maxAmountAsset;
  }, [acc, assetSlug, balance, baseFee, safeFeeValue, shoudUseFiat, assetPrice]);

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

  const handleFeeFieldChange = useCallback<FeeComponentProps['handleFeeFieldChange']>(
    ([v]) => (maxAddFee && v > maxAddFee ? maxAddFee : v),
    [maxAddFee]
  );

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

  const handleAmountFieldFocus = useCallback<FocusEventHandler>(evt => {
    evt.preventDefault();
    amountFieldRef.current?.focus({ preventScroll: true });
  }, []);

  const [submitError, setSubmitError] = useSafeState<any>(null, `${tezos.checksum}_${toResolved}`);

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
          const actualAmount = shoudUseFiat ? toAssetAmount(amount) : amount;
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
      shoudUseFiat,
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

  const restFormDisplayed = getRestFormDisplayed(toFilled, baseFee, estimationError);
  const estimateFallbackDisplayed = getEstimateFallBackDisplayed(toFilled, baseFee, estimating);

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

  const { selectedFiatCurrency } = useFiatCurrency();

  const visibleAssetSymbol = shoudUseFiat ? selectedFiatCurrency.symbol : assetSymbol;
  const assetDomainName = getAssetDomainName(canUseDomainNames);

  const isContactsDropdownOpen = getFilled(toFilled, toFieldFocused);

  return (
    <form style={{ minHeight: '24rem' }} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="to"
        as={
          <NoSpaceField
            ref={toFieldRef}
            onFocus={handleToFieldFocus}
            dropdownInner={
              <InnerDropDownComponentGuard
                contacts={allContactsWithoutCurrent}
                opened={isContactsDropdownOpen}
                onSelect={handleAccountSelect}
                searchTerm={toValue}
              />
            }
          />
        }
        control={control}
        rules={{
          validate: (value: any) => validateDelegate(value, canUseDomainNames, domainsClient, t, validateAddress)
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
            <div className="flex flex-wrap items-baseline">
              <Identicon
                type="bottts"
                hash={filledContact.address}
                size={14}
                className="flex-shrink-0 shadow-xs opacity-75"
              />
              <div className="ml-1 mr-px font-normal">{filledContact.name}</div> (
              <Balance assetSlug={assetSlug} address={filledContact.address}>
                {bal => (
                  <span className={classNames('text-xs leading-none flex items-baseline')}>
                    <Money>{bal}</Money>{' '}
                    <span className="ml-1" style={{ fontSize: '0.75em' }}>
                      {assetSymbol}
                    </span>
                  </span>
                )}
              </Balance>
              )
            </div>
          ) : (
            <T id={assetDomainName} substitutions={assetSymbol} />
          )
        }
        placeholder={t(getDomainTextError(canUseDomainNames))}
        errorCaption={!toFieldFocused ? errors.to?.message : null}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4"
      />

      {resolvedAddress && (
        <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
          <span className="mr-1 whitespace-nowrap">{t('resolvedAddress')}:</span>
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
          canToggleFiat ? (
            <button
              type="button"
              onClick={handleFiatToggle}
              className={classNames(
                'px-1 rounded-md',
                'flex items-center',
                'font-light',
                'hover:bg-black hover:bg-opacity-5',
                'trasition ease-in-out duration-200',
                'cursor-pointer pointer-events-auto'
              )}
            >
              {visibleAssetSymbol}
              <div className="ml-1 h-4 flex flex-col justify-between">
                <ChevronUpIcon className="h-2 w-auto stroke-current stroke-2" />
                <ChevronDownIcon className="h-2 w-auto stroke-current stroke-2" />
              </div>
            </button>
          ) : (
            assetSymbol
          )
        }
        assetDecimals={shoudUseFiat ? 2 : assetMetadata?.decimals ?? 0}
        label={t('amount')}
        labelDescription={
          restFormDisplayed &&
          maxAmount && (
            <>
              <T id="availableToSend" />{' '}
              <button type="button" className={classNames('underline')} onClick={handleSetMaxAmount}>
                {shoudUseFiat ? <span className="pr-px">{selectedFiatCurrency.symbol}</span> : null}
                {toLocalFixed(maxAmount)}
              </button>
              <TokenToFiat
                amountValue={amountValue}
                assetMetadata={assetMetadata}
                shoudUseFiat={shoudUseFiat}
                assetSlug={assetSlug}
                toAssetAmount={toAssetAmount}
              />
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
      ) : (
        <FeeComponent
          restFormDisplayed={restFormDisplayed}
          submitError={submitError}
          estimationError={estimationError}
          toResolved={toResolved}
          toFilledWithKTAddress={toFilledWithKTAddress}
          control={control}
          handleFeeFieldChange={handleFeeFieldChange}
          baseFee={baseFee}
          error={errors.fee}
          isSubmitting={formState.isSubmitting}
        />
      )}
    </form>
  );
};

interface TokenToFiatProps {
  amountValue: string;
  assetMetadata: AssetMetadata;
  shoudUseFiat: boolean;
  assetSlug: string;
  toAssetAmount: (fiatAmount: BigNumber.Value) => string;
}

const TokenToFiat: React.FC<TokenToFiatProps> = ({
  amountValue,
  assetMetadata,
  shoudUseFiat,
  assetSlug,
  toAssetAmount
}) => {
  if (!amountValue) return null;
  return (
    <>
      <br />
      {shoudUseFiat ? (
        <div className="mt-1 -mb-3">
          <span className="mr-1">≈</span>
          <span className="font-normal text-gray-700 mr-1">{toAssetAmount(amountValue)}</span>{' '}
          <T id="inAsset" substitutions={getAssetSymbol(assetMetadata, true)} />
        </div>
      ) : (
        <InFiat assetSlug={assetSlug} volume={amountValue} roundingMode={BigNumber.ROUND_FLOOR}>
          {({ balance, symbol }) => (
            <div className="mt-1 -mb-3 flex items-baseline">
              <span className="mr-1">≈</span>
              <span className="font-normal text-gray-700 mr-1 flex items-baseline">
                {balance}
                <span className="pr-px">{symbol}</span>
              </span>{' '}
              <T id="inFiat" />
            </div>
          )}
        </InFiat>
      )}
    </>
  );
};

interface FeeComponentProps {
  restFormDisplayed: boolean;
  submitError: any;
  estimationError: any;
  toResolved: string;
  toFilledWithKTAddress: boolean;
  control: any;
  handleFeeFieldChange: ([v]: any) => any;
  baseFee?: BigNumber | Error | undefined;
  error?: FieldError;
  isSubmitting: boolean;
}

const FeeComponent: React.FC<FeeComponentProps> = ({
  restFormDisplayed,
  submitError,
  estimationError,
  toResolved,
  toFilledWithKTAddress,
  control,
  handleFeeFieldChange,
  baseFee,
  error,
  isSubmitting
}) => {
  const acc = useAccount();
  const { metadata } = useGasToken();
  const accountPkh = acc.publicKeyHash;
  if (!restFormDisplayed) return null;
  return (
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
        assetSymbol={metadata.symbol}
        baseFee={baseFee}
        error={error}
        id="send-fee"
      />

      <T id="send">
        {message => (
          <FormSubmitButton loading={isSubmitting} disabled={Boolean(estimationError)}>
            {message}
          </FormSubmitButton>
        )}
      </T>
    </>
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

const getMaxAmountFiat = (assetPrice: number | null, maxAmountAsset: BigNumber) =>
  assetPrice ? maxAmountAsset.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR) : new BigNumber(0);

const getMaxAmountToken = (acc: TempleAccount, balance: BigNumber, baseFee: BigNumber, safeFeeValue: number) =>
  BigNumber.max(
    acc.type === TempleAccountType.ManagedKT
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
  acc: TempleAccount,
  tez: boolean,
  tezos: ReactiveTezosToolkit,
  to: string,
  balanceBN: BigNumber,
  transferParams: TransferParamsInvariant,
  manager: ManagerKeyResponse
) => {
  let estmtnMax: Estimate;
  if (acc.type === TempleAccountType.ManagedKT) {
    const michelsonLambda = isKTAddress(to) ? transferToContract : transferImplicit;

    const contract = await loadContract(tezos, acc.publicKeyHash);
    const transferParamsWrapper = contract.methods.do(michelsonLambda(to, tzToMutez(balanceBN))).toTransferParams();
    estmtnMax = await tezos.estimate.transfer(transferParamsWrapper);
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
  return estmtnMax;
};

const getAssetPriceByNetwork = (network: TempleNetworkType, assetPrice: number | null) =>
  network === 'main' && assetPrice !== null;

const getBaseFeeError = (baseFee: BigNumber | ArtificialError | undefined, estimateBaseFeeError: any) =>
  baseFee instanceof Error ? baseFee : estimateBaseFeeError;

const getFeeError = (estimating: boolean, feeError: any) => (!estimating ? feeError : null);
const getEstimateFallBackDisplayed = (toFilled: boolean | '', baseFee: any, estimating: boolean) =>
  toFilled && !baseFee && estimating;
const getRestFormDisplayed = (toFilled: boolean | '', baseFee: any, estimationError: any) =>
  Boolean(toFilled && (baseFee || estimationError));

const InnerDropDownComponentGuard: React.FC<ContactsDropdownProps> = ({ contacts, opened, onSelect, searchTerm }) => {
  if (contacts.length <= 0) return null;
  return <ContactsDropdown contacts={contacts} opened={opened} onSelect={onSelect} searchTerm={searchTerm} />;
};

const getFilled = (toFilled: boolean | '', toFieldFocused: boolean) => (!toFilled ? toFieldFocused : false);
const getDomainTextError = (canUseDomainNames: boolean) =>
  canUseDomainNames ? 'recipientInputPlaceholderWithDomain' : 'recipientInputPlaceholder';
const getAssetDomainName = (canUseDomainNames: boolean) =>
  canUseDomainNames ? 'tokensRecepientInputDescriptionWithDomain' : 'tokensRecepientInputDescription';
