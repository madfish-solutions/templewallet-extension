import React, { memo, useCallback, useMemo, useState } from 'react';

import { isEqual, shuffle } from 'lodash';

import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { T, t } from 'lib/i18n';

import { ManualBackupModalSelectors } from './selectors';
import { VerifySeedPhraseInput } from './verify-seed-phrase-input';
import { WordsBoxItemData } from './verify-seed-phrase-input/words-box-item';

interface VerifyMnemonicFormProps {
  mnemonic: string;
  onSuccess: EmptyFn;
  onCancel: EmptyFn;
}

const WORDS_TO_VERIFY_COUNT = 3;

export const VerifyMnemonicForm = memo<VerifyMnemonicFormProps>(({ mnemonic, onSuccess, onCancel }) => {
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);
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
      <ScrollView className="py-4" bottomEdgeThreshold={16} onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <VerifySeedPhraseInput
          onChange={handleInputChange}
          value={inputValue}
          wordsBox={wordsBox}
          wordsIndices={wordsIndices}
          error={isError ? t('verifySeedPhraseError') : undefined}
        />
      </ScrollView>

      <ActionsButtonsBox className="gap-2.5" flexDirection="row" shouldCastShadow={!bottomEdgeIsVisible}>
        <StyledButton
          size="L"
          color="primary-low"
          className="flex-1"
          onClick={onCancel}
          testID={ManualBackupModalSelectors.cancelButton}
        >
          <T id="cancel" />
        </StyledButton>
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
      </ActionsButtonsBox>
    </>
  );
});
