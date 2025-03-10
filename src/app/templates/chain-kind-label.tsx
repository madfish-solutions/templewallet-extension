import React, { ReactNode, memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { EvmNetworksLogos, TezNetworkLogo } from 'app/atoms/NetworksLogos';
import { useRichFormatTooltip } from 'app/hooks/use-rich-format-tooltip';
import { UseTippyOptions } from 'lib/ui/useTippy';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

interface ChainKindLabelProps {
  chainKind: TempleChainKind;
  tooltipText: ReactNode;
  wrapperClassName?: string;
}

export const ChainKindLabel = memo<ChainKindLabelProps>(({ chainKind, tooltipText, wrapperClassName }) => {
  const isTezos = chainKind === TempleChainKind.Tezos;

  const tooltipWrapperFactory = useCallback(() => {
    const element = document.createElement('div');
    element.className = clsx('text-center', wrapperClassName);

    return element;
  }, [wrapperClassName]);
  const basicTooltipProps = useMemo<Omit<UseTippyOptions, 'content'>>(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: true,
      animation: 'shift-away-subtle',
      placement: 'bottom-start' as const,
      offset: [isTezos ? 0 : 10, 15]
    }),
    [isTezos]
  );
  const tooltipWrapperRef = useRichFormatTooltip<HTMLDivElement>(basicTooltipProps, tooltipWrapperFactory, tooltipText);

  return (
    <div className="flex gap-x-2">
      <span className="text-font-regular-bold">{TempleChainTitle[chainKind]}</span>
      <div ref={tooltipWrapperRef}>
        {chainKind === TempleChainKind.Tezos ? <TezNetworkLogo /> : <EvmNetworksLogos />}
      </div>
    </div>
  );
});
