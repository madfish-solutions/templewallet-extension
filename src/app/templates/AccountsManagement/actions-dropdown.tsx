import React, { FC, SVGProps, memo, useCallback } from 'react';

import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { T, TID } from 'lib/i18n';
import { PopperRenderProps } from 'lib/ui/Popper';

export interface Action {
  key: string;
  i18nKey: TID;
  icon: FC<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  danger: boolean;
}

interface ActionsDropdownProps extends PopperRenderProps {
  actions: Action[];
  title: string;
}

export const ActionsDropdown = memo<ActionsDropdownProps>(({ actions, opened, title, setOpened }) => (
  <DropdownWrapper opened={opened} design="day" className="mt-1 p-2 flex flex-col" style={{ minWidth: 154 }}>
    <h6 className="py-2.5 px-2 text-xxxs leading-3 font-semibold text-grey-1">{title}</h6>

    {actions.map(action => (
      <ActionButton key={action.key} action={action} setOpened={setOpened} />
    ))}
  </DropdownWrapper>
));

interface ActionButtonProps extends Pick<PopperRenderProps, 'setOpened'> {
  action: Action;
}

const ActionButton = memo<ActionButtonProps>(({ action, setOpened }) => {
  const { i18nKey, icon: Icon, onClick, danger } = action;

  const handleClick = useCallback(() => {
    setOpened(false);
    onClick();
  }, [onClick, setOpened]);

  return (
    <Button
      className={clsx('flex items-center py-1.5 px-2 gap-x-1 rounded-md', 'hover:bg-secondary-low')}
      onClick={handleClick}
    >
      <IconBase Icon={Icon} size={16} className={danger ? 'text-error' : 'text-secondary'} />

      <span className={clsx('text-xs', danger && 'text-error')}>
        <T id={i18nKey} />
      </span>
    </Button>
  );
});
