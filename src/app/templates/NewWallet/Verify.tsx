import React, { FC, memo, useCallback, useMemo, useState } from "react";

import classNames from "clsx";
import { useForm } from "react-hook-form";

import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import { T } from "lib/i18n/react";
import { useTempleClient } from "lib/temple/front";

type VerifyProps = {
  data: {
    mnemonic: string;
    password: string;
  };
};

const WORDS_TO_FILL = 2;

const Verify: FC<VerifyProps> = ({ data }) => {
  const { registerWallet, setSeedRevealed, setOnboardingCompleted } = useTempleClient();

  const words = useMemo(() => data.mnemonic.split(" "), [data.mnemonic]);
  const indexesToFill = useMemo(() => {
    const indexes: number[] = [];
    for (let i = 0; i < WORDS_TO_FILL; i++) {
      while (true) {
        const index = getRandomInt(0, words.length - 1);
        const twoNearIndexes = getTwoNearIndexes(index, words.length);
        if ([index, ...twoNearIndexes].every((ni) => !indexes.includes(ni))) {
          indexes.push(index);
          break;
        }
      }
    }
    return sortNumbers(indexes);
  }, [words]);

  const [filledIndexes, setFilledIndexes] = useState<number[]>([]);

  const handleFill = useCallback(
    (index: number, filled: boolean) => {
      setFilledIndexes((fi) => {
        if (filled) {
          return fi.includes(index) ? fi : [...fi, index];
        } else {
          return fi.filter((i) => i !== index);
        }
      });
    },
    [setFilledIndexes]
  );

  const filled = useMemo(
    () => indexesToFill.every((i) => filledIndexes.includes(i)),
    [indexesToFill, filledIndexes]
  );

  const { handleSubmit, formState } = useForm();
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback(async () => {
    if (submitting || !filled) return;

    try {
      await registerWallet(data.password, data.mnemonic);
      setSeedRevealed(true);
      setOnboardingCompleted(false);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }

      alert(err.message);
    }
  }, [
    filled,
    submitting,
    registerWallet,
    setSeedRevealed,
    setOnboardingCompleted,
    data.password,
    data.mnemonic,
  ]);

  return (
    <div className="w-full max-w-md mx-auto my-8">
      <form className="w-full mt-8" onSubmit={handleSubmit(onSubmit)}>
        <h3
          className={classNames(
            "mt-2 mb-8",
            "text-gray-600 text-xl font-light",
            "text-center"
          )}
        >
          <T id="verifySeedPhraseDescription" />
        </h3>

        <div className="mb-8 flex flex-col">
          {indexesToFill.map((indexToFill, i) => (
            <WordsRow
              key={i}
              allWords={words}
              indexToFill={indexToFill}
              onFill={(filled) => handleFill(indexToFill, filled)}
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
  const nearIndexes = useMemo(
    () => getTwoNearIndexes(indexToFill, allWords.length),
    [indexToFill, allWords.length]
  );
  const indexes = useMemo(
    () => sortNumbers([indexToFill, ...nearIndexes]),
    [indexToFill, nearIndexes]
  );
  const [fillValue, setFillValue] = useState("");

  const handleChange = useCallback(
    (evt) => {
      const { value } = evt.target;
      setFillValue(value);
      onFill(value === allWords[indexToFill]);
    },
    [setFillValue, onFill, allWords, indexToFill]
  );

  return (
    <div className={classNames("mb-6", "-mx-2", "flex items-stretch")}>
      {indexes.map((i) => {
        const toFill = i === indexToFill;

        return (
          <div key={i} className="p-2">
            <FormField
              label={<T id="word" substitutions={i + 1} />}
              {...(toFill
                ? {
                    value: fillValue,
                    onChange: handleChange,
                  }
                : {
                    disabled: true,
                    defaultValue: allWords[i],
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

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sortNumbers(arr: number[]) {
  return arr.sort((a, b) => a - b);
}
