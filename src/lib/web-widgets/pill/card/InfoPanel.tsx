import React from 'react';

import clsx from 'clsx';

import type { CardState } from './derive-card-state';

interface InfoPanelProps {
  name: string | null;
  state: CardState;
  fiatRate: number | null;
  owned: number | null;
}

const PriceBlock = ({ state, fiatRate }: { state: CardState; fiatRate: number | null }) => {
  const { status, priceTez, priceCurrency } = state;

  if (priceTez != null)
    return (
      <>
        <div className={clsx('tw-card__price', status === 'auction' && 'tw-card__price--auction')}>
          {priceTez.toFixed(2)} TEZ
        </div>
        {fiatRate != null ? <div className="tw-card__fiat">≈ {(priceTez * fiatRate).toFixed(2)} $</div> : null}
      </>
    );

  if (priceCurrency != null)
    return (
      <div className="tw-card__price">
        {priceCurrency.amount.toFixed(2)} {priceCurrency.symbol}
      </div>
    );

  return (
    <>
      <div className="tw-card__price">No value</div>
      <div className="tw-card__fiat">≈ 0.00 $</div>
    </>
  );
};

export const InfoPanel = ({ name, state, fiatRate, owned }: InfoPanelProps) => (
  <div className="tw-card__info">
    <div className="tw-card__name">{name || 'Untitled'}</div>
    <div className="tw-card__price-block">
      <PriceBlock state={state} fiatRate={fiatRate} />
    </div>
    <div className="tw-card__divider" />
    <div className="tw-card__props">
      <div className="tw-card__prop">
        <span className="tw-card__prop-label">Editions:</span>
        <span className="tw-card__prop-value">{state.editions ?? '—'}</span>
      </div>
      <div className="tw-card__prop">
        <span className="tw-card__prop-label">Owned:</span>
        <span className="tw-card__prop-value">{owned ?? '—'}</span>
      </div>
      <div className="tw-card__prop">
        <span className="tw-card__prop-label">Type:</span>
        <span className="tw-card__prop-value">{state.type ?? '—'}</span>
      </div>
    </div>
  </div>
);
