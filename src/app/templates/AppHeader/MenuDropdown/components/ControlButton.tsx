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
  onClick?: EmptyFn;
  onMouseEnter?: EmptyFn;
  onMouseLeave?: EmptyFn;
  testID?: string;
}

export const ControlButton = memo<Props>(
  ({ labelI18n, expanded, Icon, iconNode, active = false, onClick, onMouseEnter, onMouseLeave, testID }) => (
    <Button
      className={clsx(
        'flex items-center p-1 rounded-full border-0.5 border-lines bg-grey-4 hover:bg-secondary-low overflow-hidden transition-all ease-in duration-300',
        expanded ? 'w-[84px] h-8 gap-x-1' : 'w-8 h-8'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      testID={testID}
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white">
        {iconNode ?? (Icon && <IconBase Icon={Icon} className={clsx(active ? 'text-secondary' : 'text-grey-1')} />)}
      </div>

      {expanded && (
        <span className="text-font-small">
          <T id={labelI18n} />
        </span>
      )}
    </Button>
  )
);
