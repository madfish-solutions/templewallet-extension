import { FC } from 'react';

import { useCollectiblesSelectedChainsState } from 'app/hooks/use-assets-view-state';
import { NetworkChipChain, NetworkChips as NetworkChipsTemplate } from 'app/templates/network-chips';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

import { CollectiblesCollection } from './types';

interface NetworkChipsProps {
  collections: Array<[CollectiblesCollection, string[]]>;
}

/** One chip per chain. Its number is the sum of that chain's collection counters. */
const countsByChain = (collections: Array<[CollectiblesCollection, string[]]>) => {
  const counts = new Map<string | number, number>();

  for (const [collection, chainSlugs] of collections) {
    const count = collection.ownedCount ?? chainSlugs.length;
    if (count <= 0) continue;
    counts.set(collection.chainId, (counts.get(collection.chainId) ?? 0) + count);
  }

  return counts;
};

export const NetworkChips: FC<NetworkChipsProps> = ({ collections }) => {
  const { selectedChains, setSelectedChains } = useCollectiblesSelectedChainsState();

  const chipsProps = useMemoWithCompare(
    () =>
      Array.from(countsByChain(collections).entries())
        .sort((a, b) => b[1] - a[1])
        .map(([chainId, amount]): { chain: NetworkChipChain; label: ReactChildren } => ({
          chain:
            typeof chainId === 'number'
              ? { kind: TempleChainKind.EVM, chainId }
              : { kind: TempleChainKind.Tezos, chainId },
          label: amount.toString()
        })),
    [collections]
  );

  return (
    <NetworkChipsTemplate
      chips={chipsProps}
      layoutScope="nfts"
      selectedChains={selectedChains}
      setSelectedChains={setSelectedChains}
    />
  );
};
