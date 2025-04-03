import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { Anchor, IconBase } from 'app/atoms';
import { HashChip } from 'app/atoms/HashChip';
import { TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import type { CollectibleDetails } from 'app/store/tezos/collectibles/state';
import { ChartListItem } from 'app/templates/chart-list-item';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { formatDate, T } from 'lib/i18n';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { TezosChain, useEvmChainByChainId } from 'temple/front/chains';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

const VALUE_CLASSNAME = 'p-1 text-font-num-bold-12';

const getValueWithFallback = (value?: BigNumber.Value | string | number) => value?.toString() ?? '-';

interface PropertiesItemsProps {
  network: TezosChain;
  assetSlug: string;
  accountPkh: string;
  details?: CollectibleDetails | null;
}

export const Details = memo<PropertiesItemsProps>(({ network, assetSlug, accountPkh, details }) => {
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

    const royalties = new BigNumber(details.royalties).decimalPlaces(2);

    return `${royalties.toString()}%`;
  }, [details]);

  return (
    <div className="flex flex-col p-4 rounded-8 shadow-bottom bg-white">
      <ChartListItem title={<T id="chain" />}>
        <div className="flex flex-row items-center">
          <span className={VALUE_CLASSNAME}>{network.name}</span>
          <TezosNetworkLogo chainId={network.chainId} size={16} />
        </div>
      </ChartListItem>

      <ChartListItem title={<T id="tokenStandard" />}>
        <p className={VALUE_CLASSNAME}>FA2</p>
      </ChartListItem>

      <ChartListItem title={<T id="tokenId" />}>
        <p className={VALUE_CLASSNAME}>{id}</p>
      </ChartListItem>

      <ChartListItem title={<T id="tokenContract" />}>
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

      <ChartListItem title={<T id="owned" />}>
        <p className={VALUE_CLASSNAME}>{getValueWithFallback(balance)}</p>
      </ChartListItem>

      <ChartListItem title={<T id="editions" />}>
        <p className={VALUE_CLASSNAME}>{getValueWithFallback(details?.supply)}</p>
      </ChartListItem>

      <ChartListItem title={<T id="royalties" />}>
        <p className={VALUE_CLASSNAME}>{royaltiesStr}</p>
      </ChartListItem>

      <ChartListItem title={<T id="minted" />} bottomSeparator={false}>
        <p className={VALUE_CLASSNAME}>{mintedTimestamp}</p>
      </ChartListItem>
    </div>
  );
});

interface EvmPropertiesItemsProps {
  accountPkh: HexString;
  assetSlug: string;
  evmChainId: number;
  metadata?: EvmCollectibleMetadata;
}

export const EvmPropertiesItems = memo<EvmPropertiesItemsProps>(({ accountPkh, evmChainId, assetSlug, metadata }) => {
  const chain = useEvmChainByChainId(evmChainId);
  const { value: balance } = useEvmAssetBalance(assetSlug, accountPkh, chain!);

  if (!metadata) return null;

  return (
    <div />
    // <>
    //   <div className={itemClassName}>
    //     <h6 className={itemTitleClassName}>Owned</h6>
    //     <span className={itemValueClassName}>{balance?.toFixed() ?? '-'}</span>
    //   </div>
    //
    //   <div className={itemClassName}>
    //     <h6 className={itemTitleClassName}>Contract</h6>
    //     <div className="flex gap-x-1.5">
    //       <OldStyleHashChip
    //         hash={metadata.address}
    //         firstCharsCount={5}
    //         lastCharsCount={5}
    //         className="tracking-tighter"
    //         rounded="base"
    //       />
    //     </div>
    //   </div>
    //
    //   <div className={itemClassName}>
    //     <h6 className={itemTitleClassName}>Token id</h6>
    //     <span className={itemValueClassName}>{metadata.tokenId}</span>
    //   </div>
    // </>
  );
});
