import React, { memo, ReactElement, ReactNode, useMemo } from 'react';

import clsx from 'clsx';

import { Anchor, Button, HashShortView, IconBase, Money } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as ChevronRightSvg } from 'app/icons/base/chevron_right.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { EvmAssetImage, TezosAssetImage } from 'app/templates/AssetImage';
import InFiat from 'app/templates/InFiat';
import { ActivityOperKindEnum, ActivityOperTransferType, ActivityStatus } from 'lib/activity';
import { isTransferActivityOperKind } from 'lib/activity/utils';
import { toEvmAssetSlug, toTezosAssetSlug } from 'lib/assets/utils';
import { atomsToTokens } from 'lib/temple/helpers';
import { BasicChain } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { FaceKind } from '../../utils';

import { AssetIconPlaceholder, BundleIconsStack, getIconByKind, getTitleByKind, StatusTag } from './utils';

interface Props {
  chain: BasicChain;
  kind: FaceKind;
  transferType?: ActivityOperTransferType;
  hash: string;
  asset?: ActivityItemBaseAssetProp;
  blockExplorerUrl?: string;
  status?: ActivityStatus;
  withoutAssetIcon?: boolean;
  onClick?: EmptyFn;
  addressChip?: ReactElement | null;
}

export interface ActivityItemBaseAssetProp {
  contract: string;
  tokenId?: string;
  /** `null` for 'unlimited' amount */
  amountSigned?: string | null;
  decimals: number;
  symbol?: string;
  iconURL?: string;
  nft?: boolean;
}

