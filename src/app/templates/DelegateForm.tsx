import React, { FC, ReactNode, useCallback, useLayoutEffect, useMemo, useRef } from 'react';

import { DEFAULT_FEE, WalletOperation } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Control, Controller, FieldError, FormStateProxy, NestDataObject, useForm } from 'react-hook-form';
import useSWR from 'swr';
import browser from 'webextension-polyfill';

import { Alert, Button, FormSubmitButton, NoSpaceField } from 'app/atoms';
import Money from 'app/atoms/Money';
import Spinner from 'app/atoms/Spinner/Spinner';
import { ArtificialError, NotEnoughFundsError, ZeroBalanceError } from 'app/defaults';
import { useAppEnv } from 'app/env';
import AdditionalFeeInput from 'app/templates/AdditionalFeeInput/AdditionalFeeInput';
import BakerBanner from 'app/templates/BakerBanner';
import InFiat from 'app/templates/InFiat';
import OperationStatus from 'app/templates/OperationStatus';
import { useFormAnalytics } from 'lib/analytics';
import { submitDelegation } from 'lib/apis/everstake';
import { ABTestGroup } from 'lib/apis/temple';
import { T, t, TID } from 'lib/i18n';
import { setDelegate } from 'lib/michelson';
import { fetchTezosBalance } from 'lib/temple/assets';
import { loadContract } from 'lib/temple/contract';
import {
  Baker,
  isDomainNameValid,
  useAccount,
  useBalance,
  useGasToken,
  useKnownBaker,
  useKnownBakers,
  useNetwork,
  useTezos,
  useTezosDomainsClient,
  validateDelegate
} from 'lib/temple/front';
import { hasManager, isAddressValid, isKTAddress, mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { useSafeState } from 'lib/ui/hooks';
import { Link, useLocation } from 'lib/woozie';

import { useUserTestingGroupNameSelector } from '../store/ab-testing/selectors';
import { DelegateFormSelectors } from './DelegateForm.selectors';

const PENNY = 0.000001;
const RECOMMENDED_ADD_FEE = 0.0001;
const SORT_BAKERS_BY_KEY = 'sort_bakers_by';

interface FormData {
  to: string;
  fee: number;
}

const sponsoredBaker = 'tz1aRoaRhSpRYvFdyvgWLL6TGyRoGF51wDjM';

const DelegateForm: FC = () => {
  const { registerBackHandler } = useAppEnv();
  const formAnalytics = useFormAnalytics('DelegateForm');
  const { symbol, isDcpNetwork, logo } = useGasToken();

  const acc = useAccount();
  const tezos = useTezos();

  const accountPkh = acc.publicKeyHash;

  const { data: balanceData, mutate: mutateBalance } = useBalance('tez', accountPkh);
  const balance = balanceData!;
  const balanceNum = balance.toNumber();
  const domainsClient = useTezosDomainsClient();
  const canUseDomainNames = domainsClient.isSupported;

  /**
   * Form
   */

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation, reset } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      fee: RECOMMENDED_ADD_FEE
    }
  });

  const toValue = watch('to');

  const toFilledWithAddress = useMemo(() => Boolean(toValue && isAddressValid(toValue)), [toValue]);
  const toFilledWithDomain = useMemo(
    () => toValue && isDomainNameValid(toValue, domainsClient),
    [toValue, domainsClient]
  );
  const domainAddressFactory = useCallback(
    (_k: string, _checksum: string, value: string) => domainsClient.resolver.resolveNameToAddress(value),
    [domainsClient]
  );
  const { data: resolvedAddress } = useSWR(['tzdns-address', tezos.checksum, toValue], domainAddressFactory, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });

  const toFieldRef = useRef<HTMLTextAreaElement>(null);

  const toFilled = useMemo(
    () => (resolvedAddress ? toFilledWithDomain : toFilledWithAddress),
    [toFilledWithAddress, toFilledWithDomain, resolvedAddress]
  );

  const toResolved = useMemo(() => resolvedAddress || toValue, [resolvedAddress, toValue]);

  const getEstimation = useCallback(async () => {
    const to = toResolved;
    if (acc.type === TempleAccountType.ManagedKT) {
      const contract = await loadContract(tezos, accountPkh);
      const transferParams = contract.methods.do(setDelegate(to)).toTransferParams();
      return tezos.estimate.transfer(transferParams);
    } else {
      return tezos.estimate.setDelegate({
        source: accountPkh,
        delegate: to
      });
    }
  }, [tezos, accountPkh, acc.type, toResolved]);

  const cleanToField = useCallback(() => {
    setValue('to', '');
    triggerValidation('to');
  }, [setValue, triggerValidation]);

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
      const balanceBN = (await mutateBalance(fetchTezosBalance(tezos, accountPkh)))!;
      if (balanceBN.isZero()) {
        throw new ZeroBalanceError();
      }

      const estmtn = await getEstimation();
      const manager = await tezos.rpc.getManagerKey(acc.type === TempleAccountType.ManagedKT ? acc.owner : accountPkh);
      let baseFee = mutezToTz(estmtn.burnFeeMutez + estmtn.suggestedFeeMutez);
      if (!hasManager(manager) && acc.type !== TempleAccountType.ManagedKT) {
        baseFee = baseFee.plus(mutezToTz(DEFAULT_FEE.REVEAL));
      }

      if (baseFee.isGreaterThanOrEqualTo(balanceBN)) {
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
        case ['delegate.unchanged', 'delegate.already_active'].some(errorLabel => err?.id.includes(errorLabel)):
          return new UnchangedError(err.message);

        case err?.id.includes('unregistered_delegate'):
          return new UnregisteredDelegateError(err.message);

        default:
          throw err;
      }
    }
  }, [tezos, accountPkh, mutateBalance, getEstimation, acc]);

  const {
    data: baseFee,
    error: estimateBaseFeeError,
    isValidating: estimating
  } = useSWR(() => (toFilled ? ['delegate-base-fee', tezos.checksum, accountPkh, toResolved] : null), estimateBaseFee, {
    shouldRetryOnError: false,
    focusThrottleInterval: 10_000,
    dedupingInterval: 30_000
  });
  const baseFeeError = baseFee instanceof Error ? baseFee : estimateBaseFeeError;
  const estimationError = !estimating ? baseFeeError : null;

  const { data: baker, isValidating: bakerValidating } = useKnownBaker(toResolved || null, false);

  const maxAddFee = useMemo(() => {
    if (baseFee instanceof BigNumber) {
      return new BigNumber(balanceNum).minus(baseFee).minus(PENNY).toNumber();
    }
    return undefined;
  }, [balanceNum, baseFee]);

  const handleFeeFieldChange = useCallback<BakerFormProps['handleFeeFieldChange']>(
    ([v]) => (maxAddFee && v > maxAddFee ? maxAddFee : v),
    [maxAddFee]
  );

  const [submitError, setSubmitError] = useSafeState<ReactNode>(null, `${tezos.checksum}_${toResolved}`);
  const [operation, setOperation] = useSafeState<any>(null, tezos.checksum);

  const onSubmit = useCallback(
    async ({ fee: feeVal }: FormData) => {
      const to = toResolved;
      if (formState.isSubmitting) return;
      setSubmitError(null);
      setOperation(null);

      const analyticsProperties = { bakerAddress: to };

      formAnalytics.trackSubmit(analyticsProperties);
      try {
        const estmtn = await getEstimation();
        const addFee = tzToMutez(feeVal ?? 0);
        const fee = addFee.plus(estmtn.suggestedFeeMutez).toNumber();
        let op: WalletOperation;
        if (acc.type === TempleAccountType.ManagedKT) {
          const contract = await loadContract(tezos, acc.publicKeyHash);
          op = await contract.methods.do(setDelegate(to)).send({ amount: 0 });
        } else {
          op = await tezos.wallet
            .setDelegate({
              source: accountPkh,
              delegate: to,
              fee
            } as any)
            .send();
        }

        setOperation(op);
        reset({ to: '', fee: RECOMMENDED_ADD_FEE });

        if (to === sponsoredBaker) {
          submitDelegation(op.opHash);
        }

        formAnalytics.trackSubmitSuccess(analyticsProperties);
      } catch (err: any) {
        formAnalytics.trackSubmitFail(analyticsProperties);

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
      accountPkh,
      setSubmitError,
      setOperation,
      reset,
      getEstimation,
      formAnalytics,
      toResolved
    ]
  );

  return (
    <>
      {operation && <OperationStatus typeTitle={t('delegation')} operation={operation} />}

      <form onSubmit={handleSubmit(onSubmit)}>
        {useMemo(
          () => (
            <div className={classNames('mb-6', 'border rounded-md', 'p-2', 'flex items-center')}>
              <img src={browser.runtime.getURL(logo)} alt={symbol} className="w-auto h-12 mr-3" />

              <div className="font-light leading-none">
                <div className="flex items-center">
                  <div className="flex flex-col">
                    <span className="text-xl text-gray-700 flex items-baseline">
                      <Money>{balance}</Money>{' '}
                      <span style={{ fontSize: '0.75em' }}>
                        <span className="ml-1">{symbol}</span>
                      </span>
                    </span>

                    <InFiat assetSlug="tez" volume={balance}>
                      {({ balance, symbol }) => (
                        <div className="mt-1 text-sm text-gray-500 flex items-baseline">
                          {balance}
                          <span className="ml-1">{symbol}</span>
                        </div>
                      )}
                    </InFiat>
                  </div>
                </div>
              </div>
            </div>
          ),
          [balance, symbol, logo]
        )}

        <Controller
          name="to"
          as={<NoSpaceField ref={toFieldRef} />}
          control={control}
          rules={{
            validate: (value: any) => validateDelegate(value, domainsClient, validateAddress)
          }}
          onChange={([v]) => v}
          onFocus={() => toFieldRef.current?.focus()}
          textarea
          rows={2}
          cleanable={Boolean(toValue)}
          onClean={cleanToField}
          id="delegate-to"
          label={isDcpNetwork ? t('producer') : t('baker')}
          labelDescription={
            canUseDomainNames
              ? t('bakerInputDescriptionWithDomain')
              : isDcpNetwork
              ? t('producerInputDescription')
              : t('bakerInputDescription')
          }
          placeholder={canUseDomainNames ? t('recipientInputPlaceholderWithDomain') : t('bakerInputPlaceholder')}
          errorCaption={errors.to?.message && t(errors.to.message.toString() as TID)}
          style={{
            resize: 'none'
          }}
          containerClassName="mb-4"
          testID={DelegateFormSelectors.bakerInput}
        />

        {resolvedAddress && (
          <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
            <span className="mr-1 whitespace-nowrap">{t('resolvedAddress')}:</span>
            <span className="font-normal">{resolvedAddress}</span>
          </div>
        )}

        <BakerForm
          baker={baker}
          submitError={submitError}
          estimationError={estimationError}
          estimating={estimating}
          baseFee={baseFee}
          toFilled={toFilled}
          bakerValidating={bakerValidating}
          control={control}
          errors={errors}
          handleFeeFieldChange={handleFeeFieldChange}
          setValue={setValue}
          triggerValidation={triggerValidation}
          formState={formState}
        />
      </form>
    </>
  );
};

