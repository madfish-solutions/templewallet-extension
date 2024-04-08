import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

const WalletPageContainer: FC<Props> = ({ padding = true, className, ...rest }) => (
  <div className={classNames('w-full max-w-screen-sm mx-auto', padding && 'px-4', className)} {...rest} />
);

export default WalletPageContainer;

export const ContentContainer: FC<Props> = ({ padding = true, className, ...rest }) => (
  <div className={classNames('w-full max-w-sm mx-auto', padding && 'px-4', className)} {...rest} />
);
