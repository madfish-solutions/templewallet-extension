import { FC } from 'react';

import { useCollectiblesSelectedChainsState } from 'app/hooks/use-assets-view-state';
import { NetworkChipChain, NetworkChips as NetworkChipsTemplate } from 'app/templates/network-chips';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

interface NetworkChipsProps {
  /** NFT count per chain, in the order the chains first appear. */
  counts: Array<[string | number, number]>;
}

export const NetworkChips: FC<NetworkChipsProps> = ({ counts }) => {
  const { selectedChains, setSelectedChains } = useCollectiblesSelectedChainsState();

  const chipsProps = useMemoWithCompare(
    () =>
      counts
        .toSorted((a, b) => b[1] - a[1])
        .map(([chainId, amount]): { chain: NetworkChipChain; label: ReactChildren } => ({
          chain:
            typeof chainId === 'number'
              ? { kind: TempleChainKind.EVM, chainId }
              : { kind: TempleChainKind.Tezos, chainId },
          label: amount.toString()
        })),
    [counts]
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
