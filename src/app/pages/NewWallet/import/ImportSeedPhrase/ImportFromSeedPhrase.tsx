import React, { FC, useCallback, useState } from 'react';

import { useForm } from 'react-hook-form';

import { FormSubmitButton } from 'app/atoms';
import { SeedPhraseInput } from 'app/templates/SeedPhraseInput';
import { T, t } from 'lib/i18n';

import { ImportFromSeedPhraseSelectors } from './ImportFromSeedPhrase.selectors';

interface ImportFromSeedPhraseProps {
  seedPhrase: string;
  setSeedPhrase: (seed: string) => void;
  setIsSeedEntered: (value: boolean) => void;
}

export const ImportFromSeedPhrase: FC<ImportFromSeedPhraseProps> = ({
  seedPhrase,
  setSeedPhrase,
  setIsSeedEntered
}) => {
  const { handleSubmit, formState, reset } = useForm();
  const [seedError, setSeedError] = useState('');

  const onSubmit = useCallback(() => {
    if (seedPhrase && !seedPhrase.split(' ').includes('') && !seedError) {
      setIsSeedEntered(true);
    } else if (seedError === '') {
      setSeedError(t('mnemonicWordsAmountConstraint'));
    }
  }, [seedPhrase, seedError, setIsSeedEntered]);

  return (
    <form className="w-full mx-auto my-8 px-12 pb-8" onSubmit={handleSubmit(onSubmit)}>
      <SeedPhraseInput
        isFirstAccount
        submitted={formState.submitCount !== 0}
        seedError={seedError}
        onChange={setSeedPhrase}
        setSeedError={setSeedError}
        reset={reset}
        testID={ImportFromSeedPhraseSelectors.wordInput}
      />

      <FormSubmitButton
        className="mt-20 mx-auto block text-sm font-medium justify-center"
        style={{ width: 384 }}
        testID={ImportFromSeedPhraseSelectors.nextButton}
      >
        <T id="next" />
      </FormSubmitButton>
    </form>
  );
};