export default DelegateForm;

interface BakerFormProps {
  baker: Baker | null | undefined;
  toFilled: boolean | '';
  submitError: ReactNode;
  estimationError: any;
  estimating: boolean;
  bakerValidating: boolean;
  baseFee?: BigNumber | ArtificialError | UnchangedError | UnregisteredDelegateError;
  control: Control<FormData>;
  handleFeeFieldChange: ([v]: any) => any;
  errors: NestDataObject<FormData, FieldError>;
  setValue: any;
  triggerValidation: (payload?: string | string[] | undefined, shouldRender?: boolean | undefined) => Promise<boolean>;
  formState: FormStateProxy<FormData>;
}

const BakerForm: React.FC<BakerFormProps> = ({
  baker,
  submitError,
  estimationError,
  estimating,
  bakerValidating,
  toFilled,
  baseFee,
  control,
  errors,
  handleFeeFieldChange,
  setValue,
  triggerValidation,
  formState
}) => {
  const testGroupName = useUserTestingGroupNameSelector();
  const assetSymbol = 'ꜩ';
  const estimateFallbackDisplayed = toFilled && !baseFee && (estimating || bakerValidating);
  if (estimateFallbackDisplayed) {
    return (
      <div className="flex justify-center my-8">
        <Spinner className="w-20" />
      </div>
    );
  }
  const restFormDisplayed = Boolean(toFilled && (baseFee || estimationError));
  const tzError = submitError || estimationError;
  return restFormDisplayed ? (
    <>
      <BakerBannerComponent baker={baker} tzError={tzError} />

      {tzError && <DelegateErrorAlert type={submitError ? 'submit' : 'estimation'} error={tzError} />}

      <AdditionalFeeInput
        name="fee"
        control={control}
        onChange={handleFeeFieldChange}
        assetSymbol={assetSymbol}
        baseFee={baseFee}
        error={errors.fee}
        id="delegate-fee"
      />

      <FormSubmitButton
        loading={formState.isSubmitting}
        disabled={Boolean(estimationError)}
        testID={DelegateFormSelectors.bakerDelegateButton}
        testIDProperties={{
          baker:
            baker?.address === sponsoredBaker
              ? testGroupName === ABTestGroup.B
                ? 'Known B Delegate Button'
                : 'Known A Delegate Button'
              : 'Unknown Delegate Button',
          abTestingCategory: testGroupName
        }}
      >
        {t('delegate')}
      </FormSubmitButton>
    </>
  ) : (
    <KnownDelegatorsList setValue={setValue} triggerValidation={triggerValidation} />
  );
};

