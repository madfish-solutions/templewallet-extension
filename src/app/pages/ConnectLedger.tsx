import React, { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import Alert from 'app/atoms/Alert';
import ConfirmLedgerOverlay from 'app/atoms/ConfirmLedgerOverlay';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { ReactComponent as LinkIcon } from 'app/icons/link.svg';
import { ReactComponent as OkIcon } from 'app/icons/ok.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import {
  DerivationType,
  TempleAccountType,
  useAllAccounts,
  useSetAccountPkh,
  useTempleClient,
  validateDerivationPath
} from 'lib/temple/front';
import { navigate } from 'lib/woozie';

type FormData = {
  name: string;
  customDerivationPath: string;
  derivationType?: DerivationType;
  accountNumber?: number;
};

const DERIVATION_PATHS = [
  {
    type: 'default',
    name: t('defaultAccount')
  },
  {
    type: 'another',
    name: t('anotherAccount')
  },
  {
    type: 'custom',
    name: t('customDerivationPath')
  }
];

const DERIVATION_TYPES = [
  {
    type: DerivationType.ED25519,
    name: 'ED25519 (tz1...)'
  },
  {
    type: DerivationType.SECP256K1,
    name: 'SECP256K1 (tz2...)'
  },
  {
    type: DerivationType.P256,
    name: 'P256 (tz3...)'
  }
];

const ConnectLedger: FC = () => {
  const { createLedgerAccount, createLedgerLiveAccount } = useTempleClient();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();
  const formAnalytics = useFormAnalytics('ConnectLedger');

  const allLedgers = useMemo(() => allAccounts.filter(acc => acc.type === TempleAccountType.Ledger), [allAccounts]);

  const defaultName = useMemo(() => t('defaultLedgerName', String(allLedgers.length + 1)), [allLedgers.length]);

  const prevAccLengthRef = useRef(allAccounts.length);
  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

  const { control, register, handleSubmit, errors, formState } = useForm<FormData>({
    defaultValues: {
      name: defaultName,
      customDerivationPath: "m/44'/1729'/0'/0'",
      accountNumber: 1,
      derivationType: DerivationType.ED25519
    }
  });
  const submitting = formState.isSubmitting;

  const [error, setError] = useState<ReactNode>(null);
  const [derivationPathType, setDerivationPathType] = useState(DERIVATION_PATHS[0].type);

  const onSubmit = useCallback(
    async ({ name, accountNumber, customDerivationPath, derivationType }: FormData) => {
      if (submitting) return;

      setError(null);

      formAnalytics.trackSubmit();
      try {
        if (window.navigator.hid) {
          await createLedgerAccount(
            name,
            derivationType,
            customDerivationPath ?? (accountNumber && `m/44'/1729'/${accountNumber - 1}'/0'`)
          );
        } else {
          await createLedgerLiveAccount(
            name,
            derivationType,
            customDerivationPath ?? (accountNumber && `m/44'/1729'/${accountNumber - 1}'/0'`)
          );
        }

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError(err.message);
      }
    },
    [submitting, createLedgerAccount, createLedgerLiveAccount, setError, formAnalytics]
  );

  // const handleLedgerConnect = useCallback(
  //   async ({ name, accountNumber, customDerivationPath, derivationType }: FormData) => {
  //     if (submitting) return;

  //     setError(null);

  //     formAnalytics.trackSubmit();
  //     try {
  //       await createLedgerAccount(
  //         name,
  //         derivationType,
  //         customDerivationPath ?? (accountNumber && `m/44'/1729'/${accountNumber - 1}'/0'`)
  //       );

  //       formAnalytics.trackSubmitSuccess();
  //     } catch (err: any) {
  //       formAnalytics.trackSubmitFail();

  //       console.error(err);

  //       // Human delay.
  //       await new Promise(res => setTimeout(res, 300));
  //       setError(err.message);
  //     }
  //   },
  //   [submitting, createLedgerAccount, setError, formAnalytics]
  // );

  return (
    <PageLayout
      pageTitle={
        <T id="connectLedger">
          {message => (
            <>
              <LinkIcon className="w-auto h-4 mr-1 stroke-current" />
              {message}
            </>
          )}
        </T>
      }
    >
      <div className="relative w-full">
        <div className="w-full max-w-sm mx-auto mt-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {error && <Alert type="error" title={t('error')} autoFocus description={error} className="mb-6" />}

            <FormField
              ref={register({
                pattern: {
                  value: /^.{0,16}$/,
                  message: t('ledgerNameConstraint')
                }
              })}
              label={t('accountName')}
              labelDescription={t('ledgerNameInputDescription')}
              id="create-ledger-name"
              type="text"
              name="name"
              placeholder={defaultName}
              errorCaption={errors.name?.message}
              containerClassName="mb-4"
            />

            <div className="mb-4 flex flex-col">
              <h2 className="mb-4 leading-tight flex flex-col">
                <span className="text-base font-semibold text-gray-700">
                  <T id="derivationType" />{' '}
                  <span className="text-sm font-light text-gray-600">
                    <T id="optionalComment" />
                  </span>
                </span>

                <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
                  <T id="derivationTypeFieldDescription" />
                </span>
              </h2>
              <Controller as={TypeSelect} control={control} name="derivationType" options={DERIVATION_TYPES} />
            </div>

            <div className={classNames('mb-4', 'flex flex-col')}>
              <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
                <span className="text-base font-semibold text-gray-700">
                  <T id="derivationPath" />{' '}
                  <span className="text-sm font-light text-gray-600">
                    <T id="optionalComment" />
                  </span>
                </span>

                <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
                  <T id="defaultDerivationPathLabel" substitutions={[<b>44'/1729'/0'/0'</b>]} />
                  <br />
                  <T id="clickOnCustomDerivationPath" />
                </span>
              </h2>
              <TypeSelect options={DERIVATION_PATHS} value={derivationPathType} onChange={setDerivationPathType} />
            </div>

            {derivationPathType === 'another' && (
              <FormField
                ref={register({
                  min: { value: 1, message: t('positiveIntMessage') },
                  required: t('required')
                })}
                min={0}
                type="number"
                name="accountNumber"
                id="importacc-acc-number"
                label={t('accountNumber')}
                placeholder="1"
                errorCaption={errors.accountNumber?.message}
              />
            )}

            {derivationPathType === 'custom' && (
              <FormField
                ref={register({
                  required: t('required'),
                  validate: validateDerivationPath
                })}
                name="customDerivationPath"
                id="importacc-cdp"
                label={t('customDerivationPath')}
                placeholder={t('derivationPathExample2')}
                errorCaption={errors.customDerivationPath?.message}
                containerClassName="mb-6"
              />
            )}

            <T id="addLedgerAccount">
              {message => (
                <FormSubmitButton loading={submitting} className="mt-8">
                  {message} via Ledger live
                </FormSubmitButton>
              )}
            </T>
            <T id="addLedgerAccount">
              {message => (
                <FormSubmitButton loading={submitting} className="mt-8">
                  {message} without Ledger Live
                </FormSubmitButton>
              )}
            </T>
          </form>
        </div>

        <ConfirmLedgerOverlay displayed={submitting} />
      </div>
    </PageLayout>
  );
};

