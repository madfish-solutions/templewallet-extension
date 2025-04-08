import React, { memo, useRef, useEffect, useState } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as ChevronUpIcon } from 'app/icons/base/chevron_up.svg';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

interface Props {
  text?: string | nullish;
  className?: string;
}

export const Description = memo<Props>(({ text, className }) => {
  const [dropdownOpened, _, _1, toggleDropdown] = useBooleanState(false);
  const [isDropdownAvailable, setIsDropdownAvailable] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current && !dropdownOpened) {
      const el = textRef.current;
      setIsDropdownAvailable(el.scrollHeight > el.offsetHeight);
    }
  }, [text, dropdownOpened]);

  if (!text) return null;

  return (
    <div
      className={clsx(
        'flex flex-col bg-white gap-y-1 p-4 rounded-8 shadow-md',
        isDropdownAvailable && 'cursor-pointer',
        className
      )}
      onClick={isDropdownAvailable ? toggleDropdown : undefined}
    >
      <div className="flex flex-row justify-between items-center py-1">
        <span className="text-font-description-bold text-grey-1">
          <T id="description" />
        </span>

        {isDropdownAvailable && (
          <IconBase
            Icon={ChevronUpIcon}
            size={12}
            className={clsx(
              'text-grey-1 transform transition-transform duration-200',
              dropdownOpened ? 'rotate-0' : 'rotate-180'
            )}
          />
        )}
      </div>

      <p ref={textRef} className={clsx('text-font-description break-words', !dropdownOpened && 'line-clamp-2')}>
        {text}
      </p>
    </div>
  );
});
