import { useCallback, useMemo } from 'react';

import { useStorage } from 'lib/temple/front';
import { TempleTezosChainId } from 'lib/temple/types';
import { EMPTY_FROZEN_OBJ, isTruthy } from 'lib/utils';

type TezosBlockExplorerKnownId = 'tzkt' | 'tzstats' | 'bcd' | 't4l3nt';

export function useTezosBlockExplorerUrl(chainId: string) {
  const [explorersStored] = useStoredTezosBlockExplorers();

  return useMemo(() => {
    const knownId = getTezosExplorerKnownId(explorersStored, chainId);

    return knownId ? TEZOS_BLOCK_EXPLORERS[knownId]?.baseUrls[chainId] : undefined;
  }, [explorersStored, chainId]);
}

export function useExplorerHref(chainId: string, hash: string) {
  const baseUrl = useTezosBlockExplorerUrl(chainId);

  return useMemo(() => {
    return baseUrl ? new URL(hash, baseUrl).href : null;
  }, [baseUrl, hash]);
}

export interface TezosBlockExplorer {
  id: TezosBlockExplorerKnownId;
  name: string;
  baseUrl: string;
}

export function useTezosBlockExplorersListingLogic(chainId: string) {
  const [explorersStored, setExplorers] = useStoredTezosBlockExplorers();

  const knownOptions = useMemo(
    () =>
      Object.values(TEZOS_BLOCK_EXPLORERS)
        .map(({ id, name, baseUrls }) => {
          const baseUrl = baseUrls[chainId];

          return baseUrl ? { id, name, baseUrl } : null;
        })
        .filter(isTruthy),
    [chainId]
  );

  const currentKnownId = getTezosExplorerKnownId(explorersStored, chainId);

  const setExplorerById = useCallback(
    (knownId: TezosBlockExplorerKnownId) => {
      setExplorers({ ...explorersStored, [chainId]: knownId });
    },
    [explorersStored, chainId, setExplorers]
  );

  return { knownOptions, currentKnownId, setExplorerById };
}

interface KnownTezosBlockExplorer<ID = TezosBlockExplorerKnownId> {
  id: ID;
  name: string;
  baseUrls: StringRecord;
}

const TEZOS_BLOCK_EXPLORERS: {
  [K in TezosBlockExplorerKnownId]: KnownTezosBlockExplorer<K>;
} = {
  tzkt: {
    id: 'tzkt',
    name: 'TzKT',
    baseUrls: {
      [TempleTezosChainId.Mainnet]: 'https://tzkt.io',
      [TempleTezosChainId.Ghostnet]: 'https://ghostnet.tzkt.io',
      [TempleTezosChainId.Mumbai]: 'https://mumbainet.tzkt.io',
      [TempleTezosChainId.Nairobi]: 'https://nairobinet.tzkt.io'
    }
  },
  t4l3nt: {
    id: 't4l3nt',
    name: 'T4L3NT',
    baseUrls: {
      [TempleTezosChainId.Dcp]: 'https://explorer.tlnt.net',
      [TempleTezosChainId.DcpTest]: 'https://explorer.test.tlnt.net'
    }
  },
  tzstats: {
    id: 'tzstats',
    name: 'TzStats',
    baseUrls: {
      [TempleTezosChainId.Mainnet]: 'https://tzstats.com'
    }
  },
  bcd: {
    id: 'bcd',
    name: 'Better Call Dev',
    baseUrls: {
      [TempleTezosChainId.Mainnet]: 'https://better-call.dev/mainnet/opg'
    }
  }
};

const DEFAULT_TEZOS_BLOCK_EXPLORERS: StringRecord<TezosBlockExplorerKnownId> = {
  [TempleTezosChainId.Mainnet]: 'tzkt',
  [TempleTezosChainId.Ghostnet]: 'tzkt',
  [TempleTezosChainId.Mumbai]: 'tzkt',
  [TempleTezosChainId.Nairobi]: 'tzkt',
  [TempleTezosChainId.Dcp]: 't4l3nt',
  [TempleTezosChainId.DcpTest]: 't4l3nt'
};

const useStoredTezosBlockExplorers = () =>
  useStorage<OptionalRecord<TezosBlockExplorerKnownId>>('TEZOS_BLOCK_EXPLORERS', EMPTY_FROZEN_OBJ);

function getTezosExplorerKnownId(
  explorers: OptionalRecord<TezosBlockExplorerKnownId>,
  chainId: string
): TezosBlockExplorerKnownId | undefined {
  return explorers[chainId] || DEFAULT_TEZOS_BLOCK_EXPLORERS[chainId];
}
