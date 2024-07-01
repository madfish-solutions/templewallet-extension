import React, { memo } from 'react';

import clsx from 'clsx';

import { FormField } from 'app/atoms';

import { setTestID, TestIDProps } from '../../../../lib/analytics';
import { ManualBackupModalSelectors } from '../selectors';

interface WordInputProps extends TestIDProps {
  wordIndex: number;
  active: boolean;
  value?: string;
}

export const WordInput = memo<WordInputProps>(({ wordIndex, active, value, testID }) => (
  <FormField
    className={clsx('text-font-medium rounded-md', active && 'border border-secondary')}
    fieldWrapperBottomMargin={false}
    smallPaddings
    extraLeftInner={
      <span className="text-font-medium text-grey-2" {...setTestID(ManualBackupModalSelectors.wordIndex)}>
        {wordIndex + 1}.
      </span>
    }
    value={value}
    readOnly
    testID={testID || ''}
  />
));
