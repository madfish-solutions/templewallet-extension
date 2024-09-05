import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { ImportAccountSelectors } from 'app/templates/ImportAccountModal/selectors';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { getOptionLabel } from './get-option-label';
import { SeedLengthOption } from './SeedLengthOption';

interface SeedLengthSelectProps {
  options: Array<string>;
  currentOption: string;
  defaultOption?: string;
  onChange: (newSelectedOption: string) => void;
}

export const SeedLengthSelect: FC<SeedLengthSelectProps> = ({ options, currentOption, defaultOption, onChange }) => {
  const [selectedOption, setSelectedOption] = useState(defaultOption ?? '');
  const [isOpen, , close, toggleOpen] = useBooleanState(false);

  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedOption !== currentOption) {
      setSelectedOption(currentOption);
    }
  }, [currentOption, selectedOption]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        close();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [close, selectRef]);

  const handleClick = useCallback(
    (option: string) => {
      close();
      setSelectedOption(option);
      onChange(option);
    },
    [close, onChange]
  );

  const optionLabel = useMemo(() => getOptionLabel(selectedOption), [selectedOption]);

  return (
    <div ref={selectRef} className="relative">
      <StyledButton
        size="S"
        active={isOpen}
        color="secondary-low"
        className="flex items-center"
        onClick={toggleOpen}
        testID={ImportAccountSelectors.mnemonicDropDownButton}
      >
        <span>{optionLabel}</span>
        <IconBase size={12} Icon={CompactDownIcon} />
      </StyledButton>
      <ul className={clsx(!isOpen && 'hidden', 'z-1 absolute right-0 top-7 bg-white shadow-bottom p-2 w-[154px]')}>
        <li className="mx-2 my-2.5 text-font-small-bold text-grey-1">
          <T id="mySeedPhraseIs" />
        </li>
        {options.map(option => (
          <SeedLengthOption key={option} option={option} selectedOption={selectedOption} onClick={handleClick} />
        ))}
      </ul>
    </div>
  );
};
