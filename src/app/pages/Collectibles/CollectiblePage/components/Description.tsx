import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as ChevronUpIcon } from 'app/icons/base/chevron_up.svg';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

const MAX_COLLAPSED_STATE_TEXT_LENGTH = 105;

interface Props {
  text?: string | nullish;
  className?: string;
}

export const Description = memo<Props>(({ text, className }) => {
  const [dropdownOpened, _, _1, toggleDropdown] = useBooleanState(false);

  const truncatedText = useMemo(() => {
    if (!text) return '';
    else if (text.length < MAX_COLLAPSED_STATE_TEXT_LENGTH) return text;
    else return text.substring(0, MAX_COLLAPSED_STATE_TEXT_LENGTH) + '…';
  }, [text]);

  if (!text) return null;

  const isDropdownAvailable = text.length > MAX_COLLAPSED_STATE_TEXT_LENGTH;

  return (
    <div
      className={clsx(
        'flex flex-col bg-white gap-y-1 p-4 rounded-8 shadow-md',
        isDropdownAvailable && 'cursor-pointer',
        className
      )}
    >
      <div
        onClick={isDropdownAvailable ? toggleDropdown : undefined}
        className="flex flex-row justify-between items-center py-1"
      >
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

      <p className="text-font-description break-words">{dropdownOpened ? text : truncatedText}</p>
    </div>
  );
});
