import React from 'react';

import Money from 'app/atoms/Money';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { useAccount, useBalance } from 'lib/temple/front';
import { isTruthy } from 'lib/utils';

interface Props {
  assetSlug: string;
}

export const AssetOptionBalance: React.FC<Props> = ({ assetSlug }) => {
  const { publicKeyHash } = useAccount();

  const balance = useBalance(assetSlug, publicKeyHash, {
    suspense: false
  });

  if (!isTruthy(balance.data)) return null;

  return (
    <>
      <span className="text-lg text-gray-910">
        <Money smallFractionFont={false} tooltip={false}>
          {balance.data}
        </Money>
      </span>
      <span className="text-xs text-gray-600">
        <Balance assetSlug={assetSlug} address={publicKeyHash}>
          {volume => (
            <InFiat assetSlug={assetSlug} volume={volume} smallFractionFont={false}>
              {({ balance, symbol }) => (
                <>
                  <span className="mr-1">≈</span>
                  {balance}
                  <span className="ml-1">{symbol}</span>
                </>
              )}
            </InFiat>
          )}
        </Balance>
      </span>
    </>
  );
};
