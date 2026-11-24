import { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';

import { dispatch } from 'app/store';
import { appendEvmChainCollectiblesInventoryAction } from 'app/store/evm/collectibles-inventory/actions';
import { tokenIdKey } from 'app/store/evm/collectibles-inventory/ownership';
import { isAbortError } from 'lib/apis/utils';
import { fromAssetSlug } from 'lib/assets/utils';
import { readContractNftOwnership } from 'lib/evm/on-chain/nft-ownership';
import { getEvmChainsActiveRpcUrls } from 'temple/evm/evm-chains-rpc-urls';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

interface OwnedNftBalanceInput {
  chainId: number;
  account: HexString;
  assetSlug: string;
  /** Amount already stored. The chain is read only when this is missing. */
  knownBalance?: BigNumber.Value | string;
  /** Slug of the loaded token, so the quantity can be kept on it. */
  storedSlug?: string;
  enabled: boolean;
  /** Omitted outside the gallery. Off-screen tiles share `OFFSCREEN_PREFETCH_LIMIT`. */
  presence?: 'visible' | 'offscreen' | 'pending';
}

/** Chain reads in flight for missing NFT balances. */
const BALANCE_READ_CONCURRENCY = 3;
/** Off-screen tiles that may read the chain. The rest wait until they scroll into view. */
const OFFSCREEN_PREFETCH_LIMIT = 4;

let balanceReadsInFlight = 0;
let offscreenPrefetchStarted = 0;
const balanceReadQueue: Array<() => void> = [];

const finishBalanceRead = () => {
  balanceReadsInFlight -= 1;
  const next = balanceReadQueue.shift();
  if (next) next();
};

const runBalanceRead = (task: () => Promise<void>) => {
  let queued = false;
  const start = () => {
    queued = false;
    balanceReadsInFlight += 1;
    void task().finally(finishBalanceRead);
  };

  if (balanceReadsInFlight < BALANCE_READ_CONCURRENCY) start();
  else {
    queued = true;
    balanceReadQueue.push(start);
  }

  return () => {
    if (!queued) return;

    const index = balanceReadQueue.indexOf(start);
    if (index >= 0) balanceReadQueue.splice(index, 1);
    queued = false;
  };
};

/**
 * Quantity of one owned NFT. Uses a stored balance when there is one.
 * Otherwise reads the contract: ERC-1155 balance, or 1 when ERC-721 `ownerOf` matches the account.
 */
export const useOwnedNftBalance = ({
  chainId,
  account,
  assetSlug,
  knownBalance,
  storedSlug,
  enabled,
  presence
}: OwnedNftBalanceInput) => {
  const [balance, setBalance] = useState<string>();

  useEffect(() => {
    if (!enabled || presence === 'pending' || (knownBalance != null && knownBalance !== '')) return;

    const [contractAddress, tokenId] = fromAssetSlug<HexString>(assetSlug);
    if (!tokenId) return;

    const prefetched = presence === 'offscreen';
    if (prefetched) {
      if (offscreenPrefetchStarted >= OFFSCREEN_PREFETCH_LIMIT) return;

      offscreenPrefetchStarted += 1;
    }

    const controller = new AbortController();
    const cancelQueued = runBalanceRead(async () => {
      if (controller.signal.aborted) return;

      try {
        const active = await getEvmChainsActiveRpcUrls();
        const rpcBaseURL =
          active[chainId] ?? EVM_DEFAULT_NETWORKS.find(network => network.chainId === chainId)?.rpcBaseURL;
        if (!rpcBaseURL || controller.signal.aborted) return;

        const read = await readContractNftOwnership(
          { chainId, rpcBaseURL },
          account,
          [{ contract: contractAddress, tokenIds: [tokenId] }],
          controller.signal
        );
        const quantity = read.facts.get(contractAddress.toLowerCase())?.perTokenBalance.get(tokenIdKey(tokenId));
        if (!quantity || quantity === '0' || controller.signal.aborted) return;

        setBalance(quantity);
        if (!storedSlug) return;

        dispatch(
          appendEvmChainCollectiblesInventoryAction({
            account,
            chainId,
            loaded: [{ slug: storedSlug, contractAddress, balance: quantity }]
          })
        );
      } catch (error) {
        if (!isAbortError(error)) console.error(error);
      }
    });

    return () => {
      cancelQueued();
      controller.abort();
      if (prefetched) offscreenPrefetchStarted = Math.max(0, offscreenPrefetchStarted - 1);
    };
  }, [account, assetSlug, chainId, enabled, knownBalance, presence, storedSlug]);

  return balance;
};
