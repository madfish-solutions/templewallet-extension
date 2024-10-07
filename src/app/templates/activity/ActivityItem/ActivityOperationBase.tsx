import React, { FC, ReactNode, useCallback, useMemo } from 'react';

import { Anchor, HashShortView, IconBase, Money } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as DocumentsSvg } from 'app/icons/base/documents.svg';
import { ReactComponent as IncomeSvg } from 'app/icons/base/income.svg';
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
}

export interface ActivityItemBaseAssetProp {
  contract: string;
  tokenId?: string;
  amount?: string | null;
  decimals: number;
  symbol?: string;
  iconURL?: string;
}

export const ActivityOperationBaseComponent: FC<Props> = ({
  kind,
  hash,
  chainId,
  asset,
  blockExplorerUrl,
  withoutAssetIcon
}) => {
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
      <div className="flex text-font-num-14 overflow-hidden">
        {kind === ActivityOperKindEnum.approve ? null : asset.amount ? (
          <Money smallFractionFont={false} withSign>
            {atomsToTokens(asset.amount, asset.decimals)}
          </Money>
        ) : null}

        {symbolStr ? <span className="whitespace-pre"> {symbolStr}</span> : null}
      </div>
    );
  }, [asset, kind]);

  const fiatJsx = useMemo<ReactNode>(() => {
    if (!asset) return null;

    if (!asset.amount) return asset.amount === null ? 'Unlimited' : null;

    if (kind === ActivityOperKindEnum.approve)
      return <Money smallFractionFont={false}>{atomsToTokens(asset.amount, asset.decimals)}</Money>;

    if (!assetSlug) return null;

    const amountForFiat =
      kind === 'bundle' || isTransferActivityOperKind(kind) ? atomsToTokens(asset.amount, asset.decimals) : null;

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

  const IconFallback = useCallback<FC>(
    () => (
      <div className="w-full h-full flex items-center justify-center rounded-full bg-grey-4">
        <IconBase Icon={ActivityKindIconSvg[kind]} size={16} className="text-grey-1" />
      </div>
    ),
    [kind]
  );

  return (
    <div className="z-1 group flex gap-x-2 p-2 rounded-lg hover:bg-secondary-low">
      <div className="relative shrink-0 self-center flex items-center justify-center w-10 h-10 overflow-hidden">
        {withoutAssetIcon || !assetSlug ? (
          <IconFallback />
        ) : typeof chainId === 'number' ? (
          <EvmAssetIcon
            evmChainId={chainId}
            assetSlug={assetSlug}
            className="w-9 h-9"
            extraSrc={asset?.iconURL}
            Fallback={IconFallback}
          />
        ) : (
          <TezosAssetIcon
            tezosChainId={chainId}
            assetSlug={assetSlug}
            className="w-9 h-9"
            extraSrc={asset?.iconURL}
            Fallback={IconFallback}
          />
        )}

        {typeof chainId === 'number' ? (
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
};

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
  [ActivityOperKindEnum.approve]: DocumentsSvg
};
