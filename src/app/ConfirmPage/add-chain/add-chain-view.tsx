import React, { memo, useCallback, useMemo } from 'react';

import { Anchor, IconBase } from 'app/atoms';
import { EvmNetworkLogo } from 'app/atoms/NetworkLogo';
import { SettingsCheckbox } from 'app/atoms/SettingsCheckbox';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ChartListItem, PlainChartListItem } from 'app/templates/chart-list-item';
import { T } from 'lib/i18n';
import { EvmChainToAddMetadata } from 'lib/temple/types';
import { useCopyText } from 'lib/ui/hooks/use-copy-text';

import { useAddChainDataState } from './context';

interface Props {
  metadata: EvmChainToAddMetadata;
}

export const AddChainView = memo<Props>(({ metadata }) => {
  const chainId = Number(metadata.chainId);
  const { testnet, setTestnet } = useAddChainDataState();

  const displayRpcUrl = useMemo(() => new URL(metadata.rpcUrl).hostname, [metadata.rpcUrl]);
  const displayBlockExplorerUrl = useMemo(
    () => metadata.blockExplorerUrl && new URL(metadata.blockExplorerUrl).hostname,
    [metadata.blockExplorerUrl]
  );

  const handleCopyRpcUrl = useCopyText(metadata.rpcUrl);

  const handleTestnetChange = useCallback((checked: boolean) => setTestnet(checked), [setTestnet]);

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col px-4 py-2 rounded-8 bg-white border-0.5 border-lines">
        <ChartListItem title={<T id="network" />}>
          <div className="flex flex-row items-center">
            <span className="p-1 text-font-num-bold-12">{metadata.name}</span>
            <EvmNetworkLogo chainId={chainId} chainName={metadata.name} size={16} />
          </div>
        </ChartListItem>

        <ChartListItem title={<T id="rpcURL" />}>
          <div className="flex flex-row px-1 py-0.5 gap-x-0.5 text-secondary cursor-pointer" onClick={handleCopyRpcUrl}>
            <p className="text-font-description max-w-52 truncate">{displayRpcUrl}</p>
            <IconBase Icon={CopyIcon} size={12} />
          </div>
        </ChartListItem>

        <PlainChartListItem title={<T id="chainId" />}>{chainId}</PlainChartListItem>

        <PlainChartListItem title={<T id="symbol" />} bottomSeparator={Boolean(metadata.blockExplorerUrl)}>
          {metadata.nativeCurrency.symbol}
        </PlainChartListItem>

        {metadata.blockExplorerUrl && (
          <ChartListItem title={<T id="blockExplorer" />} bottomSeparator={false}>
            <Anchor
              href={metadata.blockExplorerUrl}
              className="flex flex-row px-1 py-0.5 gap-x-0.5 text-secondary cursor-pointer"
            >
              <p className="text-font-description max-w-48 truncate">{displayBlockExplorerUrl}</p>
              <IconBase Icon={OutLinkIcon} size={12} />
            </Anchor>
          </ChartListItem>
        )}
      </div>

      <SettingsCheckbox checked={testnet} onChange={handleTestnetChange} label={<T id="testnet" />} />
    </div>
  );
});
