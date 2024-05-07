import React, { FC, SVGProps, memo, useCallback } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { TID, t } from 'lib/i18n';
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
  style?: React.CSSProperties;
}

export const ActionsDropdown = memo<ActionsDropdownProps>(({ actions, opened, title, style = {}, setOpened }) => (
  <DropdownWrapper
    opened={opened}
    design="light"
    className="origin-top-right p-2 w-40"
    style={{
      pointerEvents: 'all',
      ...style
    }}
  >
    <div className="flex flex-col">
      <span className="text-xxxs text-gray-500 px-2 py-2.5 font-semibold leading-3">{title}</span>
      {actions.map(action => (
        <ActionButton key={action.key} action={action} setOpened={setOpened} />
      ))}
    </div>
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
      className={clsx(
        'flex items-center px-2 py-1.5 text-xs text-left leading-4',
        danger ? 'text-red-500' : 'text-gray-900'
      )}
      onClick={handleClick}
    >
      <span className={clsx('leading-none', danger ? 'text-red-500' : 'text-blue-500')}>
        <Icon className="w-4 h-4 ml-1 mr-2 stroke-current stroke-2" />
      </span>
      {t(i18nKey)}
    </Button>
  );
});
