import React, { memo, ReactNode, useCallback, useState } from 'react';

import { startCase } from 'lodash';
import { useForm } from 'react-hook-form';

import { FormField } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { formatMnemonic } from 'app/defaults';
import { AccountsModalSelectors } from 'app/templates/AccountsModalContent/selectors';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { isSeedPhraseFilled, SeedPhraseInput } from 'app/templates/SeedPhraseInput';
import { useFormAnalytics } from 'lib/analytics';
import { TzktAccountType } from 'lib/apis/tzkt';
import { getAccountStatsFromTzkt } from 'lib/apis/tzkt/api';
import {
  DEFAULT_EVM_DERIVATION_PATH,
  DEFAULT_SEED_PHRASE_WORDS_AMOUNT,
  DEFAULT_TEZOS_DERIVATION_PATH
} from 'lib/constants';
import { t, T } from 'lib/i18n';
import {
  isEvmDerivationPath,
  mnemonicToPrivateKey,
  privateKeyToEvmAccountCreds,
  privateKeyToTezosAccountCreds
} from 'lib/temple/accounts-helpers';
import { useTempleClient, validateDerivationPath } from 'lib/temple/front';
import { TempleTezosChainId } from 'lib/temple/types';
import { isValidTezosImplicitAddress } from 'lib/tezos';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { TempleChainKind } from 'temple/types';

import { ImportAccountFormType, ImportAccountSelectors } from '../selectors';
import { ImportAccountFormProps } from '../types';

interface RestMnemonicFormData {
  derivationPath: string;
  accountAddress: string;
}

interface ActionBase {
  type: 'import-mnemonic-account' | 'import-wallet' | 'import-legacy-account';
  newActualAccountAddress: string;
}

interface ImportWalletAction extends ActionBase {
  type: 'import-wallet';
}

interface ImportMnemonicAccountAction extends ActionBase {
  type: 'import-mnemonic-account';
}

interface ImportLegacyAccountAction extends ActionBase {
  type: 'import-legacy-account';
  privateKey: string;
}

type Action = ImportWalletAction | ImportMnemonicAccountAction | ImportLegacyAccountAction;

const defaultValues = {
  derivationPath: '',
  accountAddress: ''
};

const validateTezosAddress = (value: string) => {
  return !value || isValidTezosImplicitAddress(value) || t('invalidAddress');
};

