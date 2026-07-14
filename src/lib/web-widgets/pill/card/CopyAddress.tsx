import React, { useState } from 'react';

import clsx from 'clsx';

interface CopyAddressProps {
  contract: string;
  symbol: string;
}

const CopyIcon = () => (
  <svg className="tw-card__copy-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const CopyAddress = ({ contract, symbol }: CopyAddressProps) => {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(contract).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {}
    );
  };

  return (
    <button
      className={clsx('tw-card__token-label tw-card__token-label--copyable', copied && 'tw-card__token-label--copied')}
      type="button"
      aria-label="Copy contract address"
      onClick={handleClick}
    >
      <span className="tw-card__token-symbol">{symbol}</span>
      <CopyIcon />
      {copied ? <span className="tw-card__copy-tip">Copied</span> : null}
    </button>
  );
};
