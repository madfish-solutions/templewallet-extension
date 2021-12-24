import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { T } from 'lib/i18n/react';
import { useTempleClient } from 'lib/temple/front';

type VerifyProps = {
  data: {
    mnemonic: string;
    password: string;
  };
};

const WORDS_TO_FILL = 2;

const range = (size: number) => {
  return [...Array(size).keys()].map(i => i + 0);
};

const shuffle = (array: any[]) => {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  const result = [...array];
  while (++index < length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }
  return result;
};

const Verify: FC<VerifyProps> = ({ data }) => {
  const { registerWallet } = useTempleClient();

  const words = useMemo(() => data.mnemonic.split(' '), [data.mnemonic]);
  const wordsToCheckPositions = useMemo(() => {
    const shuffledPositions = shuffle(range(words.length));
    const selectedPositions: number[] = [];
    for (let i = 0; i < words.length; i++) {
      const newPosition = shuffledPositions[i];
      if (
        selectedPositions.every(selectedPosition => {
          const distance = Math.abs(selectedPosition - newPosition);
          if ([selectedPosition, newPosition].some(position => [0, words.length - 1].some(edge => edge === position))) {
            return distance > 2;
          }

          return distance > 1;
        })
      ) {
        selectedPositions.push(newPosition);
      }
      if (selectedPositions.length === WORDS_TO_FILL) {
        break;
      }
    }

    return selectedPositions.sort((a, b) => a - b);
  }, [words]);

  const [filledIndexes, setFilledIndexes] = useState<number[]>([]);

  const handleFill = useCallback(
    (index: number, isPresent: boolean) => {
      setFilledIndexes(fi => {
        if (isPresent) {
          return fi.includes(index) ? fi : [...fi, index];
        } else {
          return fi.filter(i => i !== index);
        }
      });
    },
    [setFilledIndexes]
  );

  const filled = useMemo(
    () => wordsToCheckPositions.every(i => filledIndexes.includes(i)),
    [wordsToCheckPositions, filledIndexes]
  );

  const { handleSubmit, formState } = useForm();
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback(async () => {
    if (submitting || !filled) return;

    try {
      await registerWallet(data.password, data.mnemonic);
    } catch (err: any) {
      console.error(err);

      alert(err.message);
    }
  }, [filled, submitting, registerWallet, data.password, data.mnemonic]);

  return (
    <div className="w-full max-w-md mx-auto my-8">
      <form className="w-full mt-8" onSubmit={handleSubmit(onSubmit)}>
        <h3 className={classNames('mt-2 mb-8', 'text-gray-600 text-xl font-light', 'text-center')}>
          <T id="verifySeedPhraseDescription" />
        </h3>

        <div className="mb-8 flex flex-col">
          {wordsToCheckPositions.map((indexToFill, i) => (
            <WordsRow
              key={i}
              allWords={words}
              indexToFill={indexToFill}
              onFill={isPresent => handleFill(indexToFill, isPresent)}
            />
          ))}
        </div>

        <FormSubmitButton loading={submitting} disabled={!filled}>
          <T id="finish" />
        </FormSubmitButton>
      </form>
    </div>
  );
};

export default Verify;

type WordsRowProps = {
  allWords: string[];
  indexToFill: number;
  onFill: (filled: boolean) => void;
};

const WordsRow = memo<WordsRowProps>(({ allWords, indexToFill, onFill }) => {
  const nearIndexes = useMemo(() => getTwoNearIndexes(indexToFill, allWords.length), [indexToFill, allWords.length]);
  const indexes = useMemo(() => sortNumbers([indexToFill, ...nearIndexes]), [indexToFill, nearIndexes]);
  const [fillValue, setFillValue] = useState('');

  const handleChange = useCallback(
    evt => {
      const { value } = evt.target;
      setFillValue(value);
      onFill(value === allWords[indexToFill]);
    },
    [setFillValue, onFill, allWords, indexToFill]
  );

  return (
    <div className={classNames('mb-6', '-mx-2', 'flex items-stretch')}>
      {indexes.map(i => {
        const toFill = i === indexToFill;

        return (
          <div key={i} className="p-2">
            <FormField
              label={<T id="word" substitutions={i + 1} />}
              {...(toFill
                ? {
                    value: fillValue,
                    onChange: handleChange
                  }
                : {
                    disabled: true,
                    defaultValue: allWords[i]
                  })}
            />
          </div>
        );
      })}
    </div>
  );
});

function getTwoNearIndexes(index: number, limit: number) {
  switch (true) {
    case index === 0:
      return [1, 2];

    case index === limit - 1:
      return [limit - 2, limit - 3];

    default:
      return [index - 1, index + 1];
  }
}

function sortNumbers(arr: number[]) {
  return arr.sort((a, b) => a - b);
}
