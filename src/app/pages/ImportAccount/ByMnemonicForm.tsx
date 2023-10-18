import React, { FC, ReactNode, useCallback, useState } from 'react';

import clsx from 'clsx';
import { useForm } from 'react-hook-form';

import { Alert, FormField, FormSubmitButton } from 'app/atoms';
import { DEFAULT_DERIVATION_PATH, formatMnemonic } from 'app/defaults';
import { ReactComponent as OkIcon } from 'app/icons/ok.svg';
import { isSeedPhraseFilled, SeedPhraseInput } from 'app/templates/SeedPhraseInput';
import { setTestID, useFormAnalytics } from 'lib/analytics';
import { T, t, TID } from 'lib/i18n';
import { useTempleClient, validateDerivationPath } from 'lib/temple/front';
import { delay } from 'lib/utils';

import { defaultNumberOfWords } from './constants';
import { ImportAccountSelectors, ImportAccountFormType } from './selectors';

interface DerivationPath {
  type: string;
  i18nKey: TID;
}

const DERIVATION_PATHS: DerivationPath[] = [
  {
    type: 'default',
    i18nKey: 'defaultAccount'
  },
  {
    type: 'custom',
    i18nKey: 'customDerivationPath'
  }
];

interface ByMnemonicFormData {
  password?: string;
  customDerivationPath: string;
  accountNumber?: number;
}

export const ByMnemonicForm: FC = () => {
  const { importMnemonicAccount } = useTempleClient();
  const formAnalytics = useFormAnalytics(ImportAccountFormType.Mnemonic);

  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedError, setSeedError] = useState('');

  const [numberOfWords, setNumberOfWords] = useState(defaultNumberOfWords);

  const { register, handleSubmit, errors, formState, reset } = useForm<ByMnemonicFormData>({
    defaultValues: {
      customDerivationPath: DEFAULT_DERIVATION_PATH,
      accountNumber: 1
    }
  });
  const [error, setError] = useState<ReactNode>(null);
  const [derivationPath, setDerivationPath] = useState(DERIVATION_PATHS[0]);

  const onSubmit = useCallback(
    async ({ password, customDerivationPath }: ByMnemonicFormData) => {
      if (formState.isSubmitting) return;

      if (!seedError && isSeedPhraseFilled(seedPhrase)) {
        formAnalytics.trackSubmit();
        setError(null);

        try {
          await importMnemonicAccount(
            formatMnemonic(seedPhrase),
            password || undefined,
            derivationPath.type === 'custom' ? customDerivationPath || undefined : DEFAULT_DERIVATION_PATH
          );

          formAnalytics.trackSubmitSuccess();
        } catch (err: any) {
          formAnalytics.trackSubmitFail();

          console.error(err);

          // Human delay
          await delay();
          setError(err.message);
        }
      } else if (seedError === '') {
        setSeedError(t('mnemonicWordsAmountConstraint', [numberOfWords]) as string);
      }
    },
    [
      seedPhrase,
      seedError,
      formState.isSubmitting,
      setError,
      importMnemonicAccount,
      derivationPath,
      formAnalytics,
      numberOfWords
    ]
  );

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title={t('error')} autoFocus description={error} className="mb-6" />}

      <div className="mb-8">
        <SeedPhraseInput
          labelWarning={`${t('mnemonicInputWarning')}\n${t('seedPhraseAttention')}`}
          submitted={formState.submitCount !== 0}
          seedError={seedError}
          setSeedError={setSeedError}
          onChange={setSeedPhrase}
          reset={reset}
          testID={ImportAccountSelectors.mnemonicWordInput}
          numberOfWords={numberOfWords}
          setNumberOfWords={setNumberOfWords}
        />
      </div>

      <div className="mb-4 flex flex-col">
        <h2 className="mb-4 leading-tight flex flex-col">
          <span className="text-base font-semibold text-gray-700">
            <T id="derivation" />{' '}
            <span className="text-sm font-light text-gray-600">
              <T id="optionalComment" />
            </span>
          </span>

          <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
            <T id="addDerivationPathPrompt" />
          </span>
        </h2>

        <div
          className={clsx(
            'rounded-md overflow-hidden',
            'border-2 bg-gray-100',
            'flex flex-col',
            'text-gray-700 text-sm leading-tight'
          )}
        >
          {DERIVATION_PATHS.map((dp, i, arr) => {
            const last = i === arr.length - 1;
            const selected = derivationPath.type === dp.type;
            const handleClick = () => {
              setDerivationPath(dp);
            };

            return (
              <button
                key={dp.type}
                type="button"
                className={clsx(
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
                {...setTestID(
                  dp.type === 'default'
                    ? ImportAccountSelectors.defaultAccountButton
                    : ImportAccountSelectors.customDerivationPathButton
                )}
              >
                <T id={dp.i18nKey} />
                <div className="flex-1" />
                {selected && (
                  <OkIcon
                    className="mx-2 h-4 w-auto stroke-2"
                    style={{
                      stroke: '#777'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {derivationPath.type === 'custom' && (
        <FormField
          ref={register({
            validate: validateDerivationPath
          })}
          name="customDerivationPath"
          id="importacc-cdp"
          label={t('customDerivationPath')}
          placeholder={t('derivationPathExample2')}
          errorCaption={errors.customDerivationPath?.message}
          containerClassName="mb-6"
          testID={ImportAccountSelectors.customDerivationPathInput}
        />
      )}

      <FormField
        ref={register}
        name="password"
        type="password"
        id="importfundacc-password"
        label={
          <>
            <T id="password" />{' '}
            <span className="text-sm font-light text-gray-600">
              <T id="optionalComment" />
            </span>
          </>
        }
        labelDescription={t('passwordInputDescription')}
        placeholder="*********"
        errorCaption={errors.password?.message}
        containerClassName="mb-6"
        testID={ImportAccountSelectors.mnemonicPasswordInput}
      />

      <FormSubmitButton
        loading={formState.isSubmitting}
        className="mt-8"
        testID={ImportAccountSelectors.mnemonicImportButton}
      >
        <T id="importAccount" />
      </FormSubmitButton>
    </form>
  );
};
