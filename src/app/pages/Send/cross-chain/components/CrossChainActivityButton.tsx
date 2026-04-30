import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { AnimatedDot } from 'app/atoms/AnimatedDot';
import { Button } from 'app/atoms/Button';
import { ReactComponent as ClockIcon } from 'app/icons/base/clock.svg';

interface Props {
  hasActive: boolean;
  onClick: EmptyFn;
}

export const CrossChainActivityButton = memo<Props>(({ hasActive, onClick }) => (
  <Button onClick={onClick} className="relative">
    <IconBase Icon={ClockIcon} size={16} className="text-primary" />
    {hasActive && <AnimatedDot className="top-0 left-0" />}
  </Button>
));
