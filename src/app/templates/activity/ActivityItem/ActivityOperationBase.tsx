import React, { FC, useCallback, useMemo } from 'react';

import { Anchor, HashShortView, IconBase, Money } from 'app/atoms';
import { EvmNetworkLogo, NetworkLogoTooltipWrap, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as DocumentsSvg } from 'app/icons/base/documents.svg';
import { ReactComponent as IncomeSvg } from 'app/icons/base/income.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as SendSvg } from 'app/icons/base/send.svg';
import { ReactComponent as SwapSvg } from 'app/icons/base/swap.svg';
import { FiatBalance } from 'app/pages/Home/OtherComponents/Tokens/components/Balance';
import { ActivityOperKindEnum, InfinitySymbol } from 'lib/activity';
import { isTransferActivityOperKind } from 'lib/activity/utils';
import { toEvmAssetSlug, toTezosAssetSlug } from 'lib/assets/utils';
import { atomsToTokens } from 'lib/temple/helpers';

import { EvmAssetIcon, TezosAssetIcon } from '../../AssetIcon';

interface Props {
  chainId: string | number;
  kind: ActivityOperKindEnum | 'bundle';
  hash: string;
  networkName: string;
  asset?: ActivityItemBaseAssetProp;
  blockExplorerUrl?: string;
}

export interface ActivityItemBaseAssetProp {
  contract: string;
  tokenId?: string;
  amount?: string | typeof InfinitySymbol;
  decimals: number;
  symbol?: string;
  iconURL?: string;
}

export const ActivityOperationBaseComponent: FC<Props> = ({
  kind,
  hash,
  chainId,
  networkName,
  asset,
  blockExplorerUrl
}) => {
  const assetSlug = asset
    ? typeof chainId === 'number'
      ? toEvmAssetSlug(asset.contract, asset.tokenId)
      : toTezosAssetSlug(asset.contract, asset.tokenId)
    : null;

  const { amountForFiat, amountJsx } = useMemo(() => {
    if (!asset) return {};

    const amountForFiat =
      typeof asset.amount === 'string' && (kind === 'bundle' || isTransferActivityOperKind(kind))
        ? atomsToTokens(asset.amount, asset.decimals)
        : null;

    const amountJsx = (
      <div className="text-font-num-14 truncate">
        {asset.amount ? (
          asset.amount === InfinitySymbol ? (
            '∞ '
          ) : (
            <>
              {kind === ActivityOperKindEnum.approve || asset.amount.startsWith('-') ? null : '+'}
              <Money smallFractionFont={false}>{atomsToTokens(asset.amount, asset.decimals)}</Money>{' '}
            </>
          )
        ) : null}

        {asset.symbol || '???'}
      </div>
    );

    return { amountForFiat, amountJsx };
  }, [asset, kind]);

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
        {assetSlug ? (
          typeof chainId === 'number' ? (
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
          )
        ) : (
          <IconFallback />
        )}

        <NetworkLogoTooltipWrap networkName={networkName} className="absolute bottom-0 right-0">
          {typeof chainId === 'number' ? (
            <EvmNetworkLogo networkName={networkName} chainId={chainId} size={16} />
          ) : (
            <TezosNetworkLogo networkName={networkName} chainId={chainId} size={16} />
          )}
        </NetworkLogoTooltipWrap>
      </div>

      <div className="flex-grow flex flex-col gap-y-1 overflow-hidden">
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

          {amountForFiat && assetSlug ? (
            <div className="shrink-0 flex">
              {amountForFiat.isPositive() && '+'}

              <FiatBalance
                evm={typeof chainId === 'number'}
                chainId={chainId}
                assetSlug={assetSlug}
                value={amountForFiat}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const ActivityKindTitle: Record<ActivityOperKindEnum | 'bundle', string> = {
  bundle: 'Bundle',
  [ActivityOperKindEnum.interaction]: 'Interaction',
  [ActivityOperKindEnum.transferFrom_ToAccount]: 'Send',
  [ActivityOperKindEnum.transferTo_FromAccount]: 'Receive',
  [ActivityOperKindEnum.transferFrom]: 'Transfer',
  [ActivityOperKindEnum.transferTo]: 'Transfer',
  [ActivityOperKindEnum.swap]: 'Swap',
  [ActivityOperKindEnum.approve]: 'Approve'
};

const ActivityKindIconSvg: Record<ActivityOperKindEnum | 'bundle', ImportedSVGComponent> = {
  bundle: DocumentsSvg,
  [ActivityOperKindEnum.interaction]: DocumentsSvg,
  [ActivityOperKindEnum.transferFrom_ToAccount]: SendSvg,
  [ActivityOperKindEnum.transferTo_FromAccount]: IncomeSvg,
  [ActivityOperKindEnum.transferFrom]: DocumentsSvg,
  [ActivityOperKindEnum.transferTo]: DocumentsSvg,
  [ActivityOperKindEnum.swap]: SwapSvg,
  [ActivityOperKindEnum.approve]: DocumentsSvg
};
