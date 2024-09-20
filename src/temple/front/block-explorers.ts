import { useCallback, useMemo } from 'react';

import { nanoid } from 'nanoid';

import { BLOCKCHAIN_EXPLORERS_OVERRIDES_STORAGE_KEY } from 'lib/constants';
import { useStorage } from 'lib/temple/front/storage';
import { TempleTezosChainId } from 'lib/temple/types';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';
import { TempleChainKind } from 'temple/types';

import { useChainSpecs } from './chains-specs';

export interface BlockExplorer {
  name: string;
  url: string;
  id: string;
}

const FALLBACK_CHAIN_BLOCK_EXPLORERS: BlockExplorer[] = [];

export type BlockExplorerEntityType = 'address' | 'tx';

const useBlockExplorersOverrides = () =>
  useStorage<Partial<Record<TempleChainKind, OptionalRecord<BlockExplorer[]> | undefined>>>(
    BLOCKCHAIN_EXPLORERS_OVERRIDES_STORAGE_KEY,
    EMPTY_FROZEN_OBJ
  );

export function useBlockExplorers() {
  const [blockExplorersOverrides, setBlockExplorersOverrides] = useBlockExplorersOverrides();
  const allBlockExplorers = useMemo(
    () => ({
      [TempleChainKind.Tezos]: {
        ...DEFAULT_BLOCK_EXPLORERS[TempleChainKind.Tezos],
        ...blockExplorersOverrides[TempleChainKind.Tezos]
      },
      [TempleChainKind.EVM]: {
        ...DEFAULT_BLOCK_EXPLORERS[TempleChainKind.EVM],
        ...blockExplorersOverrides[TempleChainKind.EVM]
      }
    }),
    [blockExplorersOverrides]
  );

  const getChainBlockExplorers = useCallback(
    (chainKind: TempleChainKind, chainId: string | number) => allBlockExplorers[chainKind]?.[chainId] ?? [],
    [allBlockExplorers]
  );
  const setChainBlockExplorers = useCallback(
    (chainKind: TempleChainKind, chainId: string | number, blockExplorers: BlockExplorer[]) => {
      const newChainKindBlockExplorers = { ...allBlockExplorers[chainKind], [chainId]: blockExplorers };

      return setBlockExplorersOverrides(prevValue => ({ ...prevValue, [chainKind]: newChainKindBlockExplorers }));
    },
    [allBlockExplorers, setBlockExplorersOverrides]
  );

  const addBlockExplorer = useCallback(
    async (chainKind: TempleChainKind, chainId: string | number, blockExplorer: Omit<BlockExplorer, 'id'>) => {
      const newChainBlockExplorers = [...getChainBlockExplorers(chainKind, chainId)];
      const newBlockExplorer = { ...blockExplorer, id: nanoid() };
      newChainBlockExplorers.push(newBlockExplorer);

      await setChainBlockExplorers(chainKind, chainId, newChainBlockExplorers);

      return newBlockExplorer;
    },
    [getChainBlockExplorers, setChainBlockExplorers]
  );

  const replaceBlockExplorer = useCallback(
    (chainKind: TempleChainKind, chainId: string | number, blockExplorer: BlockExplorer) => {
      const newChainBlockExplorers = getChainBlockExplorers(chainKind, chainId).map(be =>
        be.id === blockExplorer.id ? blockExplorer : be
      );

      return setChainBlockExplorers(chainKind, chainId, newChainBlockExplorers);
    },
    [getChainBlockExplorers, setChainBlockExplorers]
  );

  const removeBlockExplorer = useCallback(
    (chainKind: TempleChainKind, chainId: string | number, explorerId: string) => {
      const newChainBlockExplorers = getChainBlockExplorers(chainKind, chainId).filter(({ id }) => id !== explorerId);

      return setChainBlockExplorers(chainKind, chainId, newChainBlockExplorers);
    },
    [getChainBlockExplorers, setChainBlockExplorers]
  );

  return {
    allBlockExplorers,
    addBlockExplorer,
    replaceBlockExplorer,
    removeBlockExplorer
  };
}

