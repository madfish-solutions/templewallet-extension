import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { Name } from 'app/atoms';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';
import { getNetworkTitle } from 'temple/front';
import { NetworkBase } from 'temple/networks';

import { NetworkSettingsSelectors } from './selectors';

interface Props {
  network: NetworkBase;
  selected: boolean;
  last: boolean;
  onSelect: SyncFn<string>;
  onRemoveClick?: SyncFn<string>;
}

export const RpcItem = memo<Props>(({ network, onSelect, onRemoveClick, selected, last }) => {
  const rpcBaseURL = network.rpcBaseURL;

  const handleClick = useCallback(() => (selected ? null : onSelect(network.id)), [onSelect, selected, network.id]);

  const handleRemoveClick = useMemo(() => {
    if (!onRemoveClick) return null;

    return () => onRemoveClick(network.id);
  }, [onRemoveClick, network.id]);

  return (
    <div
      className={clsx(
        'flex items-stretch block w-full overflow-hidden text-gray-700 cursor-pointer',
        !last && 'border-b border-gray-200',
        'opacity-90 hover:opacity-100 focus:outline-none',
        'transition ease-in-out duration-200'
      )}
      style={{
        padding: '0.4rem 0.375rem 0.4rem 0.375rem'
      }}
      onClick={handleClick}
      {...setTestID(NetworkSettingsSelectors.networkItem)}
      {...setAnotherSelector('url', rpcBaseURL)}
    >
      {selected ? (
        <div
          className="mt-1 ml-2 mr-3 w-3 h-3 border border-primary-white rounded-full shadow-xs"
          style={{ background: network.color }}
        />
      ) : (
        <div className="ml-2 mr-3 w-3" />
      )}

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
});
