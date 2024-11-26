import React, { FC, useCallback, useRef, useState } from 'react';

import { validateMnemonic } from 'bip39';
import clsx from 'clsx';

import { FormFieldElement } from 'app/atoms/FormField';
import { TextButton } from 'app/atoms/TextButton';
import { formatMnemonic } from 'app/defaults';
import { ReactComponent as PasteFillIcon } from 'app/icons/base/paste_fill.svg';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { ImportAccountSelectors } from 'app/templates/ImportAccountModal/selectors';
import { setTestID, TestIDProperty } from 'lib/analytics';
import { DEFAULT_SEED_PHRASE_WORDS_AMOUNT } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { clearClipboard, readClipboard } from 'lib/ui/utils';

import { SeedLengthSelect } from './SeedLengthSelect/SeedLengthSelect';
import { SeedWordInput, SeedWordInputProps } from './SeedWordInput';
import { useRevealRef } from './use-reveal-ref.hook';

interface SeedPhraseInputProps extends TestIDProperty {
  isFirstAccount?: boolean;
  submitted: boolean;
  seedError: string | React.ReactNode;
  labelWarning?: string;
  onChange: (seed: string) => void;
  setSeedError: (e: string) => void;
  reset: () => void;
  numberOfWords: number;
  setNumberOfWords: (n: number) => void;
}

const numberOfWordsOptions = ['12', '15', '18', '21', '24'];

