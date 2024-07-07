import React from 'react';

import { StayActiveIconButton } from 'app/atoms/IconButton';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { TestIDProps } from 'lib/analytics';

interface ButtonForManageDropdownProps extends TestIDProps {
  opened: boolean;
  tooltip?: string;
  onClick?: EmptyFn;
}

export const ButtonForManageDropdown = React.forwardRef<HTMLButtonElement, ButtonForManageDropdownProps>(
  ({ opened, tooltip, testID, testIDProperties, onClick }, popperRef) => (
    <StayActiveIconButton
      ref={popperRef}
      Icon={ManageIcon}
      active={opened}
      tooltip={opened ? undefined : tooltip}
      testID={testID}
      testIDProperties={testIDProperties}
      onClick={onClick}
    />
  )
);
