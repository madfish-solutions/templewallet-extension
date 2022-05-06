import React, { FC, HTMLAttributes, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Name from 'app/atoms/Name';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SignalAltIcon } from 'app/icons/signal-alt.svg';
import { T } from 'lib/i18n/react';
import { loadChainId, useAllNetworks, useNetwork, usePassiveStorage, useSetNetworkId } from 'lib/temple/front';
import { NETWORKS } from 'lib/temple/networks';
import Popper from 'lib/ui/Popper';

import styles from './NetworkSelect.module.css';
import { NetworkSelectSelectors } from './NetworkSelect.selectors';

type NetworkSelectProps = HTMLAttributes<HTMLDivElement>;

const NetworkSelect: FC<NetworkSelectProps> = () => {
  const allNetworks = useAllNetworks();
  const network = useNetwork();
  const networks = useMemo(() => (allNetworks && Array.isArray(allNetworks) ? allNetworks : NETWORKS), [allNetworks]);
  const [fallbackNetworkId, setFallBackNetworkId] = usePassiveStorage('network_id', networks[0]);
  const setNetworkId = useSetNetworkId();

  const handleNetworkSelect = useCallback(
    async (netId: string, rpcUrl: string, selected: boolean, setOpened: (o: boolean) => void) => {
      setOpened(false);

      if (!selected) {
        try {
          await loadChainId(rpcUrl);
        } catch {}

        if (typeof setNetworkId !== 'function') {
          const foundNetwork = networks.find(x => x.id === netId);
          if (foundNetwork) setFallBackNetworkId(foundNetwork);
          return;
        }
        setNetworkId(netId);
      }
    },
    [setNetworkId, setFallBackNetworkId, networks]
  );

  const selectedNetwork = useMemo(
    () => (typeof setNetworkId === 'function' ? network : fallbackNetworkId),
    [network, fallbackNetworkId, setNetworkId]
  );

  console.log('selectedNetwork', selectedNetwork);

  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={({ opened, setOpened }) => (
        <DropdownWrapper opened={opened} className="origin-top-right">
          <div className={styles.scroll}>
            <h2
              className={classNames(
                'mb-2',
                'border-b border-white border-opacity-25',
                'px-1 pb-1',
                'flex items-center',
                'text-white text-opacity-90 text-sm text-center'
              )}
            >
              <SignalAltIcon className="w-auto h-4 mr-1 stroke-current" />
              <T id="networks">{networks => <>{networks}</>}</T>
            </h2>

            {networks
              // Don't show hidden (but known) nodes on the dropdown
              .filter(n => !n.hidden)
              .map(({ id, rpcBaseURL, name, color, disabled, nameI18nKey }) => {
                const selected = id === selectedNetwork.id;

                return (
                  <Button
                    key={id}
                    className={classNames(
                      'w-full',
                      'mb-1',
                      'rounded',
                      'transition easy-in-out duration-200',
                      !disabled && (selected ? 'bg-white bg-opacity-10' : 'hover:bg-white hover:bg-opacity-5'),
                      disabled ? 'cursor-default' : 'cursor-pointer',
                      'flex items-center',
                      disabled && 'opacity-25'
                    )}
                    style={{
                      padding: '0.375rem 1.5rem 0.375rem 0.5rem'
                    }}
                    disabled={disabled}
                    autoFocus={selected}
                    onClick={() => {
                      if (!disabled) {
                        handleNetworkSelect(id, rpcBaseURL, selected, setOpened);
                      }
                    }}
                    testID={NetworkSelectSelectors.NetworkItemButton}
                  >
                    <div
                      className={classNames('mr-2 w-3 h-3', 'border border-primary-white', 'rounded-full', 'shadow-xs')}
                      style={{ backgroundColor: color }}
                    />

                    <span
                      className="overflow-hidden text-sm text-white whitespace-nowrap text-shadow-black"
                      style={{ textOverflow: 'ellipsis', maxWidth: '10rem' }}
                    >
                      {(nameI18nKey && <T id={nameI18nKey} />) || name}
                    </span>
                  </Button>
                );
              })}
          </div>
        </DropdownWrapper>
      )}
    >
      {({ ref, opened, toggleOpened }) => (
        <Button
          ref={ref}
          className={classNames(
            'px-2 py-1',
            'bg-white bg-opacity-10 rounded',
            'border border-primary-orange border-opacity-25',
            'text-primary-white text-shadow-black',
            'text-xs font-medium',
            'transition ease-in-out duration-200',
            opened ? 'shadow-md' : 'shadow hover:shadow-md focus:shadow-md',
            opened ? 'opacity-100' : 'opacity-90 hover:opacity-100 focus:opacity-100',
            'flex items-center',
            'select-none'
          )}
          onClick={toggleOpened}
          testID={NetworkSelectSelectors.SelectedNetworkButton}
        >
          <div
            className={classNames('mr-2', 'w-3 h-3', 'border border-primary-white', 'rounded-full', 'shadow-xs')}
            style={{ backgroundColor: selectedNetwork.color }}
          />

          <Name style={{ maxWidth: '7rem' }}>
            {(selectedNetwork.nameI18nKey && <T id={selectedNetwork.nameI18nKey} />) || selectedNetwork.name}
          </Name>

          <ChevronDownIcon className="ml-1 -mr-1 stroke-current stroke-2" style={{ height: 16, width: 'auto' }} />
        </Button>
      )}
    </Popper>
  );
};

export default NetworkSelect;
