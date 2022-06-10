import React, { FC, useCallback, useState } from 'react';

import { useForm } from 'react-hook-form';

import { T, t } from '../../../../lib/i18n/react';
import FormSubmitButton from '../../../atoms/FormSubmitButton';
import { SeedPhraseInput } from '../../../atoms/SeedPhraseInput';

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
        onChange={setSeedPhrase}
        seedPhraseText={t('seedPhrase')}
        seedError={formState.submitCount !== 0 ? seedError : ''}
        setSeedError={setSeedError}
        reset={reset}
      />
      <FormSubmitButton style={{ display: 'block', width: 384, margin: '40px auto', fontSize: 14, fontWeight: 500 }}>
        <T id="next" />
      </FormSubmitButton>
    </form>
  );
};
