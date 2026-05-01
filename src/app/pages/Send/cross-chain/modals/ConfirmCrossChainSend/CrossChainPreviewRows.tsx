import React, { FC } from 'react';

import { HashChip } from 'app/atoms/HashChip';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { CurrencyIcon } from 'app/pages/Buy/CryptoExchange/components/CurrencyIcon';
import { ChartListItem } from 'app/templates/chart-list-item';
import { CROSS_CHAIN_DEFAULT_ETA, CrossChainAsset } from 'lib/cross-chain';
import { t } from 'lib/i18n';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

interface Props {
  recipient: string;
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
}

export const CrossChainPreviewRows: FC<Props> = ({ recipient, fromAsset, toAsset }) => {
  const fromEvmNetwork = useEvmChainByChainId(Number(fromAsset.chainId ?? 0));
  const fromTezosNetwork = useTezosChainByChainId(String(fromAsset.chainId ?? ''));
  const toEvmNetwork = useEvmChainByChainId(Number(toAsset.chainId ?? 0));
  const toTezosNetwork = useTezosChainByChainId(String(toAsset.chainId ?? ''));

  const fromNetworkName = resolveNetworkName(fromAsset, fromEvmNetwork?.name, fromTezosNetwork?.name);
  const toNetworkName = resolveNetworkName(toAsset, toEvmNetwork?.name, toTezosNetwork?.name);

  return (
    <div className="flex flex-col px-4 py-2 mb-6 rounded-lg border-0.5 border-lines bg-white">
      <ChartListItem title={t('recipient')}>
        <HashChip hash={recipient} firstCharsCount={6} lastCharsCount={6} />
      </ChartListItem>
      <ChartListItem title={t('networkFrom')}>
        <NetworkCell name={fromNetworkName} asset={fromAsset} />
      </ChartListItem>
      <ChartListItem title={t('networkTo')}>
        <NetworkCell name={toNetworkName} asset={toAsset} />
      </ChartListItem>
      <ChartListItem title="Est. time" bottomSeparator={false}>
        <span className="p-1 text-font-num-12">{CROSS_CHAIN_DEFAULT_ETA}</span>
      </ChartListItem>
    </div>
  );
};

const NetworkCell: FC<{ name: string; asset: CrossChainAsset }> = ({ name, asset }) => (
  <div className="flex items-center gap-x-1 p-1">
    <span className="text-font-num-12">{name}</span>
    <AssetNetworkBadge asset={asset} />
  </div>
);

const AssetNetworkBadge: FC<{ asset: CrossChainAsset }> = ({ asset }) => {
  if (asset.chainKind === TempleChainKind.Tezos && asset.chainId != null) {
    return <TezosNetworkLogo size={16} chainId={String(asset.chainId)} />;
  }
  if (asset.chainKind === TempleChainKind.EVM && asset.chainId != null) {
    return <EvmNetworkLogo size={16} chainId={Number(asset.chainId)} />;
  }
  return <CurrencyIcon src={asset.iconUrl ?? ''} code={asset.exolixCoin} size={16} />;
};

const resolveNetworkName = (asset: CrossChainAsset, evmName?: string, tezosName?: string): string => {
  if (asset.dest === 'btc') return 'Bitcoin';
  if (asset.chainKind === TempleChainKind.EVM) return evmName ?? 'EVM';
  if (asset.chainKind === TempleChainKind.Tezos) return tezosName ?? 'Tezos';
  return asset.name;
};
