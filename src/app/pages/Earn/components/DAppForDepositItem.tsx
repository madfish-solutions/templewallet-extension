import { memo, useCallback } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import { DAppForDeposit } from 'lib/dapps-for-deposit';

import { EarnSelectors } from '../selectors';

import { COMMON_ITEM_CLASSNAME } from './constants';

interface DAppForDepositItemProps {
  dApp: DAppForDeposit;
  onClick: SyncFn<DAppForDeposit>;
}

export const DAppForDepositItem = memo<DAppForDepositItemProps>(({ dApp, onClick }) => {
  const { icon: Icon, name, description } = dApp;
  const handleClick = useCallback(() => onClick(dApp), [dApp, onClick]);

  return (
    <Button
      className={clsx(COMMON_ITEM_CLASSNAME, 'flex gap-2 items-center')}
      testID={EarnSelectors.dAppForDepositItem}
      testIDProperties={{ dAppName: dApp.name }}
      onClick={handleClick}
    >
      <Icon className="size-9 m-0.5" />

      <div className="flex flex-col gap-y-1 text-left">
        <p className="text-font-medium-bold">{name}</p>
        <p className="text-font-description text-grey-1">{description}</p>
      </div>
    </Button>
  );
});
