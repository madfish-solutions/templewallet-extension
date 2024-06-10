import React, { memo } from 'react';

import clsx from 'clsx';

import { FormField } from 'app/atoms';

interface WordInputProps {
  wordIndex: number;
  active: boolean;
  value?: string;
}

export const WordInput = memo<WordInputProps>(({ wordIndex, active, value }) => (
  <FormField
    className={clsx('text-font-medium rounded-md', active && 'border border-secondary')}
    fieldWrapperBottomMargin={false}
    smallPaddings
    extraLeftInner={<span className="text-font-medium text-grey-2">{wordIndex + 1}.</span>}
    value={value}
    readOnly
  />
));
