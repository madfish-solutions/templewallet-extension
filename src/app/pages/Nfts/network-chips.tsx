import { FC, useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { throttle } from 'lodash';

import { Button, IconBase } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { useSelectedChainsState } from 'app/hooks/use-collectibles-view-state';
import { ReactComponent as ChevronDownIcon } from 'app/icons/base/chevron_down.svg';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { AccountCollectible } from 'lib/assets/hooks/collectibles';
import { useBooleanState, useMemoWithCompare } from 'lib/ui/hooks';
import { EvmChain, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface NetworkChipsProps {
  enabledCollectibles: AccountCollectible[];
}

export const NetworkChips: FC<NetworkChipsProps> = ({ enabledCollectibles }) => {
  const { selectedChains, setSelectedChains } = useSelectedChainsState();
  const [collapsed, , expand] = useBooleanState(true);

  const collectibleCountsByChain = useMemoWithCompare(
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
        .map(([chainId, amount]): { chain: NetworkChipProps['chain']; amount: number } => ({
          chain:
            typeof chainId === 'number'
              ? { kind: TempleChainKind.EVM, chainId }
              : { kind: TempleChainKind.Tezos, chainId },
          amount
        })),
    [enabledCollectibles]
  );

  const [innerWidth, setInnerWidth] = useState(window.innerWidth);
  const visibleChipsCount = collapsed
    ? getChipsInOneLineCount(collectibleCountsByChain, innerWidth)
    : collectibleCountsByChain.length;
  const chipsToExpandCount = collectibleCountsByChain.length - visibleChipsCount;

  useEffect(
    () =>
      setSelectedChains(prevSelectedChains =>
        prevSelectedChains.filter(chainId => collectibleCountsByChain.some(({ chain }) => chain.chainId === chainId))
      ),
    [collectibleCountsByChain, setSelectedChains]
  );

  useEffect(() => {
    const resizeListener = throttle(() => setInnerWidth(window.innerWidth), 100);
    window.addEventListener('resize', resizeListener);

    return () => {
      window.removeEventListener('resize', resizeListener);
      resizeListener.cancel();
    };
  }, []);

  const handleChainClick = (chainId: string | number) =>
    setSelectedChains(prev => (prev.includes(chainId) ? prev.filter(id => id !== chainId) : prev.concat(chainId)));

  return (
    <div className="inline-flex flex-wrap gap-2 items-center">
      {collectibleCountsByChain.slice(0, visibleChipsCount).map(({ chain, amount }) => (
        <NetworkChip
          key={chain.chainId}
          amount={amount}
          chain={chain}
          isSelected={selectedChains.includes(chain.chainId)}
          onClick={handleChainClick}
        />
      ))}
      {chipsToExpandCount > 0 && (
        <Button
          className="flex items-center h-6 px-1 py-0.5 text-font-description-bold text-grey-1 hover:bg-grey-4 rounded"
          onClick={expand}
        >
          <span>+{chipsToExpandCount} more</span>
          <IconBase className="text-grey-3" Icon={ChevronDownIcon} size={12} />
        </Button>
      )}
    </div>
  );
};

interface NetworkChipProps {
  amount: number;
  chain: Pick<EvmChain, 'chainId' | 'kind'> | Pick<TezosChain, 'chainId' | 'kind'>;
  isSelected: boolean;
  onClick: SyncFn<string | number>;
}

const NetworkChip: FC<NetworkChipProps> = ({ amount, chain, isSelected, onClick }) => (
  <Button
    className={clsx(
      'flex items-center px-2 py-1 text-font-num-12 rounded-lg border-0.5',
      isSelected ? 'bg-secondary text-white pr-1.5 border-secondary' : 'bg-grey-4 hover:text-secondary border-lines'
    )}
    onClick={() => onClick(chain.chainId)}
  >
    {chain.kind === TempleChainKind.Tezos ? (
      <TezosNetworkLogo className="mr-0.5" chainId={chain.chainId} size={16} />
    ) : (
      <EvmNetworkLogo className="mr-0.5" chainId={chain.chainId} size={16} />
    )}
    <span>{amount}</span>
    {isSelected && <IconBase Icon={XCircleFillIcon} size={12} />}
  </Button>
);

const textXsDigitWidth = {
  '1': { normal: 5.14, semibold: 5.77 },
  '2': { normal: 7.05, semibold: 7.46 },
  '3': { normal: 7.22, semibold: 7.82 },
  '4': { normal: 7.45, semibold: 7.99 },
  '5': { normal: 7.13, semibold: 7.59 },
  '6': { normal: 7.24, semibold: 7.78 },
  '7': { normal: 6.16, semibold: 7.05 },
  '8': { normal: 7.63, semibold: 7.76 },
  '9': { normal: 7.12, semibold: 7.78 },
  '0': { normal: 7.63, semibold: 8.01 }
};

const getNumberRenderedWidth = (value: number, font: 'normal' | 'semibold') =>
  value
    .toString()
    .split('')
    .reduce((acc, digit) => acc + textXsDigitWidth[digit as keyof typeof textXsDigitWidth][font], 0);

/** Use this function to ensure that the collapsed view is correct even at the first render */
const getChipsInOneLineCount = (
  collectibleCountsByChain: { chain: NetworkChipProps['chain']; amount: number }[],
  innerWidth: number
) => {
  const availableWidth = Math.min(innerWidth, 384) - 32;
  let chipsTotalWidth = 0;
  const getChipWidth = (index: number) => getNumberRenderedWidth(collectibleCountsByChain[index].amount, 'normal') + 35;
  for (
    let i = 1, itemsLeft = collectibleCountsByChain.length - 1;
    i < collectibleCountsByChain.length;
    i++, itemsLeft--
  ) {
    chipsTotalWidth += getChipWidth(i - 1);
    if (i !== 1) chipsTotalWidth += 8;
    const leftButtonWithGapWidth = getNumberRenderedWidth(itemsLeft, 'semibold') + 72.42;

    if (itemsLeft === 1 && chipsTotalWidth + getChipWidth(collectibleCountsByChain.length - 1) <= availableWidth) {
      return collectibleCountsByChain.length;
    }

    if (chipsTotalWidth + leftButtonWithGapWidth > availableWidth) {
      return i - 1;
    }
  }

  return collectibleCountsByChain.length;
};
