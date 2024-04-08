import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { useSelector } from 'app/store';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance } from 'lib/balances';
import { useTezosGasTokenMetadata } from 'lib/metadata';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';
import { TezosNetworkEssentials } from 'temple/networks';

interface Props {
  network: TezosNetworkEssentials;
  totalBalanceInDollar: string;
  currency: string;
  accountPkh: string;
}

export const BalanceGas = memo<Props>(({ network, totalBalanceInDollar, currency, accountPkh }) => {
  const { decimals } = useTezosGasTokenMetadata(network.chainId);
  const tezosToUsdRate = useSelector(state => state.currency.usdToTokenRates.data[TEZ_TOKEN_SLUG]);
  const { value: gasBalance } = useBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const volume = useMemo(() => {
    const totalBalanceInDollarBN = new BigNumber(totalBalanceInDollar);

    return totalBalanceInDollarBN.isZero() || !isTruthy(tezosToUsdRate)
      ? gasBalance
      : totalBalanceInDollarBN.dividedBy(tezosToUsdRate).decimalPlaces(decimals);
  }, [gasBalance, tezosToUsdRate, totalBalanceInDollar, decimals]);

  return (
    <>
      <Money smallFractionFont={false}>{volume || ZERO}</Money>
      <span className="ml-1">{currency}</span>
    </>
  );
});
