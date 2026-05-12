import { FC } from 'react';

import { useSelectedChainsState } from 'app/hooks/use-collectibles-view-state';
import { NetworkChipChain, NetworkChips as NetworkChipsTemplate } from 'app/templates/network-chips';
import { AccountCollectible } from 'lib/assets/hooks/collectibles';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

interface NetworkChipsProps {
  enabledCollectibles: AccountCollectible[];
}

export const NetworkChips: FC<NetworkChipsProps> = ({ enabledCollectibles }) => {
  const { selectedChains, setSelectedChains } = useSelectedChainsState();

  const chipsProps = useMemoWithCompare(
    () =>
      Array.from(
        enabledCollectibles
          .reduce<Map<string | number, number>>((acc, { chainId, status }) => {
            if (status !== 'disabled' && status !== 'removed') {
              acc.set(chainId, (acc.get(chainId) ?? 0) + 1);
            }

            return acc;
          }, new Map<string | number, number>())
          .entries()
      )
        .filter(([, amount]) => amount > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([chainId, amount]): { chain: NetworkChipChain; label: ReactChildren } => ({
          chain:
            typeof chainId === 'number'
              ? { kind: TempleChainKind.EVM, chainId }
              : { kind: TempleChainKind.Tezos, chainId },
          label: amount.toString()
        })),
    [enabledCollectibles]
  );

  return (
    <NetworkChipsTemplate chips={chipsProps} selectedChains={selectedChains} setSelectedChains={setSelectedChains} />
  );
};
