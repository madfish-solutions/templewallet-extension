import React, { memo, useCallback } from 'react';

import { StyledButton } from 'app/atoms/StyledButton';

import { TestIDProps } from '../../../../lib/analytics';

export interface WordsBoxItemData {
  index: number;
  word: string;
}

interface WordsBoxItemProps extends TestIDProps {
  data: WordsBoxItemData;
  selected: boolean;
  onSelect: (data: WordsBoxItemData) => void;
}

export const WordsBoxItem = memo<WordsBoxItemProps>(({ data, selected, onSelect, testID }) => {
  const handleClick = useCallback(() => onSelect(data), [data, onSelect]);

  return (
    <StyledButton
      className="flex-1 font-normal py-2"
      color="secondary"
      disabled={selected}
      size="M"
      onClick={handleClick}
      testID={testID || ''}
    >
      {data.word}
    </StyledButton>
  );
});
