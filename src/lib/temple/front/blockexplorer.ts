import { useMemo } from 'react';

import { isKnownChainId, TempleChainId, useChainId, useStorage } from 'lib/temple/front';

export type BlockExplorerId = 'tzkt' | 'tzstats' | 'bcd' | 'tezblock';

type BaseUrls = { account?: string; transaction: string };

export type BlockExplorer = {
  id: BlockExplorerId;
  name: string;
  baseUrls: Map<TempleChainId, BaseUrls>;
};

export const BLOCK_EXPLORERS: BlockExplorer[] = [
  {
    id: 'tzkt',
    name: 'TzKT',
    baseUrls: new Map([
      [
        TempleChainId.Mainnet,
        {
          account: 'https://tzkt.io',
          transaction: 'https://tzkt.io'
        }
      ],
      [
        TempleChainId.Granadanet,
        {
          account: 'https://granadanet.tzkt.io',
          transaction: 'https://granadanet.tzkt.io'
        }
      ],
      [
        TempleChainId.Hangzhounet,
        {
          account: 'https://hangzhou2net.tzkt.io',
          transaction: 'https://hangzhou2net.tzkt.io'
        }
      ]
    ])
  },
  {
    id: 'tzstats',
    name: 'TzStats',
    baseUrls: new Map([
      [
        TempleChainId.Mainnet,
        {
          account: 'https://tzstats.com',
          transaction: 'https://tzstats.com'
        }
      ]
    ])
  },
  {
    id: 'bcd',
    name: 'Better Call Dev',
    baseUrls: new Map([
      [
        TempleChainId.Mainnet,
        {
          transaction: 'https://better-call.dev/mainnet/opg'
        }
      ],
      [
        TempleChainId.Granadanet,
        {
          transaction: 'https://better-call.dev/granadanet/opg'
        }
      ]
    ])
  },
  {
    id: 'tezblock',
    name: 'tezblock',
    baseUrls: new Map([
      [
        TempleChainId.Mainnet,
        {
          account: 'https://tezblock.io/account',
          transaction: 'https://tezblock.io/transaction'
        }
      ]
    ])
  }
];

const BLOCK_EXPLORER_STORAGE_KEY = 'block_explorer';

export function useBlockExplorer() {
  const [explorerId, setExplorerId] = useStorage<BlockExplorerId>(BLOCK_EXPLORER_STORAGE_KEY, 'tzkt');
  const explorer = useMemo(() => BLOCK_EXPLORERS.find(({ id }) => id === explorerId)!, [explorerId]);
  return {
    explorer,
    setExplorerId
  };
}

export function useExplorerBaseUrls() {
  const chainId = useChainId();
  const { explorer } = useBlockExplorer();
  return useMemo<Partial<BaseUrls>>(() => {
    if (chainId && isKnownChainId(chainId)) {
      const fallbackBaseUrls =
        BLOCK_EXPLORERS.find(explorer => explorer.baseUrls.get(chainId))?.baseUrls.get(chainId) ?? {};
      return explorer.baseUrls.get(chainId) ?? fallbackBaseUrls;
    }
    return {};
  }, [chainId, explorer]);
}
