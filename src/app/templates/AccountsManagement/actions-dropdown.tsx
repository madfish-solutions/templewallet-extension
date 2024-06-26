import React, { memo } from 'react';

import { ActionListItem, ActionListItemProps } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { PopperRenderProps } from 'lib/ui/Popper';

export interface AccountsAction extends ActionListItemProps {
  key: string;
}

interface Props extends PopperRenderProps {
  actions: AccountsAction[];
  title: string;
}

export const AccountsActionsDropdown = memo<Props>(({ actions, opened, title, setOpened }) => (
  <ActionsDropdownPopup title={title} opened={opened} style={{ minWidth: 154 }}>
    {actions.map(action => (
      <ActionListItem {...action} key={action.key} setOpened={setOpened} />
    ))}
  </ActionsDropdownPopup>
));
