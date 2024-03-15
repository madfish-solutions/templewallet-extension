import { useMemo } from 'react';

import { isKnownChainId, TempleTezosChainId } from 'lib/temple/types';
import { useTezosNetwork } from 'temple/front';

import { useStorage } from './storage';

type BlockExplorerId = 'tzkt' | 'tzstats' | 'bcd' | 't4l3nt';

interface BaseUrls {
  account?: string;
  transaction: string;
  api?: string;
}

export type BlockExplorer = {
  id: BlockExplorerId;
  name: string;
  baseUrls: Map<TempleTezosChainId, BaseUrls>;
};

export const BLOCK_EXPLORERS: BlockExplorer[] = [
  {
    id: 'tzkt',
    name: 'TzKT',
    baseUrls: new Map([
      [
        TempleTezosChainId.Mainnet,
        {
          account: 'https://tzkt.io',
          transaction: 'https://tzkt.io',
          api: 'https://api.tzkt.io'
        }
      ],
      [
        TempleTezosChainId.Ghostnet,
        {
          account: 'https://ghostnet.tzkt.io',
          transaction: 'https://ghostnet.tzkt.io',
          api: 'https://api.ghostnet.tzkt.io'
        }
      ],
      [
        TempleTezosChainId.Mumbai,
        {
          account: 'https://mumbainet.tzkt.io',
          transaction: 'https://mumbainet.tzkt.io',
          api: 'https://api.mumbainet.tzkt.io'
        }
      ],
      [
        TempleTezosChainId.Nairobi,
        {
          account: 'https://nairobinet.tzkt.io',
          transaction: 'https://nairobinet.tzkt.io',
          api: 'https://api.nairobinet.tzkt.io'
        }
      ]
    ])
  },
  {
    id: 't4l3nt',
    name: 'T4L3NT',
    baseUrls: new Map([
      [
        TempleTezosChainId.Dcp,
        {
          account: 'https://explorer.tlnt.net',
          transaction: 'https://explorer.tlnt.net',
          api: 'https://explorer-api.tlnt.net'
        }
      ],
      [
        TempleTezosChainId.DcpTest,
        {
          account: 'https://explorer.test.tlnt.net',
          transaction: 'https://explorer.test.tlnt.net',
          api: 'https://explorer-api.test.tlnt.net'
        }
      ]
    ])
  },
  {
    id: 'tzstats',
    name: 'TzStats',
    baseUrls: new Map([
      [
        TempleTezosChainId.Mainnet,
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
        TempleTezosChainId.Mainnet,
        {
          transaction: 'https://better-call.dev/mainnet/opg'
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

export function useExplorerBaseUrls(): Partial<BaseUrls> {
  const { chainId } = useTezosNetwork();
  const { explorer } = useBlockExplorer();

  return useMemo(() => {
    if (chainId && isKnownChainId(chainId)) {
      return explorer.baseUrls.get(chainId) ?? {};
    }

    return {};
  }, [chainId, explorer]);
}
