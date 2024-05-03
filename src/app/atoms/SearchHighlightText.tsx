import React, { HTMLAttributes, memo, useMemo } from 'react';

interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  children: string;
  searchValue: string;
}

export const SearchHighlightText = memo<Props>(({ children: text, searchValue, ...rest }) => {
  const textFragments = useMemo<Array<{ content: string; isHighlighted: boolean }>>(() => {
    if (!searchValue) {
      return [{ content: text, isHighlighted: false }];
    }

    const fragments: Array<{ content: string; isHighlighted: boolean }> = [];
    let startIndex = 0;
    const lowercaseNonHighlightedTexts = text.toLowerCase().split(searchValue.toLowerCase());
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
        fragments.push({ content: text.slice(startIndex, startIndex + searchValue.length), isHighlighted: true });
        startIndex += searchValue.length;
      }
    }

    return fragments;
  }, [text, searchValue]);

  return (
    <span {...rest}>
      {textFragments.map(({ content, isHighlighted }, i) => (
        <span key={i} className={isHighlighted ? 'bg-marker-highlight text-gray-900' : ''}>
          {content}
        </span>
      ))}
    </span>
  );
});
