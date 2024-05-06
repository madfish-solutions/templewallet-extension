import React, { memo, useCallback } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ACTIONS_DROPDOWN_ITEM_CLASSNAME, ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { PopperRenderProps } from 'lib/ui/Popper';

export interface AccountsAction {
  key: string;
  title: () => string;
  icon: ImportedSVGComponent;
  onClick: () => void;
  danger?: boolean;
}

interface ActionsDropdownProps extends PopperRenderProps {
  actions: AccountsAction[];
  title: string;
}

export const AccountsActionsDropdown = memo<ActionsDropdownProps>(({ actions, opened, title, setOpened }) => (
  <ActionsDropdownPopup title={() => title} opened={opened} style={{ minWidth: 154 }}>
    {actions.map(action => (
      <ActionButton key={action.key} action={action} setOpened={setOpened} />
    ))}
  </ActionsDropdownPopup>
));

interface ActionButtonProps extends Pick<PopperRenderProps, 'setOpened'> {
  action: AccountsAction;
}

const ActionButton = memo<ActionButtonProps>(({ action, setOpened }) => {
  const { title, icon: Icon, onClick, danger } = action;

  const handleClick = useCallback(() => {
    setOpened(false);
    onClick();
  }, [onClick, setOpened]);

  return (
    <Button className={ACTIONS_DROPDOWN_ITEM_CLASSNAME} onClick={handleClick}>
      <IconBase Icon={Icon} size={16} className={danger ? 'text-error' : 'text-secondary'} />

      <span className={danger ? 'text-error' : undefined}>{title()}</span>
    </Button>
  );
});
