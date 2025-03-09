import React, { FC, memo, useCallback, useMemo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Button, IconBase } from 'app/atoms';
import DAppLogo from 'app/atoms/DAppLogo';
import { EmptyState } from 'app/atoms/EmptyState';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/ScrollView';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { ReactComponent as UnlinkSvg } from 'app/icons/base/unlink.svg';
import { isTezosDAppSession, type DAppSession } from 'app/storage/dapps';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { useActiveTabUrlOrigin } from 'app/templates/DAppConnection/use-active-tab';
import { useDAppsConnections } from 'app/templates/DAppConnection/use-connections';
import { NetworkPopper } from 'app/templates/network-popper';
import { T } from 'lib/i18n';
import { useAllEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const DAppsSettings = memo(() => {
  const { dapps, activeDApp, disconnectDApps, disconnectOne, switchDAppEvmChain } = useDAppsConnections();

  const displayedDapps = useMemo(
    () => (activeDApp ? dapps.filter(dapp => dapp !== activeDApp) : dapps),
    [dapps, activeDApp]
  );

  const onRemoveAllClick = useCallback(() => disconnectDApps(dapps.map(([o]) => o)), [disconnectDApps, dapps]);

  return (
    <FadeTransition>
      {dapps.length ? (
        <>
          <ScrollView className="gap-y-6 px-4 py-6">
            {activeDApp ? (
              <Section title="Current connection">
                <DAppItem
                  dapp={activeDApp[1]}
                  origin={activeDApp[0]}
                  onRemoveClick={disconnectOne}
                  onEvmNetworkSelect={switchDAppEvmChain}
                />
              </Section>
            ) : null}

            {displayedDapps.length ? (
              <Section title="Connected Dapps">
                <div className="flex flex-col gap-y-3">
                  {displayedDapps.map(([origin, dapp]) => (
                    <DAppItem key={dapp.appMeta.name} dapp={dapp} origin={origin} onRemoveClick={disconnectOne} />
                  ))}
                </div>
              </Section>
            ) : null}
          </ScrollView>
          <ActionsButtonsBox className="sticky left-0 bottom-0" bgSet={false}>
            <StyledButton className="flex-1" size="L" color="red-low" onClick={onRemoveAllClick}>
              Disconnect All
            </StyledButton>
          </ActionsButtonsBox>
        </>
      ) : (
        <EmptyState forSearch={false} text="No connections" stretch />
      )}
    </FadeTransition>
  );
});

interface DAppItemProps {
  dapp: DAppSession;
  origin: string;
  onRemoveClick: SyncFn<string>;
  onEvmNetworkSelect?: (origin: string, chainId: number) => void;
}

const DAppItem = memo<DAppItemProps>(({ dapp, origin, onRemoveClick, onEvmNetworkSelect }) => {
  const activeTabOrigin = useActiveTabUrlOrigin();
  const evmChains = useAllEvmChains();
  const evmDAppNetwork = isTezosDAppSession(dapp) ? null : evmChains[dapp.chainId];

  const switchDAppNetwork = useCallback(
    (chain: FilterChain) => {
      if (chain?.kind === TempleChainKind.EVM && evmDAppNetwork?.chainId !== chain.chainId) {
        onEvmNetworkSelect?.(origin, chain.chainId);
      }
    },
    [evmDAppNetwork?.chainId, onEvmNetworkSelect, origin]
  );

  return (
    <div key={dapp.appMeta.name} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-bottom">
      <DAppLogo origin={origin} icon={dapp.appMeta.icon} size={36} className="m-[2px] rounded-full" />

      <div className="flex-grow gap-0.5">
        <span className="text-font-medium">{dapp.appMeta.name}</span>
        {activeTabOrigin === origin && !isTezosDAppSession(dapp) && (
          <div className="flex items-center gap-0.5">
            <span className="text-font-description text-grey-1">
              <T id="networkDropdownPrefix" />
            </span>
            <NetworkPopper
              placement="bottom-start"
              chainKind={TempleChainKind.EVM}
              showAllNetworksOption={false}
              selectedOption={evmDAppNetwork}
              onOptionSelect={switchDAppNetwork}
            >
              {({ ref, toggleOpened, selectedOptionName }) => (
                <Button
                  ref={ref}
                  className="flex items-center py-0.5 px-1 text-font-description-bold rounded hover:bg-secondary-low"
                  onClick={toggleOpened}
                >
                  <span>{selectedOptionName}</span>
                  <IconBase Icon={CompactDown} size={12} className="text-secondary" />
                </Button>
              )}
            </NetworkPopper>
          </div>
        )}
      </div>

      <Button className="p-1" onClick={() => onRemoveClick(origin)}>
        <IconBase Icon={UnlinkSvg} size={16} className="text-primary" />
      </Button>
    </div>
  );
});

const Section: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="flex flex-col">
    <span className="mb-3 text-font-description text-grey-1">{title}</span>

    {children}
  </div>
);
