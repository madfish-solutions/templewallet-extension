import React from 'react';

import { ReactComponent as TezosIcon } from 'app/icons/networks/tezos.svg';

import type { CardListingStatus } from './derive-card-state';

const STATUS_LABEL: Record<CardListingStatus, string> = {
  listed: 'Listed',
  'not-listed': 'Not listed',
  auction: 'Auction'
};

interface TrustRowProps {
  status: CardListingStatus;
  tokenId: string;
}

export const TrustRow = ({ status, tokenId }: TrustRowProps) => (
  <div className="tw-card__trust">
    <span className="tw-card__tag">
      <span className="tw-card__tezos-logo">
        <span className="tw-card__tezos-logo--inner">
          <TezosIcon className="tw-card__tezos-icon" />
        </span>
      </span>
      Tezos
    </span>
    <span className="tw-card__tag">{STATUS_LABEL[status]}</span>
    {tokenId ? <span className="tw-card__tag">ID: {tokenId}</span> : null}
  </div>
);