export const SeedPhraseInput: FC<SeedPhraseInputProps> = ({
  submitted,
  seedError,
  labelWarning,
  onChange,
  setSeedError,
  reset,
  numberOfWords,
  setNumberOfWords,
  testID
}) => {
  const inputsRef = useRef<Array<FormFieldElement | null>>([]);

  const [pasteFailed, setPasteFailed] = useState(false);
  const [draftSeed, setDraftSeed] = useState(new Array<string>(DEFAULT_SEED_PHRASE_WORDS_AMOUNT).fill(''));
  const [wordSpellingErrorsCount, setWordSpellingErrorsCount] = useState(0);

  const { getRevealRef, onReveal, resetRevealRef } = useRevealRef();

  const onSeedChange = useCallback(
    (newDraftSeed: string[]) => {
      setDraftSeed(newDraftSeed);

      const joinedDraftSeed = newDraftSeed.join(' ');
      let newSeedError = '';

      if (!newDraftSeed.some(Boolean)) {
        onChange(joinedDraftSeed);
        return;
      }

      if (newDraftSeed.some(word => word === '')) {
        newSeedError = t('mnemonicWordsAmountConstraint', [String(numberOfWords)]);
      }

      if (!validateMnemonic(formatMnemonic(joinedDraftSeed))) {
        newSeedError = t('justValidPreGeneratedMnemonic');
      }

      setSeedError(newSeedError);
      onChange(newSeedError ? '' : joinedDraftSeed);
    },
    [setDraftSeed, setSeedError, onChange, numberOfWords]
  );

  const clearDraftSeed = useCallback(() => {
    setPasteFailed(false);
    setDraftSeed(new Array(numberOfWords).fill(''));
    setSeedError('');
    setWordSpellingErrorsCount(0);
    onChange('');
  }, [numberOfWords, onChange, setSeedError]);

  const onSeedWordChange = useCallback(
    (index: number, value: string) => {
      if (pasteFailed) {
        setPasteFailed(false);
      }
      const newSeed = draftSeed.slice();
      newSeed[index] = value.trim();
      onSeedChange(newSeed);
    },
    [draftSeed, onSeedChange, pasteFailed]
  );

  const onSeedPaste = useCallback(
    (rawSeed: string) => {
      const parsedSeed = formatMnemonic(rawSeed);
      let newDraftSeed = parsedSeed.split(' ');

      if (newDraftSeed.length > 24) {
        setPasteFailed(true);
        return;
      } else if (pasteFailed) {
        setPasteFailed(false);
      }

      let newNumberOfWords = numberOfWords;
      if (newDraftSeed.length !== numberOfWords) {
        if (newDraftSeed.length < 12) {
          newNumberOfWords = 12;
        } else if (newDraftSeed.length % 3 === 0) {
          newNumberOfWords = newDraftSeed.length;
        } else {
          newNumberOfWords = newDraftSeed.length + (3 - (newDraftSeed.length % 3));
        }
        setNumberOfWords(newNumberOfWords);
      }

      if (newDraftSeed.length < newNumberOfWords) {
        newDraftSeed = newDraftSeed.concat(new Array(newNumberOfWords - newDraftSeed.length).fill(''));
      }

      resetRevealRef();
      onSeedChange(newDraftSeed);

      return clearClipboard();
    },
    [numberOfWords, onSeedChange, pasteFailed, setPasteFailed, resetRevealRef, setNumberOfWords]
  );

  const pasteMnemonic = useCallback(async () => {
    try {
      const value = await readClipboard();
      await onSeedPaste(value);
    } catch (error) {
      console.error(error);
    }
  }, [onSeedPaste]);

  const onSeedWordPaste = useCallback<Defined<SeedWordInputProps['onPaste']>>(
    event => {
      const newSeed = event.clipboardData.getData('text');

      if (newSeed.trim().match(/\s/u)) {
        event.preventDefault();
        onSeedPaste(newSeed);
      }
    },
    [onSeedPaste]
  );

  const handleSeedLengthChange = useCallback(
    (newOption: string) => {
      const newNumberOfWords = parseInt(newOption, 10);
      if (Number.isNaN(newNumberOfWords)) {
        throw new Error('Unable to parse option as integer');
      }

      const newDraftSeed = new Array(newNumberOfWords).fill('');
      setNumberOfWords(newNumberOfWords);
      onSeedChange(newDraftSeed);
      reset();
      setSeedError('');
      setWordSpellingErrorsCount(0);
    },
    [onSeedChange, reset, setNumberOfWords, setSeedError]
  );

  return (
    <div>
      <div className="relative flex justify-between items-center mb-2">
        <span className="text-font-description-bold">
          <T id="seedPhraseLength" />
        </span>

        <SeedLengthSelect
          options={numberOfWordsOptions}
          currentOption={draftSeed.length.toString()}
          defaultOption={String(numberOfWords)}
          onChange={handleSeedLengthChange}
        />
      </div>

      {labelWarning && (
        <div className="text-font-description-bold text-error text-center whitespace-pre-line mb-2">{labelWarning}</div>
      )}

      <div
        className={clsx(
          'grid grid-cols-2 gap-2 p-1.5 rounded-lg bg-background',
          submitted && seedError ? 'border border-error' : 'border-0.5 border-grey-4'
        )}
      >
        {[...Array(numberOfWords).keys()].map(index => {
          const key = `import-seed-word-${index}`;

          const handleChange = (event: React.ChangeEvent<FormFieldElement>) => {
            event.preventDefault();
            onSeedWordChange(index, event.target.value);
          };

          return (
            <SeedWordInput
              key={key}
              id={index}
              inputsRef={inputsRef}
              numberOfWords={numberOfWords}
              submitted={submitted}
              onChange={handleChange}
              revealRef={getRevealRef(index)}
              onReveal={() => onReveal(index)}
              value={draftSeed[index]}
              testID={testID}
              onPaste={onSeedWordPaste}
              setWordSpellingErrorsCount={setWordSpellingErrorsCount}
              onSeedWordChange={onSeedWordChange}
            />
          );
        })}

        <div className="pt-2 pb-2.5 flex justify-center col-span-2">
          {draftSeed.every(Boolean) ? (
            <TextButton
              color="grey"
              Icon={XCircleFillIcon}
              onClick={clearDraftSeed}
              testID={ImportAccountSelectors.clearSeedPhraseButton}
            >
              <T id="clear" />
            </TextButton>
          ) : (
            <TextButton
              color="blue"
              Icon={PasteFillIcon}
              onClick={pasteMnemonic}
              testID={ImportAccountSelectors.pasteSeedPhraseButton}
            >
              <T id="paste" />
            </TextButton>
          )}
        </div>
      </div>

      <div
        className="min-h-4 mt-1 text-font-description text-error"
        {...setTestID(ImportAccountSelectors.mnemonicValidationErrorText)}
      >
        {submitted && seedError && <div>{seedError}</div>}

        {submitted && wordSpellingErrorsCount > 0 && (
          <div>
            <T id="mnemonicWordsError" />
          </div>
        )}

        {pasteFailed && (
          <div>
            <T id="seedPasteFailedTooManyWords" />
          </div>
        )}
      </div>
    </div>
  );
};

export const isSeedPhraseFilled = (seedPhrase: string) => Boolean(seedPhrase) && !seedPhrase.split(' ').includes('');
