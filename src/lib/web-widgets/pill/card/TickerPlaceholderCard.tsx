import React, { useEffect, useState } from 'react';

import { ReactComponent as SadSearchIcon } from 'app/icons/monochrome/sad-search.svg';
import type { ChartPoint } from 'lib/temple/back/web-widgets/fetch-token-market';

import type { TagData } from '../../engine/types';
import * as messaging from '../../messaging';

import { CardHeader } from './CardHeader';
import { MiniChart } from './MiniChart';
import { formatPrice, TickerInfo, TickerInfoPanel } from './TickerInfoPanel';

interface TickerPlaceholderCardProps {
  tagData: TagData;
  onClose: EmptyFn;
}

const ThreeDotsIcon = () => (
  <svg className="tw-card__more-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="1.1" fill="currentColor" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    <circle cx="12" cy="17" r="1.1" fill="currentColor" />
  </svg>
);

export const TickerPlaceholderCard = ({ tagData, onClose }: TickerPlaceholderCardProps) => {
  const symbol = tagData.label;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [info, setInfo] = useState<TickerInfo | null>(null);
  const [series, setSeries] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    let active = true;

    messaging
      .getCoinsBySymbol()
      .then(coins => {
        if (!active) return;
        const entry = coins[symbol.toUpperCase()];
        if (!entry) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setInfo({
          price: entry.price,
          change24h: entry.change24h,
          marketCap: entry.marketCap,
          fdv: entry.fdv,
          volume: entry.volume,
          high24: entry.high24,
          low24: entry.low24
        });
        setLoading(false);

        messaging
          .fetchTokenChart(entry.id)
          .then(points => {
            if (active) setSeries(points);
          })
          .catch(() => {})
          .finally(() => {
            if (active) setChartLoading(false);
          });
      })
      .catch(() => {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [symbol]);

  const handleSnooze = () => {
    messaging.trackWebWidgetEvent('Web Token Widget / Snooze').catch(() => {});
    messaging.snoozeWebWidgets().catch(() => {});
    onClose();
  };
  const handleDisable = () => {
    messaging.trackWebWidgetEvent('Web Token Widget / Disable').catch(() => {});
    messaging.disableWebWidgets().catch(() => {});
    onClose();
  };

  if (loading) {
    return (
      <div className="tw-card">
        <div className="tw-card__body tw-card__body--state">
          <div className="tw-card__state">
            <div className="tw-card__spinner-box">
              <span className="tw-card__spinner" />
            </div>
            <div className="tw-card__loading-text">Loading token...</div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !info) {
    return (
      <div className="tw-card">
        <div className="tw-card__body tw-card__body--state">
          <div className="tw-card__state">
            <SadSearchIcon className="tw-card__sadface" />
            <div className="tw-card__state-text tw-card__state-text--bold">Couldn't find anything about this token</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-card">
      <CardHeader
        tokenSymbol={tagData.label}
        tokenAvatarUrl={tagData.iconUrl}
        menuIcon={<ThreeDotsIcon />}
        onClose={onClose}
        onSnooze={handleSnooze}
        onDisable={handleDisable}
      />
      <div className="tw-card__panel">
        <div className="tw-card__ticker-row">
          <TickerInfoPanel market={info} />
          <div className="tw-card__chart">
            {chartLoading ? (
              <div className="tw-card__chart-loader">
                <span className="tw-card__spinner" />
              </div>
            ) : (
              <MiniChart
                data={series}
                width={202}
                height={108}
                highLabel={info.high24 != null ? formatPrice(info.high24) : undefined}
                lowLabel={info.low24 != null ? formatPrice(info.low24) : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
