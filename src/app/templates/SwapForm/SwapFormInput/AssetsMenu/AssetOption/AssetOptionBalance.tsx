import React from 'react';

import Money from 'app/atoms/Money';
import { useAccount, useBalance } from 'lib/temple/front';

interface Props {
  assetSlug: string;
}

export const AssetOptionBalance: React.FC<Props> = ({ assetSlug }) => {
  const { publicKeyHash } = useAccount();

  const balance = useBalance(assetSlug, publicKeyHash, {
    suspense: false
  });

  return balance.data ? (
    <Money smallFractionFont={false} tooltip={false}>
      {balance.data}
    </Money>
  ) : null;
};
