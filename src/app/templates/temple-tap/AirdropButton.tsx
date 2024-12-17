import React, { memo } from 'react';

import clsx from 'clsx';

import { useAppEnv } from 'app/env';
import { Link } from 'lib/woozie';

export const AirdropButton = memo(() => {
  const { popup } = useAppEnv();

  return (
    <Link to="/temple-tap-airdrop" className={clsx('h-7', popup && '-mr-2')}>
      <img
        src={`/misc/${popup ? 'airdrop-popup-btn.png' : 'airdrop-btn.png'}`}
        alt="Temple Tap Airdrop"
        className="pointer-events-none"
        style={{ height: 35 }}
      />
    </Link>
  );
});
