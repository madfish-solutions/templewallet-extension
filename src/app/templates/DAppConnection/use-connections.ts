import { useCallback, useMemo } from 'react';

import { DAppSession, DAppsSessionsRecord } from 'app/storage/dapps';
import { useStoredEvmDappsSessions, useStoredTezosDappsSessions } from 'app/storage/dapps/use-value.hook';
import { useTempleClient } from 'lib/temple/front';
import { throttleAsyncCalls } from 'lib/utils/functions';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useActiveTabUrlOrigin } from './use-active-tab';

function getDAppsByAddress<T extends TempleChainKind>(sessions: DAppsSessionsRecord<T> | nullish, address?: string) {
  const entries = Object.entries(sessions || {});

  return address ? entries.filter(([, ds]) => ds.pkh === address) : entries;
}

function getDAppByOrigin<T extends TempleChainKind>(
  sessions: DAppsSessionsRecord<T> | nullish,
  origin: string | nullish
) {
  return Object.entries(sessions || {}).find(([o]) => o === origin);
}

export function useDAppsConnections() {
  const { removeDAppSession, switchDAppEvmChain } = useTempleClient();

  const tezAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();
  const [tezosDappsSessions] = useStoredTezosDappsSessions();
  const [evmDappsSessions] = useStoredEvmDappsSessions();

  const dapps = useMemo(() => {
    const tezosDApps: [string, DAppSession][] = getDAppsByAddress(tezosDappsSessions, tezAddress);

    return tezosDApps.concat(getDAppsByAddress(evmDappsSessions, evmAddress));
  }, [evmAddress, evmDappsSessions, tezAddress, tezosDappsSessions]);

  const activeTabOrigin = useActiveTabUrlOrigin();

  const currentTabDApp = useMemo(
    () => getDAppByOrigin(tezosDappsSessions, activeTabOrigin) || getDAppByOrigin(evmDappsSessions, activeTabOrigin),
    [activeTabOrigin, evmDappsSessions, tezosDappsSessions]
  );

  const activeDApp = useMemo(
    () => (activeTabOrigin ? dapps.find(([origin]) => origin === activeTabOrigin) : null),
    [dapps, activeTabOrigin]
  );

  const disconnectDApps = useMemo(
    () => throttleAsyncCalls((origins: string[]) => removeDAppSession(origins)),
    [removeDAppSession]
  );

  const disconnectOne = useCallback((origin: string) => disconnectDApps([origin]), [disconnectDApps]);

  return { dapps, activeDApp, currentTabDApp, disconnectDApps, disconnectOne, switchDAppEvmChain };
}
