import React, { FC, memo, useCallback } from 'react';

import { emptyFn } from '@rnw-community/shared';
import clsx from 'clsx';

import { ImportAccountSelectors } from 'app/templates/ImportAccountModal/selectors';
import { setAnotherSelector, setTestID } from 'lib/analytics';

import { getOptionLabel } from './get-option-label';

interface Props {
  option: string;
  selectedOption: string;
  onClick?: (option: string) => void;
}

export const SeedLengthOption: FC<Props> = memo(({ option, selectedOption, onClick = emptyFn }) => {
  const handleClick = useCallback(() => onClick(option), [onClick, option]);

  return (
    <li
      value={option}
      onClick={handleClick}
      className={clsx(
        selectedOption === option ? 'bg-grey-4' : 'hover:bg-secondary-low',
        'text-font-description px-2 py-2.5 rounded-md cursor-pointer'
      )}
      {...setTestID(ImportAccountSelectors.mnemonicWordsOption)}
      {...setAnotherSelector('words', option)}
    >
      {getOptionLabel(option)}
    </li>
  );
});
