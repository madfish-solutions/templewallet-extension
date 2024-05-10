import React, { FC, PropsWithChildren, CSSProperties } from 'react';

import clsx from 'clsx';

import DropdownWrapper from './DropdownWrapper';

interface Props {
  title: () => string;
  opened: boolean;
  lowered?: boolean;
  style?: CSSProperties;
}

export const ActionsDropdownPopup: FC<PropsWithChildren<Props>> = ({ title, opened, lowered, style, children }) => {
  //
  return (
    <DropdownWrapper
      opened={opened}
      design="day"
      className={clsx('p-2 flex flex-col', lowered ? 'mt-3' : 'mt-1')}
      style={style}
    >
      <div className="py-2.5 px-2 text-font-small-bold text-grey-1">{title()}</div>

      {children}
    </DropdownWrapper>
  );
};
