import React, { memo, ReactNode, useCallback, useLayoutEffect, useMemo, useRef } from 'react';

import { DelegateParams, getRevealFee, TransactionOperation, WalletOperation } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { Controller, useForm } from 'react-hook-form';

import { NoSpaceField } from 'app/atoms';
import { ArtificialError, NotEnoughFundsError, ZeroBalanceError } from 'app/defaults';
import { useAppEnv } from 'app/env';
import OperationStatus from 'app/templates/OperationStatus';
import { useFormAnalytics } from 'lib/analytics';
import { submitDelegation } from 'lib/apis/everstake';
import { BLOCK_DURATION } from 'lib/fixed-times';
import { TID, t } from 'lib/i18n';
import { RECOMMENDED_BAKER_ADDRESS } from 'lib/known-bakers';
import { setDelegate } from 'lib/michelson';
import { useTypedSWR } from 'lib/swr';
import { loadContract } from 'lib/temple/contract';
import {
  isDomainNameValid,
  useAccount,
  useKnownBaker,
  useNetwork,
  useTezos,
  useTezosDomainsClient,
  validateDelegate
} from 'lib/temple/front';
import { useTezosAddressByDomainName } from 'lib/temple/front/tzdns';
import { hasManager, isAddressValid, isKTAddress, mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { useSafeState } from 'lib/ui/hooks';
import { fifoResolve } from 'lib/utils';

import { BakerForm, BakerFormProps } from './BakerForm';
import { UnchangedError, UnregisteredDelegateError } from './errors';
import { DelegateFormSelectors } from './selectors';

const PENNY = 0.000001;
const RECOMMENDED_ADD_FEE = 0.0001;

interface FormData {
  to: string;
  fee: number;
}

interface Props {
  balance: BigNumber;
}

const DelegateForm = memo<Props>(({ balance }) => {
  const { registerBackHandler } = useAppEnv();
  const formAnalytics = useFormAnalytics('DelegateForm');
  const network = useNetwork();
  const isDcpNetwork = network.type === 'dcp';

  const acc = useAccount();
  const tezos = useTezos();

  const accountPkh = acc.publicKeyHash;

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
  const { data: resolvedAddress } = useTezosAddressByDomainName(toValue);

  const toFieldRef = useRef<HTMLTextAreaElement>(null);

  const toFilled = useMemo(
    () => (resolvedAddress ? toFilledWithDomain : toFilledWithAddress),
    [toFilledWithAddress, toFilledWithDomain, resolvedAddress]
  );

  const toResolved = useMemo(() => resolvedAddress || toValue, [resolvedAddress, toValue]);

  const getEstimation = useCallback(async () => {
    if (acc.type === TempleAccountType.ManagedKT) {
      const contract = await loadContract(tezos, accountPkh);
      const transferParams = contract.methods.do(setDelegate(toResolved)).toTransferParams();
      return tezos.estimate.transfer(transferParams);
    } else {
      return tezos.estimate.setDelegate({
        source: accountPkh,
        delegate: toResolved
      } as DelegateParams);
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
      if (balance.isZero()) throw new ZeroBalanceError();

      const estmtn = await getEstimation();
      const manager = await tezos.rpc.getManagerKey(
        acc.type === TempleAccountType.ManagedKT ? acc.owner : acc.publicKeyHash
      );

      let baseFee = mutezToTz(estmtn.burnFeeMutez + estmtn.suggestedFeeMutez);
      if (!hasManager(manager) && acc.type !== TempleAccountType.ManagedKT) {
        baseFee = baseFee.plus(mutezToTz(getRevealFee(acc.publicKeyHash)));
      }

      if (baseFee.isGreaterThanOrEqualTo(balance)) {
        throw new NotEnoughFundsError();
      }

      return baseFee;
    } catch (err: any) {
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
  }, [balance, tezos, getEstimation, acc]);

  const {
    data: baseFee,
    error: estimateBaseFeeError,
    isValidating: estimating
  } = useTypedSWR(
    () => (toFilled ? ['delegate-base-fee', tezos.checksum, accountPkh, toResolved] : null),
    estimateBaseFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: BLOCK_DURATION
    }
  );
  const baseFeeError = baseFee instanceof Error ? baseFee : estimateBaseFeeError;
  const estimationError = !estimating ? baseFeeError : null;

  const { data: baker, isValidating: bakerValidating } = useKnownBaker(toResolved || null, false);

  const maxAddFee = useMemo(() => {
    if (baseFee instanceof BigNumber) {
      return new BigNumber(balanceNum).minus(baseFee).minus(PENNY).toNumber();
    }
    return undefined;
  }, [balanceNum, baseFee]);

  const fifoValidateDelegate = useMemo(
    () => fifoResolve((value: any) => validateDelegate(value, domainsClient, validateAddress)),
    [domainsClient]
  );

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
        let op: WalletOperation | TransactionOperation;
        let opHash = '';
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

          opHash = op.opHash;
        }

        setOperation(op);
        reset({ to: '', fee: RECOMMENDED_ADD_FEE });

        if (to === RECOMMENDED_BAKER_ADDRESS && opHash) {
          submitDelegation(opHash);
        }

        formAnalytics.trackSubmitSuccess(analyticsProperties);
      } catch (err: any) {
        formAnalytics.trackSubmitFail(analyticsProperties);

        if (err.message === 'Declined') {
          return;
        }

        console.error(err);

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
      {operation && <OperationStatus typeTitle={t('delegation')} operation={operation} className="mb-8" />}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="to"
          as={<NoSpaceField ref={toFieldRef} />}
          control={control}
          rules={{ validate: fifoValidateDelegate }}
          onChange={([v]) => v}
          onFocus={() => toFieldRef.current?.focus()}
          textarea
          rows={2}
          cleanable={Boolean(toValue)}
          onClean={cleanToField}
          id="delegate-to"
          label={isDcpNetwork ? t('producer') : t('customBaker')}
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
          containerClassName={!resolvedAddress && 'mb-6'}
          fieldWrapperBottomMargin={false}
          testID={DelegateFormSelectors.bakerInput}
        />

        {resolvedAddress && (
          <div className="mb-6 text-xs font-light text-gray-600 flex flex-wrap items-center">
            <span className="mr-1 whitespace-nowrap">{t('resolvedAddress')}:</span>
            <span className="font-normal">{resolvedAddress}</span>
          </div>
        )}

        <BakerForm
          baker={baker}
          balance={balance}
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
});

export default DelegateForm;

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
