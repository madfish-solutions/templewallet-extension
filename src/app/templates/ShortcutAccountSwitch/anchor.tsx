import React, { FC } from 'react';

import Popper from 'lib/ui/Popper';

import { ShortcutAccountSwitch } from './index';

export const ShortcutAccountSwitchAnchor: FC = () => (
  <Popper
    placement="left-start"
    strategy="fixed"
    style={{ pointerEvents: 'none' }}
    popup={props => <ShortcutAccountSwitch {...props} />}
  >
    {({ ref }) => <span ref={ref} />}
  </Popper>
);
