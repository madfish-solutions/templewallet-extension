import React, { FC, CSSProperties } from 'react';

import DropdownWrapper from './DropdownWrapper';

interface Props {
  title: React.ReactNode;
  opened: boolean;
  lowering?: 1 | 2 | 3;
  style?: CSSProperties;
}

export const ActionsDropdownPopup: FC<PropsWithChildren<Props>> = ({
  title,
  opened,
  lowering = 1,
  style,
  children
}) => (
  <DropdownWrapper opened={opened} design="day" className={`p-2 flex flex-col mt-${lowering}`} style={style}>
    <div className="py-2.5 px-2 text-font-small-bold text-grey-1">{title}</div>

    {children}
  </DropdownWrapper>
);