export function useChainBlockExplorers(chainKind: TempleChainKind, chainId: string | number) {
  const {
    allBlockExplorers,
    addBlockExplorer: genericAddBlockExplorer,
    removeBlockExplorer: genericRemoveBlockExplorer,
    replaceBlockExplorer: genericReplaceBlockExplorer
  } = useBlockExplorers();
  const [{ activeBlockExplorerId }] = useChainSpecs(chainKind, chainId);

  const chainBlockExplorers =
    allBlockExplorers[chainKind]?.[chainId] ??
    DEFAULT_BLOCK_EXPLORERS[chainKind]?.[chainId] ??
    FALLBACK_CHAIN_BLOCK_EXPLORERS;

  const addBlockExplorer = useCallback(
    (blockExplorer: Omit<BlockExplorer, 'id'>) => genericAddBlockExplorer(chainKind, chainId, blockExplorer),
    [chainId, chainKind, genericAddBlockExplorer]
  );

  const replaceBlockExplorer = useCallback(
    (blockExplorer: BlockExplorer) => genericReplaceBlockExplorer(chainKind, chainId, blockExplorer),
    [chainId, chainKind, genericReplaceBlockExplorer]
  );

  const removeBlockExplorer = useCallback(
    (explorerId: string) => genericRemoveBlockExplorer(chainKind, chainId, explorerId),
    [chainId, chainKind, genericRemoveBlockExplorer]
  );

  const activeBlockExplorer = useMemo<BlockExplorer | undefined>(
    () => chainBlockExplorers.find(({ id }) => id === activeBlockExplorerId) ?? chainBlockExplorers[0],
    [activeBlockExplorerId, chainBlockExplorers]
  );

  return {
    chainBlockExplorers,
    activeBlockExplorer,
    addBlockExplorer,
    removeBlockExplorer,
    replaceBlockExplorer
  };
}

export function useBlockExplorerHref(
  chainKind: TempleChainKind,
  chainId: string | number,
  entityType: BlockExplorerEntityType,
  hash: string
) {
  const { activeBlockExplorer } = useChainBlockExplorers(chainKind, chainId);

  return useMemo(() => {
    if (!activeBlockExplorer) {
      return null;
    }

    return new URL(chainKind === TempleChainKind.Tezos ? hash : `${entityType}/${hash}`, activeBlockExplorer.url).href;
  }, [activeBlockExplorer, chainKind, entityType, hash]);
}

export const DEFAULT_BLOCK_EXPLORERS: Record<TempleChainKind, Record<string, BlockExplorer[]>> = {
  [TempleChainKind.Tezos]: {
    [TempleTezosChainId.Mainnet]: [
      {
        name: 'TzKT',
        url: 'https://tzkt.io',
        id: 'tzkt-mainnet'
      },
      {
        name: 'TzStats',
        url: 'https://tzstats.com',
        id: 'tzstats-mainnet'
      },
      {
        name: 'Better Call Dev',
        url: 'https://better-call.dev/mainnet/opg',
        id: 'bcd-mainnet'
      }
    ],
    [TempleTezosChainId.Ghostnet]: [
      {
        name: 'TzKT',
        url: 'https://ghostnet.tzkt.io',
        id: 'tzkt-ghostnet'
      }
      /* {
      name: 'TzStats',
      url: 'https://ghost.tzstats.com',
      id: 'tzstats-ghostnet'
    } */
    ],
    [TempleTezosChainId.Paris]: [
      {
        name: 'TzKT',
        url: 'https://parisnet.tzkt.io',
        id: 'tzkt-paris'
      }
    ],
    [TempleTezosChainId.Dcp]: [
      {
        name: 'T4L3NT',
        url: 'https://explorer.tlnt.net',
        id: 'tlnt-mainnet'
      }
    ],
    [TempleTezosChainId.DcpTest]: [
      {
        name: 'T4L3NT',
        url: 'https://explorer.test.tlnt.net',
        id: 'tlnt-testnet'
      }
    ]
  },
  [TempleChainKind.EVM]: {
    '1': [
      {
        name: 'Etherscan',
        url: 'https://etherscan.io',
        id: 'etherscan-mainnet'
      }
      /* {
      name: 'Blockchair',
      url: 'https://blockchair.com/ethereum',
      id: 'blockchair-mainnet'
    } */
    ],
    '137': [
      {
        name: 'PolygonScan',
        url: 'https://polygonscan.com',
        id: 'polygonscan-mainnet'
      }
    ],
    '56': [
      {
        name: 'BscScan',
        url: 'https://bscscan.com',
        id: 'bscscan-mainnet'
      }
    ],
    '43114': [
      {
        name: 'SnowTrace',
        url: 'https://snowtrace.io',
        id: 'snowtrace-mainnet'
      }
    ],
    '10': [
      {
        name: 'Optimistic Ethereum',
        url: 'https://optimistic.etherscan.io',
        id: 'optimism-mainnet'
      }
    ],
    '11155111': [
      {
        name: 'Etherscan',
        url: 'https://sepolia.etherscan.io',
        id: 'eth-sepolia'
      }
    ],
    '80002': [
      {
        name: 'PolygonScan',
        url: 'https://amoy.polygonscan.com',
        id: 'polygon-amoy'
      }
    ],
    '97': [
      {
        name: 'BscScan',
        url: 'https://testnet.bscscan.com',
        id: 'bscscan-testnet'
      }
    ],
    '43113': [
      {
        name: 'SnowTrace',
        url: 'https://testnet.snowtrace.io',
        id: 'snowtrace-testnet'
      }
    ],
    '11155420': [
      {
        name: 'Blockscout',
        url: 'https://optimism-sepolia.blockscout.com',
        id: 'optimism-sepolia'
      }
    ]
  }
};
