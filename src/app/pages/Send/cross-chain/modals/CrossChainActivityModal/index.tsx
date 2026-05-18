import React, { FC, Fragment, useEffect } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import { dispatch } from 'app/store';
import { dismissCrossChainBannerAction } from 'app/store/cross-chain-send/actions';
import { useCrossChainExchangesForAccountSelector } from 'app/store/cross-chain-send/selectors';
import { CrossChainExchange } from 'app/store/cross-chain-send/state';
import { formatDate, t } from 'lib/i18n';

import { CrossChainActivityRow } from '../../components/CrossChainActivityRow';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
  accountId: string | undefined;
  onExchangeClick: (exchange: CrossChainExchange) => void;
}

const getGroups = (exchanges: CrossChainExchange[]) => {
  const sorted = [...exchanges].sort((a, b) => b.createdAt - a.createdAt);
  const byDay = new Map<string, CrossChainExchange[]>();
  for (const ex of sorted) {
    const key = formatDate(ex.createdAt, 'PP');
    const list = byDay.get(key);
    if (list) list.push(ex);
    else byDay.set(key, [ex]);
  }
  return Array.from(byDay.entries());
};

export const CrossChainActivityModal: FC<Props> = ({ opened, onRequestClose, accountId, onExchangeClick }) => {
  const exchanges = useCrossChainExchangesForAccountSelector(accountId);

  useEffect(() => {
    if (!opened) return;
    exchanges
      .filter(e => e.phase === 'FAILED' && !e.bannerDismissed)
      .forEach(e => dispatch(dismissCrossChainBannerAction(e.id)));
  }, [opened, exchanges]);

  const groups = getGroups(exchanges);

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
                  <CrossChainActivityRow key={ex.id} exchange={ex} onClick={() => onExchangeClick(ex)} />
                ))}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </MiniPageModal>
  );
};
