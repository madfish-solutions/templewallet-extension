import React, { memo, useCallback, useState } from 'react';

import { useForm } from 'react-hook-form';

import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { DEFAULT_SEED_PHRASE_WORDS_AMOUNT } from 'lib/constants';
import { t, T } from 'lib/i18n';

import { SeedPhraseInput } from '../SeedPhraseInput';

import { ImportSeedFormSelectors } from './selectors';

interface ImportSeedFormProps {
  next: SyncFn<string>;
  onCancel: EmptyFn;
}

export const ImportSeedForm = memo<ImportSeedFormProps>(({ next }) => {
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);

  const { handleSubmit, formState, reset } = useForm();
  const wasSubmitted = formState.submitCount !== 0;
  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedError, setSeedError] = useState('');
  const [numberOfWords, setNumberOfWords] = useState(DEFAULT_SEED_PHRASE_WORDS_AMOUNT);

  const onSubmit = useCallback(() => {
    if (seedPhrase && !seedPhrase.split(' ').includes('') && !seedError) {
      next(seedPhrase);
    } else if (seedError === '') {
      setSeedError(t('mnemonicWordsAmountConstraint', [numberOfWords]) as string);
    }
  }, [seedPhrase, seedError, next, numberOfWords]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col max-h-full">
      <ScrollView className="pt-4 pb-6" bottomEdgeThreshold={24} onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <SeedPhraseInput
          isFirstAccount
          submitted={wasSubmitted}
          seedError={seedError}
          onChange={setSeedPhrase}
          setSeedError={setSeedError}
          reset={reset}
          testID={ImportSeedFormSelectors.wordInput}
          numberOfWords={numberOfWords}
          setNumberOfWords={setNumberOfWords}
        />
      </ScrollView>
      <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible}>
        <StyledButton
          disabled={Boolean(seedError) && wasSubmitted}
          type="submit"
          size="L"
          color="primary"
          testID={ImportSeedFormSelectors.nextButton}
        >
          <T id="next" />
        </StyledButton>
      </ActionsButtonsBox>
    </form>
  );
});
