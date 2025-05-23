import React, { memo, useCallback } from 'react';

import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import { FieldLabel } from 'app/atoms/FieldLabel';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { T } from 'lib/i18n';

import { ManualBackupModalSelectors } from '../selectors';

import { WordInput } from './word-input';
import { WordsBoxItem, WordsBoxItemData } from './words-box-item';

interface VerifySeedPhraseInputProps {
  wordsBox: WordsBoxItemData[];
  wordsIndices: number[];
  error?: string;
  value: WordsBoxItemData[];
  onChange: (newValue: WordsBoxItemData[]) => void;
}

export const VerifySeedPhraseInput = memo<VerifySeedPhraseInputProps>(
  ({ wordsBox, wordsIndices, error, value, onChange }) => {
    const activeInputIndex = value.length > 0 && value.length < wordsBox.length ? value.length : -1;

    const handleClear = useCallback(() => onChange([]), [onChange]);
    const handleWordSelect = useCallback((item: WordsBoxItemData) => onChange(value.concat(item)), [value, onChange]);

    return (
      <div className="w-full flex flex-col">
        <FieldLabel
          className="p-1 mb-2"
          label={<T id="verifySeedPhraseInputTitle" />}
          description={<T id="verifySeedPhraseInputDescription" />}
        />
        <div
          className={clsx(
            'relative grid grid-cols-2 rounded-lg p-1.5 bg-background mb-1 gap-2',
            error ? 'border border-error' : 'border-0.5 border-grey-4'
          )}
        >
          {wordsIndices.map((wordIndex, inputIndex) => (
            <WordInput
              key={wordIndex}
              wordIndex={wordIndex}
              active={activeInputIndex === inputIndex}
              value={value[inputIndex]?.word ?? ''}
            />
          ))}
          <Button className="absolute right-1.5 bottom-1.5 text-grey-3" onClick={handleClear}>
            <IconBase size={16} Icon={XCircleFillIcon} />
          </Button>
        </div>
        {error ? <span className="text-font-description text-error mb-4">{error}</span> : <div className="h-4 mb-4" />}
        <FieldLabel className="p-1 pt-0.5" label={<T id="wordsBoxLabel" />} />
        <div className="flex mt-2 gap-1">
          {wordsBox.map(item => (
            <WordsBoxItem
              key={item.index}
              data={item}
              selected={value.some(selectedItem => item.index === selectedItem.index)}
              onSelect={handleWordSelect}
              testID={ManualBackupModalSelectors.seedWordButton}
            />
          ))}
        </div>
      </div>
    );
  }
);
