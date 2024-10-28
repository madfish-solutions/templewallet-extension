import React, { FC, memo, useCallback, useMemo } from 'react';

import { Button, IconBase } from 'app/atoms';
import DAppLogo from 'app/atoms/DAppLogo';
import { EmptyState } from 'app/atoms/EmptyState';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/ScrollView';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as UnlinkSvg } from 'app/icons/base/unlink.svg';
import type { TezosDAppSession } from 'app/storage/dapps';
import { useStoredTezosDappsSessions } from 'app/storage/dapps/use-value.hook';
import { useTempleClient } from 'lib/temple/front';
import { throttleAsyncCalls } from 'lib/utils/functions';
import { useAccountAddressForTezos } from 'temple/front';

import { useActiveTabUrlOrigin } from './use-active-tab';

export const DAppsSettings = memo(() => {
  const { removeDAppSession } = useTempleClient();

  const tezAddress = useAccountAddressForTezos();
  const [dappsSessions] = useStoredTezosDappsSessions();

  const dapps = useMemo(() => {
    if (!dappsSessions) return [];

    const entries = Object.entries(dappsSessions);

    return tezAddress ? entries.filter(([, ds]) => ds.pkh === tezAddress) : entries;
  }, [dappsSessions, tezAddress]);

  const activeTabOrigin = useActiveTabUrlOrigin();

  const activeDApp = useMemo(
    () => (activeTabOrigin ? dapps.find(([origin]) => origin === activeTabOrigin) : null),
    [dapps, activeTabOrigin]
  );

  const displayedDapps = useMemo(
    () => (activeDApp ? dapps.filter(dapp => dapp !== activeDApp) : dapps),
    [dapps, activeDApp]
  );

  const handleRemove = useMemo(
    () => throttleAsyncCalls((origins: string[]) => removeDAppSession(origins)),
    [removeDAppSession]
  );

  const onRemoveClick = useCallback((origin: string) => handleRemove([origin]), [handleRemove]);

  const onRemoveAllClick = useCallback(() => handleRemove(dapps.map(([o]) => o)), [handleRemove, dapps]);

  if (!dapps.length) return <EmptyState forSearch={false} text="No connections" stretch />;

  return (
    <>
      <ScrollView className="gap-y-6 px-4 py-6">
        {activeDApp ? (
          <Section title="Current connection">
            <DAppItem dapp={activeDApp[1]} origin={activeDApp[0]} onRemoveClick={onRemoveClick} />
          </Section>
        ) : null}

        {displayedDapps.length ? (
          <Section title="Connected Dapps">
            <div className="flex flex-col gap-y-3">
              {displayedDapps.map(([origin, dapp]) => (
                <DAppItem key={dapp.appMeta.name} dapp={dapp} origin={origin} onRemoveClick={onRemoveClick} />
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
  );
});

interface DAppItemProps {
  dapp: TezosDAppSession;
  origin: string;
  onRemoveClick: SyncFn<string>;
}

const DAppItem = memo<DAppItemProps>(({ dapp, origin, onRemoveClick }) => (
  <div key={dapp.appMeta.name} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-bottom">
    <DAppLogo origin={origin} size={40} className="p-[2px] rounded-full" />

    <div className="flex-grow text-font-medium">{dapp.appMeta.name}</div>

    <Button className="p-1" onClick={() => onRemoveClick(origin)}>
      <IconBase Icon={UnlinkSvg} size={16} className="text-primary" />
    </Button>
  </div>
));

const Section: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="flex flex-col">
    <span className="mb-3 text-font-description text-grey-1">{title}</span>

    {children}
  </div>
);