interface BakerBannerComponentProps {
  baker: Baker | null | undefined;
  tzError: any;
}

const BakerBannerComponent: React.FC<BakerBannerComponentProps> = ({ tzError, baker }) => {
  const acc = useAccount();

  const accountPkh = acc.publicKeyHash;
  const { data: balanceData } = useBalance('tez', accountPkh);
  const balance = balanceData!;
  const balanceNum = balance.toNumber();
  const net = useNetwork();
  const { symbol } = useGasToken();
  return baker ? (
    <>
      <div className={classNames('-mt-2 mb-6', 'flex flex-col items-center')}>
        <BakerBanner bakerPkh={baker.address} style={{ width: undefined }} />
      </div>

      {!tzError && baker.minDelegation > balanceNum && (
        <Alert
          type="warn"
          title={t('minDelegationAmountTitle')}
          description={
            <T
              id="minDelegationAmountDescription"
              substitutions={[
                <span className="font-normal" key="minDelegationsAmount">
                  <Money>{baker.minDelegation}</Money> <span style={{ fontSize: '0.75em' }}>{symbol}</span>
                </span>
              ]}
            />
          }
          className="mb-6"
        />
      )}
    </>
  ) : !tzError && net.type === 'main' ? (
    <Alert type="warn" title={t('unknownBakerTitle')} description={t('unknownBakerDescription')} className="mb-6" />
  ) : null;
};

