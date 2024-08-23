import React, { memo, ReactNode, useCallback, useState } from 'react';

import { startCase } from 'lodash';
import { useForm } from 'react-hook-form';

import { FormField } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { formatMnemonic } from 'app/defaults';
import { AccountsModalSelectors } from 'app/templates/AppHeader/selectors';
import { isSeedPhraseFilled, SeedPhraseInput } from 'app/templates/SeedPhraseInput';
import { useFormAnalytics } from 'lib/analytics';
import { DEFAULT_SEED_PHRASE_WORDS_AMOUNT, DEFAULT_TEZOS_DERIVATION_PATH } from 'lib/constants';
import { t, T } from 'lib/i18n';
import { useTempleClient, validateDerivationPath } from 'lib/temple/front';

import { ImportAccountFormType, ImportAccountSelectors } from '../selectors';
import { ImportAccountFormProps } from '../types';

interface RestMnemonicFormData {
  derivationPath: string;
}

const defaultValues = {
  derivationPath: ''
};

export const MnemonicForm = memo<ImportAccountFormProps>(({ onSuccess, onCancel }) => {
  const { createOrImportWallet, importMnemonicAccount } = useTempleClient();
  const formAnalytics = useFormAnalytics(ImportAccountFormType.Mnemonic);

  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedError, setSeedError] = useState('');
  const [error, setError] = useState<ReactNode>(null);
  const { errors, register, handleSubmit, formState, reset } = useForm<RestMnemonicFormData>({ defaultValues });
  const { isSubmitting, submitCount } = formState;
  const wasSubmitted = submitCount > 0;

  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(false);

  const [numberOfWords, setNumberOfWords] = useState(DEFAULT_SEED_PHRASE_WORDS_AMOUNT);

  const onSubmit = useCallback(
    async (values: RestMnemonicFormData) => {
      if (isSubmitting) {
        return;
      }

      if (!seedError && isSeedPhraseFilled(seedPhrase)) {
        formAnalytics.trackSubmit();

        try {
          if (values.derivationPath) {
            await importMnemonicAccount(formatMnemonic(seedPhrase), undefined, values.derivationPath);
          } else {
            await createOrImportWallet(formatMnemonic(seedPhrase));
          }
          formAnalytics.trackSubmitSuccess();
          onSuccess();
        } catch (err: any) {
          formAnalytics.trackSubmitFail();

          console.error(err);

          setError(err.message);
        }
      } else if (seedError === '') {
        setSeedError(t('mnemonicWordsAmountConstraint', [String(numberOfWords)]));
      }
    },
    [
      createOrImportWallet,
      formAnalytics,
      importMnemonicAccount,
      isSubmitting,
      numberOfWords,
      onSuccess,
      seedError,
      seedPhrase,
      setSeedError
    ]
  );

  const updateSeedError = useCallback((error: string) => {
    setSeedError(error);
    setError(null);
  }, []);

  return (
    <form className="flex-1 flex flex-col max-h-full" onSubmit={handleSubmit(onSubmit)}>
      <ScrollView className="py-4" bottomEdgeThreshold={16} onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <SeedPhraseInput
          submitted={wasSubmitted}
          seedError={seedError || error}
          setSeedError={updateSeedError}
          onChange={setSeedPhrase}
          reset={reset}
          testID={ImportAccountSelectors.mnemonicWordInput}
          numberOfWords={numberOfWords}
          setNumberOfWords={setNumberOfWords}
        />

        <FormField
          ref={register({
            required: false,
            validate: validateDerivationPath
          })}
          name="derivationPath"
          id="derivationPath"
          label={startCase(t('customDerivationPath'))}
          placeholder={DEFAULT_TEZOS_DERIVATION_PATH}
          errorCaption={errors.derivationPath?.message}
          containerClassName="mt-8"
          testID={ImportAccountSelectors.customDerivationPathInput}
        />
      </ScrollView>

      <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible} flexDirection="row" className="gap-2.5">
        <StyledButton
          className="w-full"
          size="L"
          color="primary-low"
          onClick={onCancel}
          testID={AccountsModalSelectors.cancelButton}
        >
          <T id="cancel" />
        </StyledButton>
        <StyledButton
          className="w-full"
          size="L"
          color="primary"
          disabled={isSubmitting || ((Object.keys(errors).length > 0 || Boolean(seedError)) && wasSubmitted)}
          type="submit"
          testID={AccountsModalSelectors.nextButton}
        >
          <T id="next" />
        </StyledButton>
      </ActionsButtonsBox>
    </form>
  );
});
