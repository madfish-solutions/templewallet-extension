import React, { memo, useCallback, useMemo, useState } from 'react';

import { isEqual, shuffle } from 'lodash';

import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { t } from 'lib/i18n';

import { VerifySeedPhraseModalSelectors } from './selectors';
import { VerifySeedPhraseInput } from './verify-seed-phrase-input';
import { WordsBoxItemData } from './verify-seed-phrase-input/words-box-item';

interface VerifySeedPhraseModalProps {
  opened: boolean;
  mnemonic: string;
  onSuccess: () => void;
  onBack: () => void;
  onClose: () => void;
}

const WORDS_TO_VERIFY_COUNT = 3;

export const VerifySeedPhraseModal = memo<VerifySeedPhraseModalProps>(
  ({ opened, mnemonic, onSuccess, onBack, onClose }) => {
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
      <PageModal title={t('verifySeedPhrase')} onGoBack={onBack} opened={opened} onRequestClose={onClose}>
        <ScrollView className="py-4">
          <VerifySeedPhraseInput
            onChange={handleInputChange}
            value={inputValue}
            wordsBox={wordsBox}
            wordsIndices={wordsIndices}
            error={isError ? t('verifySeedPhraseError') : undefined}
          />
        </ScrollView>
        <ActionsButtonsBox>
          <div className="flex gap-2.5">
            <StyledButton
              size="L"
              color="primary-low"
              className="flex-1"
              onClick={onClose}
              testID={VerifySeedPhraseModalSelectors.cancelButton}
            >
              {t('cancel')}
            </StyledButton>
            <StyledButton
              size="L"
              color="primary"
              disabled={isError}
              className="flex-1"
              onClick={handleSubmit}
              testID={VerifySeedPhraseModalSelectors.confirmButton}
            >
              {t('confirm')}
            </StyledButton>
          </div>
        </ActionsButtonsBox>
      </PageModal>
    );
  }
);
