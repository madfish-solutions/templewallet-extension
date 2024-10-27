import React, { FC, memo, useMemo } from 'react';

import clsx from 'clsx';

import DAppLogo from 'app/atoms/DAppLogo';
import { EmptyState } from 'app/atoms/EmptyState';
import { useStoredTezosDappsSessions } from 'app/storage/dapps/use-value.hook';
import { useTempleClient } from 'lib/temple/front';

export const DAppsSettings = memo(() => {
  const { removeDAppSession } = useTempleClient();

  const [dappsSessions] = useStoredTezosDappsSessions();

  const dapps = useMemo(() => (dappsSessions ? Object.entries(dappsSessions) : []), [dappsSessions]);

  const className = 'flex-grow flex flex-col gap-y-6 pt-2';

  if (!dapps.length)
    return (
      <div className={clsx(className, 'justify-center')}>
        <EmptyState className="self-center" forSearch={false} text="No connections" />
      </div>
    );

  return (
    <div className={className}>
      <Section title="Current connection">{null}</Section>

      <Section title="Connected Dapps">
        <div className="flex flex-col gap-y-3">
          {dapps.map(([origin, dapp]) => {
            return (
              <div key={dapp.appMeta.name} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-bottom">
                <DAppLogo origin={origin} size={40} className="p-[2px] rounded-full" />

                <span className="text-font-medium">{dapp.appMeta.name}</span>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
});

const Section: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="flex flex-col">
    <span className="mb-3 text-font-description text-grey-1">{title}</span>

    {children}
  </div>
);
