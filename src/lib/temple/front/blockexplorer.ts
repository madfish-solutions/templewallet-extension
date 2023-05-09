import { useMemo } from 'react';

import { useChainId, useStorage } from 'lib/temple/front';
import { isKnownChainId, TempleChainId } from 'lib/temple/types';

type BlockExplorerId = 'tzkt' | 'tzstats' | 'bcd' | 'tezblock' | 't4l3nt';

type BaseUrls = { account?: string; transaction: string; api?: string };

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
          transaction: 'https://tzkt.io',
          api: 'https://api.tzkt.io'
        }
      ],
      [
        TempleChainId.Ghostnet,
        {
          account: 'https://ghostnet.tzkt.io',
          transaction: 'https://ghostnet.tzkt.io',
          api: 'https://api.ghostnet.tzkt.io'
        }
      ],
      [
        TempleChainId.Jakartanet,
        {
          account: 'https://jakartanet.tzkt.io',
          transaction: 'https://jakartanet.tzkt.io'
        }
      ],
      [
        TempleChainId.Limanet,
        {
          account: 'https://limanet.tzkt.io',
          transaction: 'https://limanet.tzkt.io',
          api: 'https://api.limanet.tzkt.io'
        }
      ],
      [
        TempleChainId.Mumbainet,
        {
          account: 'https://mumbainet.tzkt.io',
          transaction: 'https://mumbainet.tzkt.io',
          api: 'https://api.mumbainet.tzkt.io'
        }
      ]
    ])
  },
  {
    id: 't4l3nt',
    name: 'T4L3NT',
    baseUrls: new Map([
      [
        TempleChainId.Dcp,
        {
          account: 'https://explorer.tlnt.net',
          transaction: 'https://explorer.tlnt.net',
          api: 'https://explorer-api.tlnt.net'
        }
      ],
      [
        TempleChainId.DcpTest,
        {
          account: 'https://explorer.tlnt.net:444',
          transaction: 'https://explorer.tlnt.net:444'
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

export function useExplorerBaseUrls(): Partial<BaseUrls> {
  const chainId = useChainId();
  const { explorer } = useBlockExplorer();

  if (chainId && isKnownChainId(chainId)) {
    return explorer.baseUrls.get(chainId) ?? {};
  }
  return {};
}
