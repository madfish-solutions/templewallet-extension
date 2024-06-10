import React, { memo } from 'react';

import { Divider, IconBase, ToggleSwitch } from 'app/atoms';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { NetworksModal } from './NetworksModal';

export const AssetsFilterOptions = memo(() => {
  const [networksModalOpened, setNetworksModalOpen, setNetworksModalClosed] = useBooleanState(false);

  return (
    <div>
      <p className="mb-2 text-font-description-bold">
        <T id="filterTokens" />
      </p>

      <div
        className="cursor-pointer mb-4 flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
        onClick={setNetworksModalOpen}
      >
        <div className="flex items-center gap-2">
          <IconBase Icon={Browse} className="text-primary" size={16} />
          <span className="text-font-medium-bold">
            <T id="allNetworks" />
          </span>
        </div>
        <IconBase Icon={CompactDown} className="text-primary" size={16} />
      </div>

      <div className="rounded-lg shadow-bottom border-0.5 border-transparent">
        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="hideZeroBalance" />
          </span>

          <ToggleSwitch checked={false} />
        </div>

        <Divider style={{ height: '0.5px' }} />

        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="groupByNetwork" />
          </span>

          <ToggleSwitch checked={false} />
        </div>
      </div>

      <NetworksModal opened={networksModalOpened} onRequestClose={setNetworksModalClosed} />
    </div>
  );
});