const KnownDelegatorsList: React.FC<{ setValue: any; triggerValidation: any }> = ({ setValue, triggerValidation }) => {
  const knownBakers = useKnownBakers();
  const { search } = useLocation();
  const testGroupName = useUserTestingGroupNameSelector();

  const bakerSortTypes = useMemo(
    () => [
      {
        key: 'rank',
        title: t('rank'),
        testID: DelegateFormSelectors.sortBakerByRankTab
      },
      {
        key: 'fee',
        title: t('fee'),
        testID: DelegateFormSelectors.sortBakerByFeeTab
      },
      {
        key: 'space',
        title: t('space'),
        testID: DelegateFormSelectors.sortBakerBySpaceTab
      },
      {
        key: 'staking',
        title: t('staking'),
        testID: DelegateFormSelectors.sortBakerByStakingTab
      }
    ],
    []
  );

  const sortBakersBy = useMemo(() => {
    const usp = new URLSearchParams(search);
    const val = usp.get(SORT_BAKERS_BY_KEY);
    return bakerSortTypes.find(({ key }) => key === val) ?? bakerSortTypes[0];
  }, [search, bakerSortTypes]);
  const baseSortedKnownBakers = useMemo(() => {
    if (!knownBakers) return null;

    const toSort = Array.from(knownBakers);
    switch (sortBakersBy.key) {
      case 'fee':
        return toSort.sort((a, b) => a.fee - b.fee);

      case 'space':
        return toSort.sort((a, b) => b.freeSpace - a.freeSpace);

      case 'staking':
        return toSort.sort((a, b) => b.stakingBalance - a.stakingBalance);

      case 'rank':
      default:
        return toSort;
    }
  }, [knownBakers, sortBakersBy]);
  if (!baseSortedKnownBakers) return null;
  const sponsoredBakers = baseSortedKnownBakers.filter(baker => baker.address === sponsoredBaker);
  const sortedKnownBakers = [
    ...sponsoredBakers,
    ...baseSortedKnownBakers.filter(baker => baker.address !== sponsoredBaker)
  ];
  return (
    <div className={classNames('my-6', 'flex flex-col')}>
      <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
        <T id="delegateToRecommendedBakers">
          {message => <span className="text-base font-semibold text-gray-700">{message}</span>}
        </T>

        <T
          id="clickOnBakerPrompt"
          substitutions={[
            <a
              href="https://baking-bad.org/"
              key="link"
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal underline"
            >
              Baking Bad
            </a>
          ]}
        >
          {message => (
            <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
              {message}
            </span>
          )}
        </T>
      </h2>

      <div className={classNames('mb-2', 'flex items-center')}>
        <T id="sortBy">{message => <span className={classNames('mr-1', 'text-xs text-gray-500')}>{message}</span>}</T>
        {bakerSortTypes.map(({ key, title, testID }, i, arr) => {
          const first = i === 0;
          const last = i === arr.length - 1;
          const selected = sortBakersBy.key === key;

          return (
            <Link
              key={key}
              to={{
                pathname: '/delegate',
                search: `${SORT_BAKERS_BY_KEY}=${key}`
              }}
              replace
              className={classNames(
                (() => {
                  switch (true) {
                    case first:
                      return classNames('rounded rounded-r-none', 'border');

                    case last:
                      return classNames('rounded rounded-l-none', 'border border-l-0');

                    default:
                      return 'border border-l-0';
                  }
                })(),
                selected && 'bg-gray-100',
                'px-2 py-px',
                'text-xs text-gray-600'
              )}
              testID={testID}
            >
              {title}
            </Link>
          );
        })}

        <div className="flex-1" />
      </div>

      <div
        className={classNames(
          'rounded-md overflow-hidden',
          'border',
          'flex flex-col',
          'text-gray-700 text-sm leading-tight'
        )}
      >
        {sortedKnownBakers.map((baker, i, arr) => {
          const last = i === arr.length - 1;
          const handleBakerClick = () => {
            setValue('to', baker.address);
            triggerValidation('to');
            window.scrollTo(0, 0);
          };

          let testId = DelegateFormSelectors.knownBakerItemButton;
          let classnames = classNames(
            'hover:bg-gray-100 focus:bg-gray-100',
            'transition ease-in-out duration-200',
            'focus:outline-none',
            'opacity-90 hover:opacity-100'
          );

          if (baker.address === sponsoredBaker) {
            testId = DelegateFormSelectors.knownBakerItemAButton;
            if (testGroupName === ABTestGroup.B) {
              testId = DelegateFormSelectors.knownBakerItemBButton;
              classnames = classNames(
                'hover:bg-gray-100 focus:bg-gray-100',
                'transition ease-in-out duration-200',
                'focus:outline-none',
                'opacity-90 hover:opacity-100',
                'bg-orange-100'
              );
            }
          }

          return (
            <Button
              key={baker.address}
              type="button"
              className={classnames}
              onClick={handleBakerClick}
              testID={testId}
              testIDProperties={{ bakerAddress: baker.address, abTestingCategory: testGroupName }}
            >
              <BakerBanner
                bakerPkh={baker.address}
                link
                style={{ width: undefined }}
                promoted={baker.address === sponsoredBaker}
                className={classNames(!last && 'border-b border-gray-200')}
              />
            </Button>
          );
        })}
      </div>
    </div>
  );
};

