import React, { FC } from 'react';

import clsx from 'clsx';

interface Props {
  className?: string;
  thinest?: boolean;
}

const Divider: FC<Props> = ({ thinest, className }) => (
  <hr className={clsx('h-px bg-clip-content w-auto border-0 bg-lines', thinest && 'pt-0.5px', className)} />
);

export default Divider;
