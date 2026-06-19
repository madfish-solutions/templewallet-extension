import { FC, Ref, useImperativeHandle, useState } from 'react';

import { motion } from 'motion/react';

import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';

import { IconBase } from './IconBase';

export interface AnimatedMenuChevron {
  handleHover: EmptyFn;
  handleUnhover: EmptyFn;
}

const CHEVRON_TRANSITION = {
  type: 'spring',
  stiffness: 650,
  damping: 25,
  mass: 1
} as const;

interface AnimatedMenuChevronProps {
  ref?: Ref<AnimatedMenuChevron>;
}

export const AnimatedMenuChevron: FC<AnimatedMenuChevronProps> = ({ ref }) => {
  const [isHovered, setIsHovered] = useState(false);

  useImperativeHandle(ref, () => ({
    handleHover: () => void setIsHovered(true),
    handleUnhover: () => void setIsHovered(false)
  }));

  return (
    <motion.div
      initial={false}
      animate={{ marginRight: isHovered ? '0.25rem' : '0rem' }}
      transition={CHEVRON_TRANSITION}
    >
      <IconBase Icon={ChevronRightIcon} className="text-primary" />
    </motion.div>
  );
};
