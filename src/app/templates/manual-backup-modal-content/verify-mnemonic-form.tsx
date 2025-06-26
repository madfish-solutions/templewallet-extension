import React, { memo, useCallback, useMemo, useState } from 'react';

import { isEqual, shuffle } from 'lodash';

import { StyledButton } from 'app/atoms/StyledButton';
import { T, t } from 'lib/i18n';

import { PageModalScrollViewWithActions } from '../page-modal-scroll-view-with-actions';

import { ManualBackupModalSelectors } from './selectors';
import { VerifySeedPhraseInput } from './verify-seed-phrase-input';
import { WordsBoxItemData } from './verify-seed-phrase-input/words-box-item';

interface VerifyMnemonicFormProps {
  mnemonic: string;
  onSuccess: EmptyFn;
}

const WORDS_TO_VERIFY_COUNT = 3;

export const VerifyMnemonicForm = memo<VerifyMnemonicFormProps>(({ mnemonic, onSuccess }) => {
  const [isError, setIsError] = useState(false);
  const [inputValue, setInputValue] = useState<WordsBoxItemData[]>([]);
  const { expectedValue, wordsIndices, wordsBox } = useMemo(() => {
    const wordsBox = shuffle(mnemonic.split(' ').map((word, index) => ({ word, index }))).slice(
      0,
      WORDS_TO_VERIFY_COUNT
    );
    const expectedValue = wordsBox.slice().sort((a, b) => a.index - b.index);

    return { wordsBox, expectedValue, wordsIndices: expectedValue.map(({ index }) => index) };
  }, [mnemonic]);

  const handleSubmit = useCallback(() => {
    if (isEqual(inputValue, expectedValue)) {
      onSuccess();
    } else {
      setIsError(true);
    }
  }, [expectedValue, inputValue, onSuccess]);

  const handleInputChange = useCallback((value: WordsBoxItemData[]) => {
    setInputValue(value);
    setIsError(false);
  }, []);

  return (
    <>
      <PageModalScrollViewWithActions
        className="py-4"
        bottomEdgeThreshold={16}
        actionsBoxProps={{
          children: (
            <StyledButton
              size="L"
              color="primary"
              disabled={isError}
              className="flex-1"
              onClick={handleSubmit}
              testID={ManualBackupModalSelectors.confirmButton}
            >
              <T id="confirm" />
            </StyledButton>
          )
        }}
      >
        <VerifySeedPhraseInput
          onChange={handleInputChange}
          value={inputValue}
          wordsBox={wordsBox}
          wordsIndices={wordsIndices}
          error={isError ? t('verifySeedPhraseError') : undefined}
        />
      </PageModalScrollViewWithActions>
    </>
  );
});
