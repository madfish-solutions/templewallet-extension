import React, { memo, useMemo } from 'react';

import { useDebounce } from 'use-debounce';

interface Props {
  children: string;
  searchValue: string;
}

export const SearchHighlightText = memo<Props>(({ children: text, searchValue }) => {
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const textFragments = useMemo<{ content: string; isHighlighted: boolean }[] | null>(() => {
    if (!searchValueDebounced) return null;

    const fragments: Array<{ content: string; isHighlighted: boolean }> = [];

    let startIndex = 0;

    const lowercaseNonHighlightedTexts = text.toLowerCase().split(searchValueDebounced.toLowerCase());

    for (let i = 0; i < lowercaseNonHighlightedTexts.length; i++) {
      const nonHighlightedText = lowercaseNonHighlightedTexts[i];

      if (nonHighlightedText) {
        fragments.push({
          content: text.slice(startIndex, startIndex + nonHighlightedText.length),
          isHighlighted: false
        });
        startIndex += nonHighlightedText.length;
      }

      if (i < lowercaseNonHighlightedTexts.length - 1) {
        fragments.push({
          content: text.slice(startIndex, startIndex + searchValueDebounced.length),
          isHighlighted: true
        });
        startIndex += searchValueDebounced.length;
      }
    }

    return fragments;
  }, [searchValueDebounced, text]);

  if (!textFragments) return <span>{text}</span>;

  return (
    <>
      {textFragments.map(({ content, isHighlighted }, i) => (
        <span key={i} className={isHighlighted ? 'bg-marker-highlight' : undefined}>
          {content}
        </span>
      ))}
    </>
  );
});
