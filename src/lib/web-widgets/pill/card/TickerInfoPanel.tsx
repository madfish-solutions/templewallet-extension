import React from 'react';

import clsx from 'clsx';

export interface TickerInfo {
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
  fdv: number | null;
  volume: number | null;
  high24: number | null;
  low24: number | null;
}

interface TickerInfoPanelProps {
  market: TickerInfo;
}

export const formatPrice = (value: number | null): string => {
  if (value == null) return '—';
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 100 ? 2 : abs >= 0.01 ? 4 : 8;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits })} $`;
};

export const formatCompact = (value: number | null): string => {
  if (value == null) return '—';
  return `${value.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 2 })} $`;
};

export const formatPercent = (value: number): string => `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}%`;

export const TickerInfoPanel = ({ market }: TickerInfoPanelProps) => {
  const { price, change24h, marketCap, fdv, volume } = market;
  const changeUp = change24h != null && change24h >= 0;

  return (
    <div className="tw-card__ticker-info">
      <div className="tw-card__ticker-headline">
        <div className="tw-card__ticker-price-row">
          <span className="tw-card__price">{formatPrice(price)}</span>
          {change24h != null ? (
            <span className={clsx('tw-card__change', changeUp ? 'tw-card__change--up' : 'tw-card__change--down')}>
              {formatPercent(change24h)}
            </span>
          ) : null}
        </div>
        <div className="tw-card__market-cap">Market cap: {formatCompact(marketCap)}</div>
      </div>
      <div className="tw-card__ticker-props-group">
        <div className="tw-card__divider" />
        <div className="tw-card__props">
          <div className="tw-card__prop">
            <span className="tw-card__prop-label">FDV:</span>
            <span className="tw-card__prop-value">{formatCompact(fdv)}</span>
          </div>
          <div className="tw-card__prop">
            <span className="tw-card__prop-label">24h volume:</span>
            <span className="tw-card__prop-value">{formatCompact(volume)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
