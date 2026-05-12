import { Dispatch, FC, SetStateAction, startTransition, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { omit, throttle } from 'lodash';

import { Button, IconBase } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as ChevronDownIcon } from 'app/icons/base/chevron_down.svg';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { useBooleanState } from 'lib/ui/hooks';
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';
import { EvmChain, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export type NetworkChipChain = Pick<EvmChain, 'chainId' | 'kind'> | Pick<TezosChain, 'chainId' | 'kind'>;

interface NetworkChipsProps {
  chips: Pick<NetworkChipProps, 'label' | 'chain'>[];
  selectedChains: Array<string | number>;
  setSelectedChains: Dispatch<SetStateAction<Array<string | number>>>;
}

export const NetworkChips: FC<NetworkChipsProps> = ({ chips, selectedChains, setSelectedChains }) => {
  const [collapsed, , expand] = useBooleanState(true);
  const allElementsHiddenWrapperRef = useRef<HTMLDivElement>(null);
  const allElementsHiddenRef = useRef<HTMLDivElement>(null);
  const fitIterationSandboxWrapperRef = useRef<HTMLDivElement>(null);
  const fitIterationSandboxRef = useRef<HTMLDivElement>(null);
  const [displayedChips, setDisplayedChips] = useState<Omit<NetworkChipProps, 'onClick'>[]>(EMPTY_FROZEN_ARRAY);
  const [showMoreCount, setShowMoreCount] = useState(0);
  const [fitIterationChips, setFitIterationChips] = useState<Omit<NetworkChipProps, 'onClick'>[]>(EMPTY_FROZEN_ARRAY);
  const prevFitIterationChipsRef = useRef(fitIterationChips);

  const handleChainClick = (chainId: string | number) =>
    setSelectedChains(prev => (prev.includes(chainId) ? prev.filter(id => id !== chainId) : prev.concat(chainId)));

  const selectedChainsMap = new Map<string | number, boolean>(selectedChains.map(chainId => [chainId, true]));
  const chipsPropsWithState = chips.map(({ chain, label }) => ({
    chain,
    label,
    isSelected: selectedChainsMap.get(chain.chainId) ?? false
  }));

  const startLayoutUpdate = () =>
    startTransition(() => {
      if (!collapsed) {
        setDisplayedChips(chipsPropsWithState);
        setShowMoreCount(0);

        return;
      }

      if (!allElementsHiddenRef.current || !allElementsHiddenWrapperRef.current) return;

      if (chipsPropsWithState.length < 2) {
        setDisplayedChips(chipsPropsWithState);
        setShowMoreCount(0);

        return;
      }

      const { right: containerRight, width: containerWidth } =
        allElementsHiddenWrapperRef.current.getBoundingClientRect();
      const children = Array.from(allElementsHiddenRef.current.children);
      const chipsNodes = children.slice(0, -1);
      const showMoreNode = children.at(-1)!;

      const { right: lastChipNodeRight } = chipsNodes.at(-1)!.getBoundingClientRect();

      if (lastChipNodeRight <= containerRight) {
        setDisplayedChips(chipsPropsWithState);
        setShowMoreCount(0);

        return;
      }

      const { width: showMoreNodeWidth } = showMoreNode.getBoundingClientRect();
      const [firstChipNode, secondChipNode] = chipsNodes;
      const { right: firstChipNodeRight } = firstChipNode.getBoundingClientRect();
      const { left: secondChipNodeLeft } = secondChipNode.getBoundingClientRect();
      const gap = secondChipNodeLeft - firstChipNodeRight;
      const chipsPropsWithIndexes = chipsPropsWithState.map((chip, index) => ({ ...chip, index }));
      const selectedChipsPropsWithIndexes = chipsPropsWithIndexes.filter(({ isSelected }) => isSelected);
      const unselectedChipsPropsWithIndexes = chipsPropsWithIndexes.filter(({ isSelected }) => !isSelected);
      const newFitIterationChipsWithIndexes: typeof selectedChipsPropsWithIndexes = [];

      const prepareFitIteration = () =>
        setFitIterationChips(
          newFitIterationChipsWithIndexes.sort((a, b) => a.index - b.index).map(props => omit(props, 'index'))
        );

      if (selectedChipsPropsWithIndexes.length > 0) {
        newFitIterationChipsWithIndexes.push(selectedChipsPropsWithIndexes[0]);
      }

      let totalWidth = selectedChipsPropsWithIndexes[0]
        ? chipsNodes[selectedChipsPropsWithIndexes[0].index].getBoundingClientRect().width + gap + showMoreNodeWidth
        : showMoreNodeWidth;
      for (let i = 1; i < selectedChipsPropsWithIndexes.length; i++) {
        const { width: chipNodeWidth } = chipsNodes[selectedChipsPropsWithIndexes[i].index].getBoundingClientRect();
        totalWidth += chipNodeWidth + gap;
        if (totalWidth > containerWidth) {
          prepareFitIteration();

          return;
        }

        newFitIterationChipsWithIndexes.push(selectedChipsPropsWithIndexes[i]);
      }
      for (const unselectedChipPropsWithIndex of unselectedChipsPropsWithIndexes) {
        const { width: chipNodeWidth } = chipsNodes[unselectedChipPropsWithIndex.index].getBoundingClientRect();
        totalWidth += chipNodeWidth + gap;
        if (totalWidth > containerWidth && newFitIterationChipsWithIndexes.length > 0) {
          prepareFitIteration();

          return;
        }

        newFitIterationChipsWithIndexes.push(unselectedChipPropsWithIndex);
      }
      prepareFitIteration();
    });

  useEffect(() => {
    startLayoutUpdate();
  }, [startLayoutUpdate]);

  useEffect(() => {
    const resizeListener = throttle(() => startLayoutUpdate(), 100);
    window.addEventListener('resize', resizeListener);

    return () => {
      window.removeEventListener('resize', resizeListener);
      resizeListener.cancel();
    };
  }, [startLayoutUpdate]);

  useEffect(() => {
    if (fitIterationChips === prevFitIterationChipsRef.current) return;

    prevFitIterationChipsRef.current = fitIterationChips;
    const fitIterationChipsCount = fitIterationChips.length;

    if (fitIterationChipsCount === 0 || !fitIterationSandboxRef.current || !fitIterationSandboxWrapperRef.current)
      return;

    const { right: sandboxRight } = fitIterationSandboxWrapperRef.current.getBoundingClientRect();
    const { right: showMoreNodeRight } = Array.from(fitIterationSandboxRef.current.children)
      .at(-1)!
      .getBoundingClientRect();

    if (showMoreNodeRight <= sandboxRight || fitIterationChipsCount === 1) {
      setDisplayedChips(fitIterationChips);
      setShowMoreCount(chipsPropsWithState.length - fitIterationChipsCount);
    } else {
      setFitIterationChips(fitIterationChips.slice(0, fitIterationChipsCount - 1));
    }
  }, [fitIterationChips, chipsPropsWithState]);

  return (
    <div className="flex flex-col" dir="ltr">
      <div className="relative h-0 overflow-x-scroll overflow-y-hidden" ref={allElementsHiddenWrapperRef}>
        <div className="inline-flex gap-2 items-center w-max" ref={allElementsHiddenRef}>
          {chips.map(chip => (
            <NetworkChip
              key={chip.chain.chainId}
              isSelected={selectedChains.includes(chip.chain.chainId)}
              onClick={handleChainClick}
              {...chip}
            />
          ))}
          <Button
            className={clsx(
              'flex items-center absolute top-0 right-0',
              'h-6 px-1 py-0.5 text-font-description-bold text-grey-1 hover:bg-grey-4 rounded'
            )}
          >
            <span>+{chips.length} more</span>
            <IconBase className="text-grey-3" Icon={ChevronDownIcon} size={12} />
          </Button>
        </div>
      </div>

      <div className="relative h-0 overflow-x-scroll overflow-y-hidden" ref={fitIterationSandboxWrapperRef}>
        <div className="inline-flex gap-2 items-center w-max" ref={fitIterationSandboxRef}>
          {fitIterationChips.map(chip => (
            <NetworkChip key={chip.chain.chainId} onClick={handleChainClick} {...chip} />
          ))}
          <Button className="flex items-center h-6 px-1 py-0.5 text-font-description-bold text-grey-1 hover:bg-grey-4 rounded">
            <span>+{chips.length} more</span>
            <IconBase className="text-grey-3" Icon={ChevronDownIcon} size={12} />
          </Button>
        </div>
      </div>

      <div className="inline-flex flex-wrap gap-2 items-center">
        {displayedChips.map(({ chain, ...restProps }) => (
          <NetworkChip key={chain.chainId} chain={chain} onClick={handleChainClick} {...restProps} />
        ))}
        {showMoreCount > 0 && (
          <Button
            className="flex items-center h-6 px-1 py-0.5 text-font-description-bold text-grey-1 hover:bg-grey-4 rounded"
            onClick={expand}
          >
            <span>+{showMoreCount} more</span>
            <IconBase className="text-grey-3" Icon={ChevronDownIcon} size={12} />
          </Button>
        )}
      </div>
    </div>
  );
};

interface NetworkChipProps {
  label: ReactChildren;
  chain: NetworkChipChain;
  isSelected: boolean;
  onClick: SyncFn<string | number>;
}

const NetworkChip: FC<NetworkChipProps> = ({ label, chain, isSelected, onClick }) => (
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
    {label}
    {isSelected && <IconBase Icon={XCircleFillIcon} size={12} />}
  </Button>
);
