import { useCallback, useMemo } from 'react';

import { useStoredTezosDappsSessions } from 'app/storage/dapps/use-value.hook';
import { useTempleClient } from 'lib/temple/front';
import { throttleAsyncCalls } from 'lib/utils/functions';
import { useAccountAddressForTezos } from 'temple/front';

import { useActiveTabUrlOrigin } from './use-active-tab';

export function useDAppsConnections() {
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

  const disconnectDApps = useMemo(
    () => throttleAsyncCalls((origins: string[]) => removeDAppSession(origins)),
    [removeDAppSession]
  );

  const disconnectOne = useCallback((origin: string) => disconnectDApps([origin]), [disconnectDApps]);

  return { dapps, activeDApp, disconnectDApps, disconnectOne };
}
