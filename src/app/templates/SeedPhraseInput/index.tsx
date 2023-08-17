import React, { FC, useCallback, useMemo, useState } from 'react';

import { validateMnemonic } from 'bip39';
import classNames from 'clsx';

import { formatMnemonic } from 'app/defaults';
import { useAppEnv } from 'app/env';
import { TestIDProperty } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { clearClipboard } from 'lib/ui/util';

import { SeedLengthSelect } from './SeedLengthSelect';
import { SeedWordInput, SeedWordInputProps } from './SeedWordInput';
import { useRevealRef } from './use-reveal-ref.hook';

interface SeedPhraseInputProps extends TestIDProperty {
  isFirstAccount?: boolean;
  submitted: boolean;
  seedError: string;
  labelWarning?: string;
  onChange: (seed: string) => void;
  setSeedError: (e: string) => void;
  reset: () => void;
}

const defaultNumberOfWords = 12;

export const SeedPhraseInput: FC<SeedPhraseInputProps> = ({
  isFirstAccount,
  submitted,
  seedError,
  labelWarning,
  onChange,
  setSeedError,
  reset,
  testID
}) => {
  const { popup } = useAppEnv();

  const [pasteFailed, setPasteFailed] = useState(false);
  const [draftSeed, setDraftSeed] = useState(new Array<string>(defaultNumberOfWords).fill(''));
  const [numberOfWords, setNumberOfWords] = useState(defaultNumberOfWords);

  const { getRevealRef, onReveal, resetRevealRef } = useRevealRef();

  const onSeedChange = useCallback(
    (newDraftSeed: Array<string>) => {
      let newSeedError = '';
      const joinedDraftSeed = newDraftSeed.join(' ');

      if (newDraftSeed.some(word => word !== '')) {
        if (newDraftSeed.some(word => word === '')) {
          newSeedError = t('mnemonicWordsAmountConstraint');
        } else if (!validateMnemonic(formatMnemonic(joinedDraftSeed))) {
          newSeedError = t('justValidPreGeneratedMnemonic');
        }
      }

      setDraftSeed(newDraftSeed);
      setSeedError(newSeedError);
      onChange(newSeedError ? '' : joinedDraftSeed);
    },
    [setDraftSeed, setSeedError, onChange]
  );

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
      clearClipboard();
    },
    [numberOfWords, onSeedChange, pasteFailed, setPasteFailed, resetRevealRef]
  );

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

  const numberOfWordsOptions = useMemo(() => {
    const result = [];
    for (let i = 12; i <= 24; i += 3) {
      result.push(`${i}`);
    }
    return result;
  }, []);

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1
          className={classNames(
            'font-inter flex self-center text-gray-800',
            isFirstAccount ? 'text-2xl' : 'text-base font-semibold text-gray-500'
          )}
        >
          <T id="seedPhrase" />
        </h1>

        <div className="relative w-64 h-10" style={{ width: popup ? 220 : undefined }}>
          <SeedLengthSelect
            options={numberOfWordsOptions}
            currentOption={draftSeed.length.toString()}
            defaultOption={`${numberOfWords}`}
            onChange={newSelectedOption => {
              const newNumberOfWords = parseInt(newSelectedOption, 10);
              if (Number.isNaN(newNumberOfWords)) {
                throw new Error('Unable to parse option as integer');
              }

              const newDraftSeed = new Array(newNumberOfWords).fill('');
              setNumberOfWords(newNumberOfWords);
              onSeedChange(newDraftSeed);
              reset();
            }}
          />
        </div>
      </div>

      {labelWarning && (
        <div className="text-xs font-medium text-red-600 text-center whitespace-pre-line mb-6">{labelWarning}</div>
      )}

      <div className="w-full text-center pb-2 mb-6 text-gray-700 border-b-2" style={{ borderBottomWidth: 1 }}>
        <p>{t('seedPhraseTip')}</p>
      </div>

      <div className={classNames('grid', isFirstAccount ? 'grid-cols-3 gap-4' : 'grid-cols-2 gap-2')}>
        {[...Array(numberOfWords).keys()].map(index => {
          const key = `import-seed-word-${index}`;

          return (
            <SeedWordInput
              key={key}
              id={index}
              submitted={submitted}
              onChange={event => {
                event.preventDefault();
                onSeedWordChange(index, event.target.value);
              }}
              revealRef={getRevealRef(index)}
              onReveal={() => onReveal(index)}
              value={draftSeed[index]}
              testID={testID}
              onPaste={onSeedWordPaste}
            />
          );
        })}
      </div>

      {submitted && seedError ? <div className="text-xs text-red-700 mt-4">{seedError}</div> : null}

      {pasteFailed ? (
        <div className="text-xs text-red-700 mt-4">
          <T id="seedPasteFailedTooManyWords" />
        </div>
      ) : null}
    </div>
  );
};

export const isSeedPhraseFilled = (seedPhrase: string) => seedPhrase && !seedPhrase.split(' ').includes('');
