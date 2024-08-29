import React, {
  FC,
  FocusEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { ManagerKeyResponse } from '@taquito/rpc';
import { DEFAULT_FEE, TransferParams, Estimate, TezosToolkit, ChainIds } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { isString } from 'lodash';
import { Controller, FieldError, useForm } from 'react-hook-form';

import { Button, IconBase, NoSpaceField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import Identicon from 'app/atoms/Identicon';
import { StyledButton } from 'app/atoms/StyledButton';
import { ArtificialError, NotEnoughFundsError, ZeroBalanceError, ZeroTEZBalanceError } from 'app/defaults';
import { useAppEnv } from 'app/env';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { useFormAnalytics } from 'lib/analytics';
import { isTezAsset, TEZ_TOKEN_SLUG, toPenny } from 'lib/assets';
import { toTransferParams } from 'lib/assets/contract.utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { toLocalFixed, T, t } from 'lib/i18n';
import { useTezosAssetMetadata, getAssetSymbol } from 'lib/metadata';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { useTypedSWR } from 'lib/swr';
import { loadContract } from 'lib/temple/contract';
import { useFilteredContacts, validateRecipient } from 'lib/temple/front';
import { mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { isValidTezosAddress, isTezosContractAddress, tezosManagerKeyHasManager } from 'lib/tezos';
import { useSafeState } from 'lib/ui/hooks';
import { useScrollIntoView } from 'lib/ui/use-scroll-into-view';
import { readClipboard } from 'lib/ui/utils';
import { ZERO } from 'lib/utils/numbers';
import { AccountForTezos } from 'temple/accounts';
import {
  isTezosDomainsNameValid,
  getTezosToolkitWithSigner,
  getTezosDomainsClient,
  useTezosAddressByDomainName
} from 'temple/front/tezos';
import { TezosNetworkEssentials } from 'temple/networks';

import ContactsDropdown, { ContactsDropdownProps } from './ContactsDropdown';
import { FeeSection } from './FeeSection';
import { SelectAssetButton } from './SelectAssetButton';
import { SendFormSelectors } from './selectors';
import { SpinnerSection } from './SpinnerSection';
import { useAddressFieldAnalytics } from './use-address-field-analytics';

interface FormData {
  to: string;
  amount: string;
  fee: number;
}

const PENNY = 0.000001;
const RECOMMENDED_ADD_FEE = 0.0001;

interface Props {
  account: AccountForTezos;
  network: TezosNetworkEssentials;
  assetSlug: string;
  onSelectMyAccountClick: EmptyFn;
  onSelectTokenClick: EmptyFn;
  onAddContactRequested: (address: string) => void;
}

export const Form: FC<Props> = ({
  account,
  network,
  assetSlug,
  onSelectTokenClick,
  onSelectMyAccountClick,
  onAddContactRequested
}) => {
  const { registerBackHandler } = useAppEnv();

  const assetMetadata = useTezosAssetMetadata(assetSlug, network.chainId);
  const assetPrice = useAssetFiatCurrencyPrice(assetSlug, network.chainId);

  const assetSymbol = useMemo(() => getAssetSymbol(assetMetadata), [assetMetadata]);

  const { allContacts } = useFilteredContacts();

  const accountPkh = account.address;
  const tezos = getTezosToolkitWithSigner(network.rpcBaseURL, account.ownerAddress || accountPkh);
  const domainsClient = getTezosDomainsClient(network.chainId, network.rpcBaseURL);

  const formAnalytics = useFormAnalytics('SendForm');

  const { value: balance = ZERO } = useTezosAssetBalance(assetSlug, accountPkh, network);
  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const [shouldUseFiat, setShouldUseFiat] = useSafeState(false);

  const canToggleFiat = network.chainId === ChainIds.MAINNET;
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

      const newShouldUseFiat = !shouldUseFiat;
      setShouldUseFiat(newShouldUseFiat);
      if (!getValues().amount) {
        return;
      }
      const amount = new BigNumber(getValues().amount);
      setValue(
        'amount',
        (newShouldUseFiat ? amount.multipliedBy(assetPrice) : amount.div(assetPrice)).toFormat(
          newShouldUseFiat ? 2 : 6,
          BigNumber.ROUND_FLOOR,
          {
            decimalSeparator: '.'
          }
        )
      );
    },
    [setShouldUseFiat, shouldUseFiat, getValues, assetPrice, setValue]
  );

  useEffect(() => {
    if (!canToggleFiat && prevCanToggleFiat.current && shouldUseFiat) {
      setShouldUseFiat(false);
      setValue('amount', undefined);
    }
    prevCanToggleFiat.current = canToggleFiat;
  }, [setShouldUseFiat, canToggleFiat, shouldUseFiat, setValue]);

  const toValue = watch('to');
  const amountValue = watch('amount');
  const feeValue = watch('fee') ?? RECOMMENDED_ADD_FEE;

  const amountFieldRef = useRef<HTMLInputElement>(null);

  const { onBlur } = useAddressFieldAnalytics(network, toValue, 'RECIPIENT_NETWORK');

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

  const toFilledWithKTAddress = useMemo(
    () => isValidTezosAddress(toResolved) && isTezosContractAddress(toResolved),
    [toResolved]
  );

  const filledContact = useMemo(
    () => (toResolved && allContacts.find(c => c.address === toResolved)) || null,
    [allContacts, toResolved]
  );

  const cleanToField = useCallback(() => {
    setValue('to', '');
    triggerValidation('to');
  }, [setValue, triggerValidation]);

  const toFieldRef = useScrollIntoView<HTMLTextAreaElement>(Boolean(toFilled), { block: 'center' });

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
        estimatedBaseFee = estimatedBaseFee.plus(mutezToTz(DEFAULT_FEE.REVEAL));
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
    if (!(baseFee instanceof BigNumber)) return null;

    const maxAmountAsset = isTezAsset(assetSlug)
      ? getMaxAmountToken(account.type, balance, baseFee, safeFeeValue)
      : balance;

    return shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), maxAmountAsset) : maxAmountAsset;
  }, [account, assetSlug, balance, baseFee, safeFeeValue, shouldUseFiat, assetPrice]);

  const validateAmount = useCallback(
    (v?: number) => {
      if (v === undefined) return t('required');
      if (!isTezosContractAddress(toValue) && v === 0) {
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
    async ({ amount, fee: feeVal }: FormData) => {
      if (formState.isSubmitting) return;
      setSubmitError(null);

      formAnalytics.trackSubmit();

      try {
        if (!assetMetadata) throw new Error('Metadata not found');

        if (isTezosContractAddress(accountPkh)) {
          const michelsonLambda = isTezosContractAddress(toResolved) ? transferToContract : transferImplicit;

          const contract = await loadContract(tezos, accountPkh);
          await contract.methods.do(michelsonLambda(toResolved, tzToMutez(amount))).send({ amount: 0 });
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
      formState.isSubmitting,
      tezos,
      assetSlug,
      assetMetadata,
      setSubmitError,
      reset,
      toResolved,
      shouldUseFiat,
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

  const handleAmountClean = useCallback(() => {
    setValue('amount', undefined);
    triggerValidation('amount');
  }, [setValue, triggerValidation]);

  const handleToFieldBlur = useCallback(() => {
    setToFieldFocused(false);
    onBlur();
  }, [setToFieldFocused, onBlur]);

  const allContactsWithoutCurrent = useMemo(
    () => allContacts.filter(c => c.address !== accountPkh),
    [allContacts, accountPkh]
  );

  const { selectedFiatCurrency } = useFiatCurrency();

  const isContactsDropdownOpen = getFilled(toFilled, toFieldFocused);

  const handlePasteButtonClick = useCallback(() => {
    readClipboard()
      .then(value => setValue('to', value))
      .catch(console.error);
  }, [setValue]);

  return (
    <>
      <div className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto">
        <div className="text-font-description-bold mb-2">
          <T id="token" />
        </div>

        <SelectAssetButton
          network={network}
          accountPkh={accountPkh}
          selectedAssetSlug={assetSlug}
          onClick={onSelectTokenClick}
          className="mb-4"
          testID={SendFormSelectors.selectAssetButton}
        />

        <form id="send-form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="amount"
            control={control}
            rules={{ validate: validateAmount }}
            onChange={([v]) => v}
            as={
              <AssetField
                ref={amountFieldRef}
                onFocus={handleAmountFieldFocus}
                assetDecimals={shouldUseFiat ? 2 : assetMetadata?.decimals ?? 0}
                cleanable={isString(amountValue)}
                rightSideComponent={
                  !amountValue &&
                  maxAmount && (
                    <Button
                      type="button"
                      onClick={handleSetMaxAmount}
                      className="text-font-description-bold text-white bg-primary rounded-md px-2 py-1"
                    >
                      <T id="max" />
                    </Button>
                  )
                }
                underneathComponent={
                  <div className="flex justify-between mt-1">
                    <span>
                      {amountValue ? (
                        <ConvertedInputAssetAmount
                          tezosChainId={network.chainId}
                          assetSlug={assetSlug}
                          assetMetadata={assetMetadata}
                          amountValue={shouldUseFiat ? toAssetAmount(amountValue) : amountValue}
                          toFiat={!shouldUseFiat}
                        />
                      ) : null}
                    </span>
                    {canToggleFiat && (
                      <Button
                        className="text-font-description-bold text-secondary px-1 py-0.5"
                        onClick={handleFiatToggle}
                      >
                        Switch to {shouldUseFiat ? assetSymbol : selectedFiatCurrency.name}
                      </Button>
                    )}
                  </div>
                }
                onClean={handleAmountClean}
                label={t('amount')}
                placeholder="0.00"
                errorCaption={errors.amount?.message}
                containerClassName="mb-8"
                autoFocus={Boolean(maxAmount)}
                testID={SendFormSelectors.amountInput}
              />
            }
          />

          <Controller
            name="to"
            control={control}
            rules={{ validate: (value: any) => validateRecipient(value, domainsClient) }}
            onChange={([v]) => v}
            as={
              <NoSpaceField
                ref={toFieldRef}
                onFocus={handleToFieldFocus}
                extraRightInner={
                  <InnerDropDownComponentGuard
                    contacts={allContactsWithoutCurrent}
                    opened={isContactsDropdownOpen}
                    onSelect={handleAccountSelect}
                    searchTerm={toValue}
                  />
                }
                extraRightInnerWrapper="unset"
                onBlur={handleToFieldBlur}
                textarea
                showPasteButton
                rows={3}
                cleanable={Boolean(toValue)}
                onClean={cleanToField}
                onPasteButtonClick={handlePasteButtonClick}
                id="send-to"
                label={t('recipient')}
                placeholder="Address or Domain name"
                errorCaption={!toFieldFocused ? errors.to?.message : null}
                style={{ resize: 'none' }}
                containerClassName="mb-4"
                testID={SendFormSelectors.recipientInput}
              />
            }
          />

          <div
            className="cursor-pointer flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
            onClick={onSelectMyAccountClick}
          >
            <div className="flex justify-center items-center gap-2">
              <div className="flex p-px rounded-md border border-secondary">
                <Identicon type="bottts" hash="selectaccount" size={20} />
              </div>
              <span className="text-font-medium-bold">Select My Account</span>
            </div>
            <IconBase Icon={CompactDown} className="text-primary" size={16} />
          </div>

          {resolvedAddress && (
            <div className="mb-4 -mt-3 text-xs font-light text-gray-600 flex flex-wrap items-center">
              <span className="mr-1 whitespace-nowrap">{t('resolvedAddress')}:</span>
              <span className="font-normal">{resolvedAddress}</span>
            </div>
          )}

          {toFilled && !filledContact ? (
            <div className="mb-4 -mt-3 text-xs font-light text-gray-600 flex flex-wrap items-center">
              <button
                type="button"
                className="text-xs font-light text-gray-600 underline"
                onClick={() => onAddContactRequested(toResolved)}
              >
                <T id="addThisAddressToContacts" />
              </button>
            </div>
          ) : null}

          {estimateFallbackDisplayed ? (
            <SpinnerSection />
          ) : (
            <FeeSection
              accountPkh={accountPkh}
              tezosChainId={network.chainId}
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
      </div>

      <div className="flex flex-col pt-4 px-4 pb-6">
        <StyledButton
          type="submit"
          form="send-form"
          size="L"
          color="primary"
          disabled={Boolean(estimationError) || !restFormDisplayed}
          testID={SendFormSelectors.sendButton}
        >
          Review
        </StyledButton>
      </div>
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
    const transferParamsWrapper = contract.methods.do(michelsonLambda(to, tzToMutez(balanceBN))).toTransferParams();
    estmtnMax = await tezos.estimate.transfer(transferParamsWrapper);
  } else if (tez) {
    const estmtn = await tezos.estimate.transfer(transferParams);
    let amountMax = balanceBN.minus(mutezToTz(estmtn.totalCost));
    if (!tezosManagerKeyHasManager(manager)) {
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
