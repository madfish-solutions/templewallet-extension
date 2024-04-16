import React, { FC, memo, useMemo } from 'react';

import clsx from 'clsx';

import { Name } from 'app/atoms';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { getNetworkTitle } from 'temple/front';
import { EVM_DEFAULT_NETWORKS, NetworkBase } from 'temple/networks';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import { NetworkSettingsSelectors } from './selectors';

interface Props {
  chain: TempleChainKind;
  customNetworks: NetworkBase[];
  defaultNetworks: NetworkBase[];
  /** With passed network ID */
  handleRemoveClick: SyncFn<string>;
}

export const NetworksList = memo<Props>(({ chain, customNetworks, defaultNetworks, handleRemoveClick }) => {
  return (
    <div className="flex flex-col mb-8">
      <h2 className="mb-4 leading-tight flex flex-col">
        <span className="text-base font-semibold text-gray-700">
          {/* <T id="currentNetworks" /> */}
          {TempleChainTitle[chain]} <T id="networks" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
          <T id="deleteNetworkHint" />
        </span>
      </h2>

      <div className="flex flex-col text-gray-700 text-sm leading-tight border rounded-md overflow-hidden">
        {customNetworks.map(network => (
          <ListItem network={network} last={false} key={network.rpcBaseURL} onRemoveClick={handleRemoveClick} />
        ))}
        {defaultNetworks.map((network, index) => (
          <ListItem key={network.rpcBaseURL} last={index === EVM_DEFAULT_NETWORKS.length - 1} network={network} />
        ))}
      </div>
    </div>
  );
});

type ListItemProps = {
  network: NetworkBase;
  onRemoveClick?: (id: string) => void;
  last: boolean;
};

const ListItem: FC<ListItemProps> = ({ network, onRemoveClick, last }) => {
  const rpcBaseURL = network.rpcBaseURL;

  const handleRemoveClick = useMemo(() => {
    if (!onRemoveClick) return null;

    return () => onRemoveClick(network.id);
  }, [onRemoveClick, network.id]);

  return (
    <div
      className={clsx(
        'flex items-stretch block w-full overflow-hidden text-gray-700',
        !last && 'border-b border-gray-200',
        'opacity-90 hover:opacity-100 focus:outline-none',
        'transition ease-in-out duration-200'
      )}
      style={{
        padding: '0.4rem 0.375rem 0.4rem 0.375rem'
      }}
      {...setTestID(NetworkSettingsSelectors.networkItem)}
      {...setAnotherSelector('url', rpcBaseURL)}
    >
      <div
        className="mt-1 ml-2 mr-3 w-3 h-3 border border-primary-white rounded-full shadow-xs"
        style={{ background: network.color }}
      />

      <div className="flex flex-col justify-between flex-1">
        <Name className="mb-1 text-sm font-medium leading-tight">{getNetworkTitle(network)}</Name>

        <div
          className="text-xs text-gray-700 font-light flex items-center"
          style={{
            marginBottom: '0.125rem'
          }}
        >
          RPC:<Name className="ml-1 font-normal">{rpcBaseURL}</Name>
        </div>
      </div>

      {handleRemoveClick && (
        <button
          className="flex-none p-2 text-gray-500 hover:text-gray-600 transition ease-in-out duration-200"
          onClick={handleRemoveClick}
          {...setTestID(NetworkSettingsSelectors.deleteCustomNetworkButton)}
          {...setAnotherSelector('url', rpcBaseURL)}
        >
          <CloseIcon className="w-auto h-5 stroke-current stroke-2" title={t('delete')} />
        </button>
      )}
    </div>
  );
};