export const MnemonicForm = memo<ImportAccountFormProps>(({ onSuccess }) => {
  const { createOrImportWallet, importMnemonicAccount, importAccount } = useTempleClient();
  const formAnalytics = useFormAnalytics(ImportAccountFormType.Mnemonic);

  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedError, setSeedError] = useState('');
  const [error, setError] = useState<ReactNode>(null);
  const {
    register,
    handleSubmit,
    formState,
    reset,
    setError: setFormError
  } = useForm<RestMnemonicFormData>({ defaultValues });
  const { errors, isSubmitting, submitCount } = formState;

  const [numberOfWords, setNumberOfWords] = useState(DEFAULT_SEED_PHRASE_WORDS_AMOUNT);

  const onSubmit = useCallback(
    async ({ derivationPath, accountAddress: expectedAccountAddress }: RestMnemonicFormData) => {
      if (isSubmitting) {
        return;
      }

      const seedIsInvalid = seedError || !isSeedPhraseFilled(seedPhrase);

      if (seedIsInvalid && seedError === '') {
        setSeedError(t('mnemonicWordsAmountConstraint', [String(numberOfWords)]));
      }

      if (seedIsInvalid) {
        return;
      }

      formAnalytics.trackSubmit();

      try {
        let action: Action;
        if (derivationPath && (isEvmDerivationPath(derivationPath) || !expectedAccountAddress)) {
          const { privateKey } = mnemonicToPrivateKey(seedPhrase, msg => new Error(msg), undefined, derivationPath);
          const { address: newActualAccountAddress } = isEvmDerivationPath(derivationPath)
            ? privateKeyToEvmAccountCreds(privateKey)
            : await privateKeyToTezosAccountCreds(privateKey);
          action = {
            type: 'import-mnemonic-account',
            newActualAccountAddress
          };
        } else {
          const { privateKey: legacyPrivateKey } = mnemonicToPrivateKey(seedPhrase, msg => new Error(msg));
          const { privateKey: newPrivateKey } = mnemonicToPrivateKey(
            seedPhrase,
            msg => new Error(msg),
            undefined,
            derivationPath || DEFAULT_TEZOS_DERIVATION_PATH
          );
          const [{ address: legacyAddress }, { address: newAddress }] = await Promise.all(
            [legacyPrivateKey, newPrivateKey].map(privateKey => privateKeyToTezosAccountCreds(privateKey))
          );
          let shouldUseLegacyAccount = false;

          if ([legacyAddress, newAddress].includes(expectedAccountAddress)) {
            shouldUseLegacyAccount = legacyAddress === expectedAccountAddress;
          } else {
            try {
              const [legacyAccountIsUsed, newAccountIsUsed] = await Promise.all(
                [legacyAddress, newAddress].map(address =>
                  getAccountStatsFromTzkt(address, TempleTezosChainId.Mainnet).then(
                    stats =>
                      Boolean(stats) &&
                      (stats.type === TzktAccountType.User ||
                        Boolean(stats.balance) ||
                        (stats.type !== TzktAccountType.Empty && Boolean(stats.activeTokensCount)))
                  )
                )
              );
              shouldUseLegacyAccount = legacyAccountIsUsed && !newAccountIsUsed;
            } catch (e) {
              console.error(e);
            }
          }

          if (shouldUseLegacyAccount) {
            action = {
              type: 'import-legacy-account',
              newActualAccountAddress: legacyAddress,
              privateKey: legacyPrivateKey
            };
          } else if (derivationPath) {
            const { privateKey } = mnemonicToPrivateKey(seedPhrase, msg => new Error(msg), undefined, derivationPath);
            const { address: newAddress } = privateKeyToEvmAccountCreds(privateKey);
            action = {
              type: 'import-mnemonic-account',
              newActualAccountAddress: newAddress
            };
          } else {
            action = {
              type: 'import-wallet',
              newActualAccountAddress: newAddress
            };
          }
        }

        if (expectedAccountAddress && expectedAccountAddress !== action.newActualAccountAddress) {
          setFormError('accountAddress', { message: t('accountAddressDoesNotMatch') });
          return;
        }

        switch (action.type) {
          case 'import-wallet':
            await createOrImportWallet(formatMnemonic(seedPhrase));
            break;
          case 'import-mnemonic-account':
            await importMnemonicAccount(formatMnemonic(seedPhrase), undefined, derivationPath);
            break;
          case 'import-legacy-account':
            await importAccount(TempleChainKind.Tezos, action.privateKey);
            break;
        }

        formAnalytics.trackSubmitSuccess();
        onSuccess();
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        console.error(err);

        setError(err.message);
      }
    },
    [
      createOrImportWallet,
      formAnalytics,
      importMnemonicAccount,
      importAccount,
      isSubmitting,
      numberOfWords,
      onSuccess,
      seedError,
      seedPhrase,
      setSeedError,
      setFormError
    ]
  );

  const updateSeedError = useCallback((error: string) => {
    setSeedError(error);
    setError(null);
  }, []);

  return (
    <form className="flex-1 flex flex-col max-h-full" onSubmit={handleSubmit(onSubmit)}>
      <PageModalScrollViewWithActions
        className="py-4"
        bottomEdgeThreshold={16}
        initialBottomEdgeVisible={false}
        actionsBoxProps={{
          children: (
            <StyledButton
              size="L"
              color="primary"
              disabled={shouldDisableSubmitButton({
                errors,
                formState,
                otherErrors: [seedError, errors.accountAddress?.message]
              })}
              type="submit"
              testID={AccountsModalSelectors.nextButton}
            >
              <T id="next" />
            </StyledButton>
          )
        }}
      >
        <SeedPhraseInput
          submitted={submitCount > 0}
          seedError={seedError || error}
          setSeedError={updateSeedError}
          onChange={setSeedPhrase}
          reset={reset}
          testID={ImportAccountSelectors.mnemonicWordInput}
          numberOfWords={numberOfWords}
          setNumberOfWords={setNumberOfWords}
        />

        <FormField
          {...register('derivationPath', {
            required: false,
            validate: validateDerivationPath
          })}
          id="derivationPath"
          labelContainerClassName="w-full flex justify-between items-center"
          label={
            <>
              {startCase(t('customDerivationPath'))}
              <span className="text-font-description font-normal text-grey-2">
                <T id="optionalComment" />
              </span>
            </>
          }
          placeholder={t('derivationPathExample2', DEFAULT_EVM_DERIVATION_PATH)}
          errorCaption={errors.derivationPath?.message}
          containerClassName="my-3"
          testID={ImportAccountSelectors.customDerivationPathInput}
          reserveSpaceForError
        />

        <FormField
          {...register('accountAddress', {
            required: false,
            validate: validateTezosAddress
          })}
          id="accountAddress"
          labelContainerClassName="w-full flex justify-between items-center"
          label={
            <>
              {t('accountAddress')}
              <span className="text-font-description font-normal text-grey-2">
                <T id="optionalTezosOnlyComment" />
              </span>
            </>
          }
          placeholder={t('accountAddressInputPlaceholder')}
          errorCaption={errors.accountAddress?.message}
          testID={ImportAccountSelectors.accountAddressInput}
        />
      </PageModalScrollViewWithActions>
    </form>
  );
});
