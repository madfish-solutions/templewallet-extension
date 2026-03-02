import { ReactNode, memo } from 'react';

import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import { T, TID } from 'lib/i18n';

interface Props {
  Icon?: ImportedSVGComponent;
  iconNode?: ReactNode;
  labelI18n: TID;
  expanded: boolean;
  highlighted: boolean;
  onClick: EmptyFn;
  onMouseEnter?: EmptyFn;
  onMouseLeave?: EmptyFn;
  testID?: string;
}

export const ToggleButton = memo<Props>(
  ({ Icon, iconNode, labelI18n, expanded, highlighted, onClick, onMouseEnter, onMouseLeave, testID }) => (
    <Button
      testID={testID}
      className={clsx(
        'h-10 rounded-full border-0.5 border-lines flex items-center overflow-hidden transition-all duration-200 ease-out',
        expanded ? 'px-1.5' : 'w-10 justify-center px-0',
        expanded
          ? highlighted
            ? 'w-[126px] bg-secondary-low text-secondary'
            : 'w-[126px] bg-grey-4 text-grey-1'
          : 'bg-white text-grey-1 hover:bg-grey-4'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onMouseEnter}
      onBlur={onMouseLeave}
    >
      <span className="h-7 w-7 rounded-full border-0.5 border-lines bg-white flex items-center justify-center shrink-0">
        {iconNode ??
          (Icon && (
            <IconBase
              Icon={Icon}
              size={16}
              className={clsx(expanded && highlighted ? 'text-primary' : 'text-grey-1')}
            />
          ))}
      </span>

      <span
        className={clsx(
          'text-font-description whitespace-nowrap overflow-hidden transition-all duration-200 ease-out',
          expanded ? 'max-w-24 opacity-100 pl-2' : 'max-w-0 opacity-0 pl-0'
        )}
      >
        <T id={labelI18n} />
      </span>
    </Button>
  )
);
