import { ReactNode, memo } from 'react';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';

import { Button, IconBase } from 'app/atoms';
import { T, TID } from 'lib/i18n';

const TILE_TRANSITION = {
  type: 'spring',
  stiffness: 160,
  damping: 28,
  mass: 1.1
} as const;

interface Props {
  labelI18n: TID;
  expanded: boolean;
  Icon?: ImportedSVGComponent;
  iconNode?: ReactNode;
  active?: boolean;
  stretch?: boolean;
  onClick?: EmptyFn;
  onHoverStart?: EmptyFn;
  onHoverEnd?: EmptyFn;
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
    onHoverStart,
    onHoverEnd,
    testID
  }) => (
    <MotionButton
      className={clsx(
        'flex items-center h-8 p-[3.5px] rounded-full border-0.5 border-lines overflow-hidden',
        active ? 'bg-secondary-low' : 'bg-grey-4 hover:bg-secondary-low'
      )}
      animate={{
        width: expanded ? (stretch ? 116 : 84) : 32
      }}
      transition={TILE_TRANSITION}
      onClick={onClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      testID={testID}
    >
      <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-white">
        {iconNode ?? (Icon && <IconBase Icon={Icon} className={clsx(active ? 'text-secondary' : 'text-grey-1')} />)}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="overflow-hidden shrink-0"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: stretch ? 78 : 46 }}
            exit={{ opacity: 0, width: 0 }}
            transition={TILE_TRANSITION}
          >
            <span className="block text-font-small ml-1 truncate">
              <T id={labelI18n} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionButton>
  )
);

const MotionButton = motion.create(Button);
