import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import Identicon from 'app/atoms/Identicon';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';

interface Props {
  onSelectAddressClick?: EmptyFn;
}

export const SelectAddressButton = memo<Props>(({ onSelectAddressClick }) => {
  return (
    <div
      className="cursor-pointer flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
      onClick={onSelectAddressClick}
    >
      <div className="flex justify-center items-center gap-2">
        <div className="flex p-px rounded-md border border-secondary">
          <Identicon type="bottts" hash="selectaccount" size={20} />
        </div>
        <span className="text-font-medium-bold">Select My Account</span>
      </div>
      <IconBase Icon={CompactDown} className="text-primary" size={16} />
    </div>
  );
});
