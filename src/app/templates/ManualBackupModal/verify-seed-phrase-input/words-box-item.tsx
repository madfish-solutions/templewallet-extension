import React, { memo, useCallback } from 'react';

import { StyledButton } from 'app/atoms/StyledButton';

export interface WordsBoxItemData {
  index: number;
  word: string;
}

interface WordsBoxItemProps {
  data: WordsBoxItemData;
  selected: boolean;
  onSelect: (data: WordsBoxItemData) => void;
}

export const WordsBoxItem = memo<WordsBoxItemProps>(({ data, selected, onSelect }) => {
  const handleClick = useCallback(() => onSelect(data), [data, onSelect]);

  return (
    <StyledButton
      className="flex-1 font-normal py-2"
      color="secondary"
      disabled={selected}
      size="M"
      onClick={handleClick}
    >
      {data.word}
    </StyledButton>
  );
});
