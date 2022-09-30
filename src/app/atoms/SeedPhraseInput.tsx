import React, { FC, useCallback, useMemo, useState } from 'react';

import { validateMnemonic } from 'bip39';
import classNames from 'clsx';

import { T, t } from 'lib/i18n/react';
import { clearClipboard } from 'lib/ui/util';

import { formatMnemonic } from '../defaults';
import { useAppEnv } from '../env';
import { SeedLengthSelect } from './SeedLengthSelect';
import { SeedWordInput } from './SeedWordInput';

interface SeedPhraseInputProps {
  isFirstAccount?: boolean;
  submitted: boolean;
  seedError: string;
  label: string;
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
  label,
  labelWarning,
  onChange,
  setSeedError,
  reset
}) => {
  const { popup } = useAppEnv();

  const [pasteFailed, setPasteFailed] = useState(false);
  const [draftSeed, setDraftSeed] = useState(new Array(defaultNumberOfWords).fill(''));
  const [showSeed, setShowSeed] = useState(true);
  const [numberOfWords, setNumberOfWords] = useState(defaultNumberOfWords);

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
    (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
      if (pasteFailed) {
        setPasteFailed(false);
      }
      const newSeed = draftSeed.slice();
      newSeed[index] = event.target.value.trim();
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
        setShowSeed(true);
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
      setShowSeed(false);
      onSeedChange(newDraftSeed);
      clearClipboard();
    },
    [numberOfWords, onSeedChange, pasteFailed, setPasteFailed]
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
      <div className={classNames('flex justify-between', 'mb-6')}>
        <h1
          className={classNames(
            'font-inter',
            'flex self-center',
            'text-gray-800',
            !isFirstAccount && 'font-semibold text-gray-500'
          )}
          style={{ fontSize: isFirstAccount ? 23 : 16 }}
        >
          {label}
        </h1>
        <div className={classNames('relative w-64 h-10')} style={{ width: popup ? 220 : undefined }}>
          <SeedLengthSelect
            options={numberOfWordsOptions}
            currentOption={draftSeed.length.toString()}
            defaultOption={`${numberOfWords}`}
            setShowSeed={setShowSeed}
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
      {!isFirstAccount && <div className="text-xs font-medium text-red-600 text-center">{labelWarning}</div>}
      {!isFirstAccount && (
        <div className="text-xs font-medium text-red-600 text-center mb-6">
          <T id="seedPhraseAttention" />
        </div>
      )}
      <div
        className={classNames('w-full text-center', 'pb-2 mb-6', 'text-gray-700', 'border-b-2')}
        style={{ borderBottomWidth: 1 }}
      >
        <p>{t('seedPhraseTip')}</p>
      </div>
      <div className={classNames('grid', isFirstAccount ? 'grid-cols-3 gap-4' : 'grid-cols-2 gap-2')}>
        {[...Array(numberOfWords).keys()].map(index => {
          const key = `import-seed-word-${index}`;

          return (
            <SeedWordInput
              key={key}
              id={index}
              isFirstAccount={isFirstAccount}
              submitted={submitted}
              showSeed={showSeed}
              setShowSeed={setShowSeed}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                e.preventDefault();
                onSeedWordChange(index, e);
              }}
              value={draftSeed[index]}
              onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                const newSeed = e.clipboardData.getData('text');

                if (newSeed.trim().match(/\s/u)) {
                  e.preventDefault();
                  onSeedPaste(newSeed);
                }
              }}
            />
          );
        })}
      </div>
      {submitted && seedError ? <div className="text-xs text-red-700 mt-4">{seedError}</div> : null}
      {pasteFailed ? (
        <T id="seedPasteFailedTooManyWords">{message => <div className="text-xs text-red-700 mt-4">{message}</div>}</T>
      ) : null}
    </div>
  );
};
