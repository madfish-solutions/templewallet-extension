import { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { Anchor, IconBase } from 'app/atoms';
import { HashChip } from 'app/atoms/HashChip';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import type { CollectibleDetails } from 'app/store/tezos/collectibles/state';
import { ChartListItem, PlainChartListItemProps } from 'app/templates/chart-list-item';
import { fromAssetSlug, fromFa2TokenSlug } from 'lib/assets/utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { formatDate, T, toLocalFormat } from 'lib/i18n';
import { buildHttpLinkFromUri } from 'lib/images-uri';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { EvmChain, TezosChain } from 'temple/front/chains';
import { useGetEvmActiveBlockExplorer, useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { InfoContainer } from './InfoContainer';

const VALUE_CLASSNAME = 'p-1 text-font-num-bold-12';

const getValueWithFallback = (value?: BigNumber.Value | string | number) => value?.toString() ?? '-';

interface TezosDetailsProps {
  network: TezosChain;
  assetSlug: string;
  accountPkh: string;
  details?: CollectibleDetails | null;
  shouldShowEmptyRows?: boolean;
}

export const TezosDetails = memo<TezosDetailsProps>(
  ({ network, assetSlug, accountPkh, details, shouldShowEmptyRows = true }) => {
    const { contract, id } = fromFa2TokenSlug(assetSlug);

    const { value: balance } = useTezosAssetBalance(assetSlug, accountPkh, network);

    const getActiveBlockExplorer = useGetTezosActiveBlockExplorer();
    const activeBlockExplorer = useMemo(
      () => getActiveBlockExplorer(network.chainId),
      [getActiveBlockExplorer, network.chainId]
    );

    const exploreContractUrl = useMemo(
      () => makeBlockExplorerHref(activeBlockExplorer.url, contract, 'address', TempleChainKind.Tezos),
      [activeBlockExplorer.url, contract]
    );

    const creatorAddress = details?.creators?.at(0)?.address;

    const exploreContractCreatorUrl = useMemo(
      () =>
        creatorAddress &&
        makeBlockExplorerHref(activeBlockExplorer.url, creatorAddress, 'address', TempleChainKind.Tezos),
      [activeBlockExplorer.url, creatorAddress]
    );

    const mintedTimestamp = useMemo(() => {
      const value = details?.mintedTimestamp;

      return value ? formatDate(value, 'PP') : '-';
    }, [details?.mintedTimestamp]);

    const royaltiesStr = useMemo(() => {
      if (!details?.royalties) return '-';

      return `${toLocalFormat(details.royalties, { decimalPlaces: 2 })}%`;
    }, [details]);

    return (
      <InfoContainer>
        <ChartListItem title={<T id="chain" />}>
          <div className="flex flex-row items-center">
            <span className={VALUE_CLASSNAME}>{network.name}</span>
            <TezosNetworkLogo chainId={network.chainId} size={16} />
          </div>
        </ChartListItem>

        <PlainChartListItem title={<T id="tokenStandard" />}>FA2</PlainChartListItem>

        <PlainChartListItem title={<T id="tokenId" />}>{id}</PlainChartListItem>

        <ChartListItem title={<T id="tokenContract" />} bottomSeparator={shouldShowEmptyRows}>
          <div className="flex flex-row items-center gap-x-0.5">
            <HashChip hash={contract} className="p-0.5" />
            <Anchor href={exploreContractUrl}>
              <IconBase Icon={OutLinkIcon} className="text-secondary" />
            </Anchor>
          </div>
        </ChartListItem>

        {creatorAddress && (
          <ChartListItem title={<T id="contractCreator" />}>
            <div className="flex flex-row items-center gap-x-0.5">
              <HashChip hash={creatorAddress} className="p-0.5" />
              {exploreContractCreatorUrl && (
                <Anchor href={exploreContractCreatorUrl}>
                  <IconBase Icon={OutLinkIcon} className="text-secondary" />
                </Anchor>
              )}
            </div>
          </ChartListItem>
        )}

        {details?.metadataHash && (
          <ChartListItem title={<T id="metadata" />}>
            <Anchor
              href={`https://ipfs.io/ipfs/${details.metadataHash}`}
              className="flex flex-row items-center gap-x-0.5 text-secondary"
            >
              <p className="py-0.5 text-font-description">IPFS</p>
              <IconBase Icon={OutLinkIcon} />
            </Anchor>
          </ChartListItem>
        )}

        {shouldShowEmptyRows && (
          <>
            <PlainChartListItem title={<T id="owned" />}>{getValueWithFallback(balance)}</PlainChartListItem>

            <PlainChartListItem title={<T id="editions" />}>{getValueWithFallback(details?.supply)}</PlainChartListItem>

            <PlainChartListItem title={<T id="royalties" />}>{royaltiesStr}</PlainChartListItem>

            <PlainChartListItem title={<T id="minted" />} bottomSeparator={false}>
              {mintedTimestamp}
            </PlainChartListItem>
          </>
        )}
      </InfoContainer>
    );
  }
);

interface EvmDetailsProps {
  network: EvmChain;
  assetSlug: string;
  accountPkh: HexString;
  metadata?: EvmCollectibleMetadata;
  shouldShowEmptyRows?: boolean;
}

export const EvmDetails = memo<EvmDetailsProps>(
  ({ network, accountPkh, assetSlug, metadata, shouldShowEmptyRows = true }) => {
    const { value: balance } = useEvmAssetBalance(assetSlug, accountPkh, network);

    const [contractAddress, tokenId] = useMemo(() => fromAssetSlug(assetSlug), [assetSlug]);

    const getActiveBlockExplorer = useGetEvmActiveBlockExplorer();
    const activeBlockExplorer = useMemo(
      () => getActiveBlockExplorer(network.chainId.toString()),
      [getActiveBlockExplorer, network.chainId]
    );

    const exploreContractUrl = useMemo(
      () => makeBlockExplorerHref(activeBlockExplorer.url, contractAddress, 'address', TempleChainKind.EVM),
      [activeBlockExplorer.url, contractAddress]
    );

    const exploreContractCreatorUrl = useMemo(
      () =>
        metadata?.originalOwner &&
        makeBlockExplorerHref(activeBlockExplorer.url, metadata?.originalOwner, 'address', TempleChainKind.EVM),
      [activeBlockExplorer.url, metadata?.originalOwner]
    );

    const metadataLink = useMemo(() => {
      if (!metadata?.metadataUri?.startsWith('ipfs')) return;
      return buildHttpLinkFromUri(metadata.metadataUri);
    }, [metadata?.metadataUri]);

    const displayStandard = useMemo(
      () => metadata?.standard && metadata?.standard.replace('erc', 'ERC '),
      [metadata?.standard]
    );

    return (
      <InfoContainer>
        <ChartListItem title={<T id="chain" />}>
          <div className="flex flex-row items-center">
            <span className={VALUE_CLASSNAME}>{network.name}</span>
            <EvmNetworkLogo chainId={network.chainId} size={16} />
          </div>
        </ChartListItem>

        {displayStandard && <PlainChartListItem title={<T id="tokenStandard" />}>{displayStandard}</PlainChartListItem>}

        <PlainChartListItem title={<T id="tokenId" />}>{tokenId}</PlainChartListItem>

        <ChartListItem title={<T id="tokenContract" />} bottomSeparator={shouldShowEmptyRows}>
          <div className="flex flex-row items-center gap-x-0.5">
            <HashChip hash={contractAddress} className="p-0.5" />
            <Anchor href={exploreContractUrl}>
              <IconBase Icon={OutLinkIcon} className="text-secondary" />
            </Anchor>
          </div>
        </ChartListItem>

        {metadata?.originalOwner && (
          <ChartListItem title={<T id="contractCreator" />}>
            <div className="flex flex-row items-center gap-x-0.5">
              <HashChip hash={metadata.originalOwner} className="p-0.5" />
              {exploreContractCreatorUrl && (
                <Anchor href={exploreContractCreatorUrl}>
                  <IconBase Icon={OutLinkIcon} className="text-secondary" />
                </Anchor>
              )}
            </div>
          </ChartListItem>
        )}

        {metadataLink && (
          <ChartListItem title={<T id="metadata" />}>
            <Anchor href={metadataLink} className="flex flex-row items-center gap-x-0.5 text-secondary">
              <p className="py-0.5 text-font-description">IPFS</p>
              <IconBase Icon={OutLinkIcon} />
            </Anchor>
          </ChartListItem>
        )}

        {shouldShowEmptyRows && (
          <PlainChartListItem title={<T id="amount" />} bottomSeparator={false}>
            {getValueWithFallback(balance)}
          </PlainChartListItem>
        )}
      </InfoContainer>
    );
  }
);

const PlainChartListItem = memo<PlainChartListItemProps>(({ children, ...restProps }) => (
  <ChartListItem {...restProps}>
    <p className={clsx(VALUE_CLASSNAME, 'max-w-48 truncate')}>{children}</p>
  </ChartListItem>
));
