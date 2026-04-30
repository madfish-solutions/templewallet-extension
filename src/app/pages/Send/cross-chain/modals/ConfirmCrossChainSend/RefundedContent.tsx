import React, { FC } from 'react';

import BigNumber from 'bignumber.js';

import { Anchor, HashShortView, IconBase } from 'app/atoms';
import { HashChip } from 'app/atoms/HashChip';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as XCircleFill } from 'app/icons/base/x_circle_fill.svg';
import { EXOLIX_CONTACT_LINK } from 'app/pages/Buy/CryptoExchange/config';
import { CrossChainExchange } from 'app/store/cross-chain-send/state';
import { ChartListItem } from 'app/templates/chart-list-item';
import InFiat from 'app/templates/InFiat';
import { T, t } from 'lib/i18n';
import { useBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import backgroundFailedSrc from '../../assets/background-failed.svg?url';
import { CrossChainAmountRow } from '../../components/CrossChainAmountRow';

import { StatusHeroRegion } from './StatusHeroRegion';

interface Props {
  exchange: CrossChainExchange;
  onClose: EmptyFn;
}

export const RefundedContent: FC<Props> = ({ exchange, onClose }) => {
  const refundAmount = exchange.fromAmount;

  const refundExplorerHref = useBlockExplorerHref(
    exchange.sourceChainKind,
    exchange.sourceChainId,
    'tx',
    exchange.refundHash ?? ''
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-3 flex flex-col items-stretch">
        <StatusHeroRegion
          backgroundSrc={backgroundFailedSrc}
          outerClassName="h-48 px-4 pb-2"
          innerClassName="flex flex-col items-center gap-y-3 pb-4 pt-6"
        >
          <XCircleFill width={58} height={58} className="text-error fill-current" />
          <p className="text-font-regular-bold">
            <T id="refunded" />
          </p>
          <p className="text-font-description text-grey-1 text-center whitespace-pre-line">
            <T id="refundedDescription" />
          </p>
        </StatusHeroRegion>

        <div className="rounded-8 bg-white border-0.5 border-lines flex flex-col px-4 pb-4">
          <ChartListItem
            title={<span className="text-font-description-bold text-grey-1">{t('amount')}</span>}
            bottomSeparator={false}
          >
            {exchange.senderAddress && (
              <div className="flex items-center gap-x-1">
                <span className="text-font-description text-grey-1">
                  <T id="toAsset" />
                </span>
                <HashChip hash={exchange.senderAddress} firstCharsCount={6} lastCharsCount={4} />
              </div>
            )}
          </ChartListItem>

          <div className="pb-3">
            <CrossChainAmountRow
              asset={exchange.fromAsset}
              amount={refundAmount}
              sign="+"
              amountClassName="text-success"
              rightContent={
                exchange.fromAsset.chainId && exchange.fromAsset.assetSlug ? (
                  <InFiat
                    assetSlug={exchange.fromAsset.assetSlug}
                    chainId={exchange.fromAsset.chainId}
                    volume={new BigNumber(refundAmount || 0)}
                    evm={exchange.fromAsset.chainKind === TempleChainKind.EVM}
                    smallFractionFont={false}
                  >
                    {({ balance, symbol, noPrice }) =>
                      noPrice ? (
                        <span className="text-font-description text-grey-1">—</span>
                      ) : (
                        <span className="text-font-description text-grey-1">
                          {balance} {symbol}
                        </span>
                      )
                    }
                  </InFiat>
                ) : undefined
              }
            />
          </div>

          {exchange.refundHash && (
            <ChartListItem
              title={t('refundTxHash')}
              bottomSeparator={false}
              className="border-t-0.5 border-lines pt-6 mb-2"
            >
              {refundExplorerHref ? (
                <Anchor
                  href={refundExplorerHref}
                  className="flex items-center gap-x-1 p-1 text-secondary text-font-num-12"
                >
                  <HashShortView hash={exchange.refundHash} firstCharsCount={6} lastCharsCount={4} />
                  <IconBase size={12} Icon={OutLinkIcon} />
                </Anchor>
              ) : (
                <HashChip hash={exchange.refundHash} firstCharsCount={6} lastCharsCount={4} />
              )}
            </ChartListItem>
          )}
        </div>

        <Anchor href={EXOLIX_CONTACT_LINK} className="mt-4 py-0.5 flex flex-row justify-center items-center">
          <span className="text-font-description-bold text-secondary">
            <T id="exolixSupport" />
          </span>
          <IconBase size={16} className="text-secondary" Icon={OutLinkIcon} />
        </Anchor>
      </div>

      <ActionsButtonsBox>
        <StyledButton size="L" color="primary" onClick={onClose}>
          <T id="done" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};
