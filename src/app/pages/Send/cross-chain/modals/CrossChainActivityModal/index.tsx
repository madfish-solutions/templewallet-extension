import React, { FC, Fragment, memo, useEffect, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { HashShortView, IconBase } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import Money from 'app/atoms/Money';
import { Loader } from 'app/atoms/Loader';
import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { dispatch } from 'app/store';
import { dismissCrossChainBannerAction } from 'app/store/cross-chain-send/actions';
import { useCrossChainExchangesForAccountSelector } from 'app/store/cross-chain-send/selectors';
import { CrossChainExchange, CrossChainPhase } from 'app/store/cross-chain-send/state';
import InFiat from 'app/templates/InFiat';
import { T, formatDate, t } from 'lib/i18n';
import { TempleChainKind } from 'temple/types';

import { CrossChainAssetIcon } from '../../components/CrossChainAssetIcon';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
  accountId: string | undefined;
  onExchangeClick: (exchange: CrossChainExchange) => void;
}

type UiStatus = 'pending' | 'failed' | 'success';

const phaseToStatus = (phase: CrossChainPhase): UiStatus => {
  if (phase === 'COMPLETED') return 'success';
  if (phase === 'FAILED') return 'failed';
  return 'pending';
};

export const CrossChainActivityModal: FC<Props> = ({ opened, onRequestClose, accountId, onExchangeClick }) => {
  const exchanges = useCrossChainExchangesForAccountSelector(accountId);

  useEffect(() => {
    if (!opened) return;
    exchanges
      .filter(e => e.phase === 'FAILED' && !e.bannerDismissed)
      .forEach(e => dispatch(dismissCrossChainBannerAction(e.id)));
  }, [opened, exchanges]);

  const groups = useMemo(() => {
    const sorted = [...exchanges].sort((a, b) => b.createdAt - a.createdAt);
    const byDay = new Map<string, CrossChainExchange[]>();
    for (const ex of sorted) {
      const key = formatDate(ex.createdAt, 'PP');
      const list = byDay.get(key);
      if (list) list.push(ex);
      else byDay.set(key, [ex]);
    }
    return Array.from(byDay.entries());
  }, [exchanges]);

  return (
    <MiniPageModal title={t('crossChainActivityTitle')} opened={opened} onRequestClose={onRequestClose}>
      <div className="px-4 pb-4 overflow-y-auto">
        {groups.length === 0 ? (
          <EmptyState forSearch={false} text={t('noActivityYet')} stretch />
        ) : (
          <div className="flex flex-col">
            {groups.map(([label, items]) => (
              <Fragment key={label}>
                <div className="mt-3 mb-1 p-1 text-font-description-bold">{label}</div>
                {items.map(ex => (
                  <Row key={ex.id} exchange={ex} onClick={() => onExchangeClick(ex)} />
                ))}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </MiniPageModal>
  );
};

interface RowProps {
  exchange: CrossChainExchange;
  onClick: EmptyFn;
}

const Row = memo<RowProps>(({ exchange, onClick }) => {
  const status = phaseToStatus(exchange.phase);
  const { fromAsset, fromAmount, recipient } = exchange;

  const bnAmount = useMemo(() => (fromAmount ? new BigNumber(fromAmount) : new BigNumber(0)), [fromAmount]);
  const hasFromFiat = Boolean(fromAsset.chainId && fromAsset.assetSlug);
  const isEvm = fromAsset.chainKind === TempleChainKind.EVM;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-x-2 rounded-8 px-2 py-1 h-14 text-left transition-colors hover:bg-secondary-low"
    >
      <CrossChainAssetIcon asset={fromAsset} size={32} />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-x-1.5">
          <span className="text-font-medium">
            <T id="send" />
          </span>
          {status === 'pending' && <Loader size="S" trackVariant="dark" className="text-secondary" />}
          {status === 'failed' && (
            <span className="text-font-small-bold h-4 px-1 leading-4 text-error border-0.5 border-error bg-error-low rounded">
              <T id="failedBadge" />
            </span>
          )}
          {status === 'success' && (
            <span className="text-font-small-bold h-4 px-1 leading-4 text-success border-0.5 border-success bg-success-low rounded">
              <T id="successBadge" />
            </span>
          )}
        </div>
        <div className="text-font-num-12 text-grey-1 truncate">
          <T id="toLabel" /> <HashShortView hash={recipient} firstCharsCount={6} lastCharsCount={4} />
        </div>
      </div>

      <div className="hidden group-hover:flex items-center gap-x-0.5 text-secondary text-font-description-bold">
        <T id="details" />
        <IconBase Icon={ChevronRightIcon} size={16} />
      </div>

      <div className="flex group-hover:hidden flex-col items-end">
        <span className="text-font-num-14">
          -<Money smallFractionFont={false}>{bnAmount}</Money> {fromAsset.symbol}
        </span>
        {hasFromFiat && (
          <InFiat assetSlug={fromAsset.assetSlug!} chainId={fromAsset.chainId!} volume={bnAmount} evm={isEvm}>
            {({ balance, symbol, noPrice }) =>
              noPrice ? (
                <span className="text-font-num-12 text-grey-1">—</span>
              ) : (
                <span className="text-font-num-12 text-grey-1">
                  {balance} {symbol}
                </span>
              )
            }
          </InFiat>
        )}
      </div>
    </button>
  );
});