type DelegateErrorAlertProps = {
  type: 'submit' | 'estimation';
  error: Error;
};

const DelegateErrorAlert: FC<DelegateErrorAlertProps> = ({ type, error }) => {
  const { symbol } = useGasToken();

  return (
    <Alert
      type={type === 'submit' ? 'error' : 'warn'}
      title={(() => {
        switch (true) {
          case error instanceof NotEnoughFundsError:
            return `${t('notEnoughFunds')} 😶`;

          case [UnchangedError, UnregisteredDelegateError].some(Err => error instanceof Err):
            return t('notAllowed');

          default:
            return t('failed');
        }
      })()}
      description={(() => {
        switch (true) {
          case error instanceof ZeroBalanceError:
            return t('yourBalanceIsZero');

          case error instanceof NotEnoughFundsError:
            return t('minimalFeeGreaterThanBalance');

          case error instanceof UnchangedError:
            return t('alreadyDelegatedFundsToBaker');

          case error instanceof UnregisteredDelegateError:
            return t('bakerNotRegistered');

          default:
            return (
              <>
                <T
                  id="unableToPerformActionToBaker"
                  substitutions={t(type === 'submit' ? 'delegate' : 'estimateDelegation').toLowerCase()}
                />
                <br />
                <T id="thisMayHappenBecause" />
                <ul className="mt-1 ml-2 text-xs list-disc list-inside">
                  <T id="minimalFeeGreaterThanBalanceVerbose" substitutions={symbol}>
                    {message => <li>{message}</li>}
                  </T>
                  <T id="networkOrOtherIssue">{message => <li>{message}</li>}</T>
                </ul>
              </>
            );
        }
      })()}
      autoFocus
      className={classNames('mt-6 mb-4')}
    />
  );
};

class UnchangedError extends Error {}

class UnregisteredDelegateError extends Error {}

function validateAddress(value: string) {
  switch (false) {
    case value?.length > 0:
      return true;

    case isAddressValid(value):
      return 'invalidAddress';

    case !isKTAddress(value):
      return 'unableToDelegateToKTAddress';

    default:
      return true;
  }
}
