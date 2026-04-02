import { ReactNode, memo } from 'react';

import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import { T, TID } from 'lib/i18n';

interface Props {
  labelI18n: TID;
  expanded: boolean;
  Icon?: ImportedSVGComponent;
  iconNode?: ReactNode;
  active?: boolean;
  stretch?: boolean;
  onClick?: EmptyFn;
  onMouseEnter?: EmptyFn;
  onMouseLeave?: EmptyFn;
  testID?: string;
}

export const ControlButton = memo<Props>(
  ({
    labelI18n,
    expanded,
    Icon,
    iconNode,
    active = false,
    stretch = false,
    onClick,
    onMouseEnter,
    onMouseLeave,
    testID
  }) => (
    <Button
      className={clsx(
        'flex items-center h-8 p-[3.5px] rounded-full border-0.5 border-lines overflow-hidden transition-[width] ease-in duration-300',
        active ? 'bg-secondary-low' : 'bg-grey-4 hover:bg-secondary-low',
        expanded ? (stretch ? 'w-29' : 'w-[84px]') : 'w-8'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      testID={testID}
    >
      <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-white">
        {iconNode ?? (Icon && <IconBase Icon={Icon} className={clsx(active ? 'text-secondary' : 'text-grey-1')} />)}
      </div>

      <div className={clsx('transition-opacity ease-in duration-300', expanded ? 'opacity-100' : 'opacity-0')}>
        <span className="text-font-small ml-1">
          <T id={labelI18n} />
        </span>
      </div>
    </Button>
  )
);
