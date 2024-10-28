import React, { FC, memo, useCallback, useMemo } from 'react';

import { Button, IconBase } from 'app/atoms';
import DAppLogo from 'app/atoms/DAppLogo';
import { EmptyState } from 'app/atoms/EmptyState';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/ScrollView';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as UnlinkSvg } from 'app/icons/base/unlink.svg';
import type { TezosDAppSession } from 'app/storage/dapps';
import { useDAppsConnections } from 'app/templates/DAppConnection/use-connections';

export const DAppsSettings = memo(() => {
  const { dapps, activeDApp, disconnectDApps, disconnectOne } = useDAppsConnections();

  const displayedDapps = useMemo(
    () => (activeDApp ? dapps.filter(dapp => dapp !== activeDApp) : dapps),
    [dapps, activeDApp]
  );

  const onRemoveAllClick = useCallback(() => disconnectDApps(dapps.map(([o]) => o)), [disconnectDApps, dapps]);

  if (!dapps.length) return <EmptyState forSearch={false} text="No connections" stretch />;

  return (
    <>
      <ScrollView className="gap-y-6 px-4 py-6">
        {activeDApp ? (
          <Section title="Current connection">
            <DAppItem dapp={activeDApp[1]} origin={activeDApp[0]} onRemoveClick={disconnectOne} />
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
  );
});

interface DAppItemProps {
  dapp: TezosDAppSession;
  origin: string;
  onRemoveClick: SyncFn<string>;
}

const DAppItem = memo<DAppItemProps>(({ dapp, origin, onRemoveClick }) => (
  <div key={dapp.appMeta.name} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-bottom">
    <DAppLogo origin={origin} size={36} className="m-[2px] rounded-full" />

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
