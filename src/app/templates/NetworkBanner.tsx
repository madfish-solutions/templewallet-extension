import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import Name from 'app/atoms/Name';
import { T } from 'lib/i18n';
import { useAllTezosNetworks } from 'temple/front';
import { getNetworkTitle } from 'temple/front/networks';

type NetworkBannerProps = {
  rpc: string;
  narrow?: boolean;
};

const NetworkBanner: FC<NetworkBannerProps> = ({ rpc, narrow = false }) => {
  const networks = useAllTezosNetworks();

  const knownNetwork = useMemo(() => networks.find(n => n.rpcBaseURL === rpc), [networks, rpc]);

  return (
    <div className={classNames('flex flex-col w-full', narrow ? '-mt-1 mb-2' : 'mb-4')}>
      <h2 className="leading-tight flex flex-col">
        <span className={classNames(narrow ? 'mb-1' : 'mb-2', 'text-base font-semibold text-gray-700')}>
          <T id="network" />
        </span>

        {knownNetwork ? (
          <div className="mb-1 flex items-center">
            <div
              className="mr-1 w-3 h-3 border border-primary-white rounded-full shadow-xs"
              style={{
                backgroundColor: knownNetwork.color
              }}
            />

            <span className="text-gray-700 text-sm">{getNetworkTitle(knownNetwork)}</span>
          </div>
        ) : (
          <div className="w-full mb-1 flex items-center">
            <div
              className={classNames(
                'flex-shrink-0 mr-1 w-3 h-3 bg-red-500',
                'border border-primary-white rounded-full shadow-xs'
              )}
            />

            <span className="flex-shrink-0 mr-2 text-xs font-medium uppercase text-red-500">
              <T id="unknownNetwork" />
            </span>

            <Name className="text-xs font-mono italic text-gray-900" style={{ maxWidth: '15rem' }}>
              {rpc}
            </Name>
          </div>
        )}
      </h2>
    </div>
  );
};

export default NetworkBanner;