export const ActivityOperationBaseComponent = memo<Props>(
  ({ kind, transferType, hash, chain, asset, blockExplorerUrl, status, withoutAssetIcon, onClick, addressChip }) => {
    const isForEvm = chain.kind === TempleChainKind.EVM;

    const assetSlug = asset
      ? isForEvm
        ? toEvmAssetSlug(asset.contract, asset.tokenId)
        : toTezosAssetSlug(asset.contract, asset.tokenId)
      : null;

    const amountJsx = useMemo<ReactNode>(() => {
      if (!asset) return null;

      const symbol = asset.symbol || (kind === ActivityOperKindEnum.approve ? '---' : '');
      const symbolStr = symbol.length > 6 ? `${symbol.slice(0, 6)}...` : symbol;

      return (
        <div
          className={clsx(
            'max-w-40 flex text-font-num-14 overflow-hidden',
            asset.amountSigned &&
              Number(asset.amountSigned) > 0 &&
              kind !== ActivityOperKindEnum.approve &&
              'text-success',
            onClick && 'group-hover:hidden'
          )}
        >
          {kind === ActivityOperKindEnum.approve ? null : asset.amountSigned ? (
            <Money smallFractionFont={false} withSign>
              {atomsToTokens(asset.amountSigned, asset.decimals)}
            </Money>
          ) : null}

          {symbolStr ? <span className="whitespace-pre"> {symbolStr}</span> : null}
        </div>
      );
    }, [asset, kind, onClick]);

    const fiatJsx = useMemo<ReactNode>(() => {
      if (!asset) return null;

      if (!asset.amountSigned) return asset.amountSigned === null ? 'Unlimited' : null;

      if (kind === ActivityOperKindEnum.approve)
        return <Money smallFractionFont={false}>{atomsToTokens(asset.amountSigned, asset.decimals)}</Money>;

      if (!assetSlug) return null;

      const amountForFiat =
        kind === 'bundle' || isTransferActivityOperKind(kind)
          ? atomsToTokens(asset.amountSigned, asset.decimals)
          : null;

      if (!amountForFiat) return null;

      return (
        <InFiat
          evm={isForEvm}
          chainId={chain.chainId}
          assetSlug={assetSlug}
          volume={amountForFiat}
          smallFractionFont={false}
          withSign
        >
          {({ balance, symbol, noPrice }) =>
            noPrice ? (
              <span>No value</span>
            ) : (
              <>
                {balance}
                <span className="ml-1">{symbol}</span>
              </>
            )
          }
        </InFiat>
      );
    }, [asset, kind, assetSlug, chain.chainId, isForEvm]);

    const chipJsx = useMemo(
      () =>
        addressChip ?? (
          <Anchor
            href={blockExplorerUrl}
            target="_blank"
            className="flex items-center gap-x-1 group-hover:text-secondary"
          >
            <span>
              <HashShortView hash={hash} firstCharsCount={6} lastCharsCount={4} />
            </span>

            <IconBase Icon={OutLinkIcon} size={12} className="invisible group-hover:visible" />
          </Anchor>
        ),
      [addressChip, hash, blockExplorerUrl]
    );

    const isNFT = Boolean(asset?.nft);

    const faceIconJsx = useMemo(() => {
      if (withoutAssetIcon || !assetSlug)
        return (
          <div className="w-full h-full flex items-center justify-center bg-grey-4">
            <IconBase Icon={getIconByKind(kind, transferType)} className="text-grey-1" />
          </div>
        );

      const className = 'w-full h-full object-cover';

      const placeholderJsx = <AssetIconPlaceholder isNFT={isNFT} symbol={asset?.symbol} className={className} />;

      return isForEvm ? (
        <EvmAssetImage
          evmChainId={chain.chainId}
          assetSlug={assetSlug}
          className={className}
          extraSrc={asset?.iconURL}
          loader={placeholderJsx}
          fallback={placeholderJsx}
        />
      ) : (
        <TezosAssetImage
          tezosChainId={chain.chainId}
          assetSlug={assetSlug}
          className={className}
          extraSrc={asset?.iconURL}
          loader={placeholderJsx}
          fallback={placeholderJsx}
        />
      );
    }, [chain, isForEvm, withoutAssetIcon, kind, transferType, asset?.iconURL, asset?.symbol, isNFT, assetSlug]);

    return (
      <div className="z-1 relative group flex gap-x-2 p-2 rounded-lg hover:bg-secondary-low">
        <div className="relative shrink-0 self-center flex items-center justify-center flex items-start w-10 h-10">
          {kind === 'bundle' ? (
            <BundleIconsStack withoutAssetIcon={withoutAssetIcon} isNFT={isNFT}>
              {faceIconJsx}
            </BundleIconsStack>
          ) : (
            <div className={clsx('w-9 h-9 overflow-hidden', isNFT ? 'rounded-lg' : 'rounded-full')}>{faceIconJsx}</div>
          )}

          {withoutAssetIcon ? null : isForEvm ? (
            <EvmNetworkLogo chainId={chain.chainId} size={16} className="absolute bottom-0 right-0" withTooltip />
          ) : (
            <TezosNetworkLogo chainId={chain.chainId} size={16} className="absolute bottom-0 right-0" withTooltip />
          )}
        </div>

        <div className="flex-grow flex flex-col gap-y-1 whitespace-nowrap overflow-hidden">
          <div className="flex gap-x-2 justify-between">
            <div className="shrink-0 flex items-center gap-x-1">
              <span className="text-font-medium">{getTitleByKind(kind, transferType)}</span>

              <StatusTag status={status} />
            </div>

            {amountJsx}
          </div>

          <div className="flex gap-x-2 justify-between text-font-num-12 text-grey-1">
            {chipJsx}

            <div className={clsx('shrink-0 flex', onClick && 'group-hover:hidden')}>{fiatJsx}</div>
          </div>
        </div>

        {onClick && (
          <Button
            className={clsx(
              'flex items-center flex-nowrap py-0.5 px-1 text-secondary',
              'absolute right-2 top-1/2 -translate-y-1/2',
              'hidden group-hover:flex'
            )}
            onClick={onClick}
          >
            <span className="text-font-description-bold">Details</span>

            <IconBase Icon={ChevronRightSvg} size={12} />
          </Button>
        )}
      </div>
    );
  }
);