export default ConnectLedger;

type TypeSelectOption<T extends string | number> = {
  type: T;
  name: string;
};
type TypeSelectProps<T extends string | number> = {
  options: TypeSelectOption<T>[];
  value?: T;
  onChange: (value: T) => void;
};

const TypeSelect = <T extends string | number>(props: TypeSelectProps<T>) => {
  const { options, value, onChange } = props;

  return (
    <div
      className={classNames(
        'rounded-md overflow-hidden',
        'border-2 bg-gray-100',
        'flex flex-col',
        'text-gray-700 text-sm leading-tight'
      )}
    >
      {options.map((option, index) => (
        <TypeSelectItem
          key={option.type}
          option={option}
          onSelect={onChange}
          selected={option.type === value}
          last={index === options.length - 1}
        />
      ))}
    </div>
  );
};

type TypeSelectItemProps<T extends string | number> = {
  option: TypeSelectOption<T>;
  onSelect: (value: T) => void;
  selected: boolean;
  last: boolean;
};

const TypeSelectItem = <T extends string | number>(props: TypeSelectItemProps<T>) => {
  const { option, onSelect, selected, last } = props;

  const handleClick = useCallback(() => onSelect(option.type), [onSelect, option.type]);

  return (
    <button
      type="button"
      className={classNames(
        'block w-full',
        'overflow-hidden',
        !last && 'border-b border-gray-200',
        selected ? 'bg-gray-300' : 'hover:bg-gray-200 focus:bg-gray-200',
        'flex items-center',
        'text-gray-700',
        'transition ease-in-out duration-200',
        'focus:outline-none',
        'opacity-90 hover:opacity-100'
      )}
      style={{
        padding: '0.4rem 0.375rem 0.4rem 0.375rem'
      }}
      onClick={handleClick}
    >
      {option.name}
      <div className="flex-1" />
      {selected && (
        <OkIcon
          className={classNames('mx-2 h-4 w-auto stroke-2')}
          style={{
            stroke: '#777'
          }}
        />
      )}
    </button>
  );
};
