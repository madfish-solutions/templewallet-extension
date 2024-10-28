import React, { FC, memo, useCallback, useMemo } from 'react';

import { Button, IconBase } from 'app/atoms';
import DAppLogo from 'app/atoms/DAppLogo';
import { EmptyState } from 'app/atoms/EmptyState';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/ScrollView';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as UnlinkSvg } from 'app/icons/base/unlink.svg';
import { useStoredTezosDappsSessions } from 'app/storage/dapps/use-value.hook';
import { useTempleClient } from 'lib/temple/front';
import { throttleAsyncCalls } from 'lib/utils/functions';

export const DAppsSettings = memo(() => {
  const { removeDAppSession } = useTempleClient();

  const [dappsSessions] = useStoredTezosDappsSessions();

  const dapps = useMemo(() => (dappsSessions ? Object.entries(dappsSessions) : []), [dappsSessions]);

  const onRemoveClick = useMemo(
    () => throttleAsyncCalls((origin: string | null) => removeDAppSession(origin)),
    [removeDAppSession]
  );

  const onRemoveAllClick = useCallback(() => onRemoveClick(null), [onRemoveClick]);

  if (!dapps.length)
    return (
      <div className="flex-grow flex flex-col justify-center">
        <EmptyState className="self-center" forSearch={false} text="No connections" />
      </div>
    );

  return (
    <>
      <ScrollView className="gap-y-6 px-4 py-6">
        <Section title="Current connection">{null}</Section>

        <Section title="Connected Dapps">
          <div className="flex flex-col gap-y-3">
            {dapps.map(([origin, dapp]) => {
              return (
                <div key={dapp.appMeta.name} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-bottom">
                  <DAppLogo origin={origin} size={40} className="p-[2px] rounded-full" />

                  <div className="flex-grow text-font-medium">{dapp.appMeta.name}</div>

                  <Button className="p-1" onClick={() => onRemoveClick(origin)}>
                    <IconBase Icon={UnlinkSvg} size={16} className="text-primary" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Section>
      </ScrollView>

      <ActionsButtonsBox className="sticky left-0 bottom-0" bgSet={false}>
        <StyledButton className="flex-1" size="L" color="red-low" onClick={onRemoveAllClick}>
          Disconnect All
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
});

const Section: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="flex flex-col">
    <span className="mb-3 text-font-description text-grey-1">{title}</span>

    {children}
  </div>
);
