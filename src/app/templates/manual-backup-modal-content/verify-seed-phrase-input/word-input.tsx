import React, { memo } from 'react';

import clsx from 'clsx';

import { FormField } from 'app/atoms';
import { setTestID, TestIDProps } from 'lib/analytics';

import { ManualBackupModalSelectors } from '../selectors';

interface WordInputProps extends TestIDProps {
  wordIndex: number;
  active: boolean;
  value?: string;
}

export const WordInput = memo<WordInputProps>(({ wordIndex, active, value, testID }) => (
  <FormField
    className={clsx('text-font-medium! rounded-md', active && 'border border-secondary')}
    fieldWrapperBottomMargin={false}
    smallPaddings
    extraLeftInnerWrapper="none"
    extraLeftInner={
      <div className="absolute flex items-center inset-y-0 pointer-events-none ml-2">
        <span className="text-font-medium text-grey-2" {...setTestID(ManualBackupModalSelectors.wordIndex)}>
          {wordIndex + 1}.
        </span>
      </div>
    }
    reserveSpaceForError={false}
    value={value}
    readOnly
    testID={testID}
  />
));
