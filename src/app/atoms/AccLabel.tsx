import React, { memo, useMemo } from 'react';

import { ReactComponent as HdIcon } from 'app/icons/hd.svg';
import { ReactComponent as ImportedIcon } from 'app/icons/imported.svg';
import { ReactComponent as LedgerIcon } from 'app/icons/ledger2.svg';
import { ReactComponent as ManageKtIcon } from 'app/icons/manage_kt.svg';
import { ReactComponent as WatchIcon } from 'app/icons/watch.svg';
import { TempleAccountType } from 'lib/temple/types';

import { IconBase } from './IconBase';

interface Props {
  type: TempleAccountType;
}

export const AccLabel = memo<Props>(({ type }) => {
  const [Icon, title] = useMemo(() => {
    switch (type) {
      case TempleAccountType.HD:
        return [HdIcon, 'HD'];
      case TempleAccountType.Imported:
        return [ImportedIcon, 'IMPORTED'];
      case TempleAccountType.Ledger:
        return [LedgerIcon, 'LEDGER'];
      case TempleAccountType.WatchOnly:
        return [WatchIcon, 'WATCH'];
      case TempleAccountType.ManagedKT:
        return [ManageKtIcon, 'MANAGE KT'];
    }
  }, [type]);

  return (
    <div className="flex items-center gap-x-px py-1 pl-1.5 pr-2 bg-grey-4 rounded-md">
      <IconBase Icon={Icon} size={12} className="text-grey-2" />

      <span className="text-font-num-bold-10 text-grey-1 uppercase">{title}</span>
    </div>
  );
});
