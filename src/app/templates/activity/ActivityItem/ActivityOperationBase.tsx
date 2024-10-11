import React, { memo, MouseEventHandler, ReactNode, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { Anchor, HashShortView, IconBase, Money } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as DocumentsSvg } from 'app/icons/base/documents.svg';
import { ReactComponent as IncomeSvg } from 'app/icons/base/income.svg';
import { ReactComponent as OkSvg } from 'app/icons/base/ok.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as SendSvg } from 'app/icons/base/send.svg';
import { ReactComponent as SwapSvg } from 'app/icons/base/swap.svg';
import { EvmAssetIcon, TezosAssetIcon } from 'app/templates/AssetIcon';
import { InFiat } from 'app/templates/InFiat';
import { ActivityOperKindEnum } from 'lib/activity';
import { isTransferActivityOperKind } from 'lib/activity/utils';
import { toEvmAssetSlug, toTezosAssetSlug } from 'lib/assets/utils';
import { atomsToTokens } from 'lib/temple/helpers';

import { FaceKind } from '../utils';

interface Props {
  chainId: string | number;
  kind: FaceKind;
  hash: string;
  asset?: ActivityItemBaseAssetProp;
  blockExplorerUrl?: string;
  withoutAssetIcon?: boolean;
  onClick?: EmptyFn;
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
  ({ kind, hash, chainId, asset, blockExplorerUrl, withoutAssetIcon, onClick }) => {
    const assetSlug = asset
      ? typeof chainId === 'number'
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
            'flex text-font-num-14 overflow-hidden',
            asset.amountSigned && Number(asset.amountSigned) > 0 && 'text-success'
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
    }, [asset, kind]);

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
          evm={typeof chainId === 'number'}
          chainId={chainId}
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
    }, [asset, kind, assetSlug, chainId]);

    const handleClick = useCallback<MouseEventHandler<HTMLDivElement>>(
      event => {
        if (!onClick) return;

        // Case of click on link inside this component's element
        if (event.target instanceof Element && event.target.closest(`.${CLICK_DETECTION_ATTR} a`)) return;

        onClick();
      },
      [onClick]
    );

    const isNFT = Boolean(asset?.nft);

    const faceIconJsx = useMemo(
      () =>
        withoutAssetIcon || !assetSlug ? (
          <div className="w-full h-full flex items-center justify-center bg-grey-4">
            <IconBase Icon={ActivityKindIconSvg[kind]} className="text-grey-1" />
          </div>
        ) : typeof chainId === 'number' ? (
          <EvmAssetIcon
            evmChainId={chainId}
            assetSlug={assetSlug}
            className="w-full h-full object-cover"
            extraSrc={asset?.iconURL}
          />
        ) : (
          <TezosAssetIcon
            tezosChainId={chainId}
            assetSlug={assetSlug}
            className="w-full h-full object-cover"
            extraSrc={asset?.iconURL}
          />
        ),
      [chainId, withoutAssetIcon, kind, asset?.iconURL, assetSlug]
    );

    return (
      <div
        className={clsx(
          'z-1 group flex gap-x-2 p-2 rounded-lg hover:bg-secondary-low',
          onClick && 'cursor-pointer',
          CLICK_DETECTION_ATTR
        )}
        onClick={handleClick}
      >
        <div className="relative shrink-0 self-center flex items-center justify-center flex items-start w-10 h-10">
          {kind === 'bundle' ? (
            <BundleIconsStack withoutAssetIcon={withoutAssetIcon} isNFT={isNFT}>
              {faceIconJsx}
            </BundleIconsStack>
          ) : (
            <div className={clsx('w-9 h-9 overflow-hidden', isNFT ? 'rounded-lg' : 'rounded-full')}>{faceIconJsx}</div>
          )}

          {withoutAssetIcon ? null : typeof chainId === 'number' ? (
            <EvmNetworkLogo chainId={chainId} size={16} className="absolute bottom-0 right-0" withTooltip />
          ) : (
            <TezosNetworkLogo chainId={chainId} size={16} className="absolute bottom-0 right-0" withTooltip />
          )}
        </div>

        <div className="flex-grow flex flex-col gap-y-1 whitespace-nowrap overflow-hidden">
          <div className="flex gap-x-2 justify-between">
            <div className="text-font-medium">{ActivityKindTitle[kind]}</div>

            {amountJsx}
          </div>

          <div className="flex gap-x-2 justify-between text-font-num-12 text-grey-1">
            <Anchor
              href={blockExplorerUrl}
              target="_blank"
              className="flex items-center gap-x-1 group-hover:text-secondary"
            >
              <HashShortView hash={hash} firstCharsCount={6} lastCharsCount={4} />

              <IconBase Icon={OutLinkIcon} size={12} className="invisible group-hover:visible" />
            </Anchor>

            <div className="shrink-0 flex">{fiatJsx}</div>
          </div>
        </div>
      </div>
    );
  }
);

const MEDALION_CLASS_NAME = 'absolute border border-lines';

const BundleIconsStack = memo<PropsWithChildren<{ withoutAssetIcon?: boolean; isNFT?: boolean }>>(
  ({ withoutAssetIcon, isNFT, children }) => {
    return (
      <>
        <div
          className={clsx(MEDALION_CLASS_NAME, 'w-6 h-6 top-0 left-0', withoutAssetIcon ? 'bg-grey-4' : 'bg-white')}
          style={{ borderRadius: isNFT ? 6 : '100%' }}
        />

        <div
          className={clsx(MEDALION_CLASS_NAME, 'w-7 h-7 shadow-center', withoutAssetIcon ? 'bg-grey-4' : 'bg-white')}
          style={{ top: 3, left: 3, borderRadius: isNFT ? 7 : '100%' }}
        />

        <div
          className={clsx(
            MEDALION_CLASS_NAME,
            'w-8 h-8 shadow-center',
            'flex items-center justify-center',
            'bottom-0.5 right-0.5',
            withoutAssetIcon ? 'bg-grey-4' : 'bg-white'
          )}
          style={{ borderRadius: isNFT ? 8 : '100%' }}
        >
          <div className="w-7 h-7 overflow-hidden" style={{ borderRadius: isNFT ? 7 : '100%' }}>
            {children}
          </div>
        </div>
      </>
    );
  }
);

const CLICK_DETECTION_ATTR = 'click-break-point';

const ActivityKindTitle: Record<FaceKind, string> = {
  bundle: 'Bundle',
  [ActivityOperKindEnum.interaction]: 'Interaction',
  [ActivityOperKindEnum.transferFrom_ToAccount]: 'Send',
  [ActivityOperKindEnum.transferTo_FromAccount]: 'Receive',
  [ActivityOperKindEnum.transferFrom]: 'Transfer',
  [ActivityOperKindEnum.transferTo]: 'Transfer',
  [ActivityOperKindEnum.swap]: 'Swap',
  [ActivityOperKindEnum.approve]: 'Approve'
};

const ActivityKindIconSvg: Record<FaceKind, ImportedSVGComponent> = {
  bundle: DocumentsSvg,
  [ActivityOperKindEnum.interaction]: DocumentsSvg,
  [ActivityOperKindEnum.transferFrom_ToAccount]: SendSvg,
  [ActivityOperKindEnum.transferTo_FromAccount]: IncomeSvg,
  [ActivityOperKindEnum.transferFrom]: DocumentsSvg,
  [ActivityOperKindEnum.transferTo]: DocumentsSvg,
  [ActivityOperKindEnum.swap]: SwapSvg,
  [ActivityOperKindEnum.approve]: OkSvg
};
