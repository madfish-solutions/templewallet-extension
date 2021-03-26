import { useMemo } from "react";

import {
  isKnownChainId,
  TempleChainId,
  useChainId,
  useStorage,
} from "lib/temple/front";

export type BlockExplorerId = "tzkt" | "tzstats" | "bcd" | "tezblock";

type BaseUrls = { account?: string; transaction: string };

export type BlockExplorer = {
  id: BlockExplorerId;
  name: string;
  baseUrls: Map<TempleChainId, BaseUrls>;
};

export const BLOCK_EXPLORERS: BlockExplorer[] = [
  {
    id: "tzkt",
    name: "TzKT",
    baseUrls: new Map([
      [
        TempleChainId.Mainnet,
        {
          account: "https://tzkt.io",
          transaction: "https://tzkt.io",
        },
      ],
      [
        TempleChainId.Delphinet,
        {
          account: "https://delphinet.tzkt.io",
          transaction: "https://delphinet.tzkt.io",
        },
      ],
      [
        TempleChainId.Edo2net,
        {
          account: "https://edo2net.tzkt.io",
          transaction: "https://edo2net.tzkt.io",
        },
      ],
      [
        TempleChainId.Florencenet,
        {
          account: "https://florencenet.tzkt.io",
          transaction: "https://florencenet.tzkt.io",
        },
      ],
    ]),
  },
  {
    id: "tzstats",
    name: "TzStats",
    baseUrls: new Map([
      [
        TempleChainId.Mainnet,
        {
          account: "https://tzstats.com",
          transaction: "https://tzstats.com",
        },
      ],
      [
        TempleChainId.Delphinet,
        {
          account: "https://delphi.tzstats.com",
          transaction: "https://delphi.tzstats.com",
        },
      ],
      [
        TempleChainId.Edo2net,
        {
          account: "https://edo.tzstats.com",
          transaction: "https://edo.tzstats.com",
        },
      ],
      [
        TempleChainId.Florencenet,
        {
          account: "https://florence.tzstats.com",
          transaction: "https://florence.tzstats.com",
        },
      ],
    ]),
  },
  {
    id: "bcd",
    name: "Better Call Dev",
    baseUrls: new Map([
      [
        TempleChainId.Mainnet,
        {
          transaction: "https://better-call.dev/mainnet/opg",
        },
      ],
      [
        TempleChainId.Delphinet,
        {
          transaction: "https://better-call.dev/delphinet/opg",
        },
      ],
      [
        TempleChainId.Edo2net,
        {
          transaction: "https://better-call.dev/edo2net/opg",
        },
      ],
      [
        TempleChainId.Florencenet,
        {
          transaction: "https://better-call.dev/florencenet/opg",
        },
      ],
    ]),
  },
  {
    id: "tezblock",
    name: "tezblock",
    baseUrls: new Map([
      [
        TempleChainId.Mainnet,
        {
          account: "http://tezblock.io/account",
          transaction: "http://tezblock.io/transaction",
        },
      ],
      [
        TempleChainId.Delphinet,
        {
          account: "http://delphinet.tezblock.io/account",
          transaction: "http://delphinet.tezblock.io/transaction",
        },
      ],
    ]),
  },
];

const BLOCK_EXPLORER_STORAGE_KEY = "block_explorer";

export function useBlockExplorer() {
  const [explorerId, setExplorerId] = useStorage<BlockExplorerId>(
    BLOCK_EXPLORER_STORAGE_KEY,
    "tzkt"
  );
  const explorer = useMemo(
    () => BLOCK_EXPLORERS.find(({ id }) => id === explorerId)!,
    [explorerId]
  );
  return {
    explorer,
    setExplorerId,
  };
}

export function useExplorerBaseUrls() {
  const chainId = useChainId();
  const { explorer } = useBlockExplorer();
  return useMemo<Partial<BaseUrls>>(() => {
    if (chainId && isKnownChainId(chainId)) {
      const fallbackBaseUrls =
        BLOCK_EXPLORERS.find((explorer) =>
          explorer.baseUrls.get(chainId)
        )?.baseUrls.get(chainId) ?? {};
      return explorer.baseUrls.get(chainId) ?? fallbackBaseUrls;
    }
    return {};
  }, [chainId, explorer]);
}
