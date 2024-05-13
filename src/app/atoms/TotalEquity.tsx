import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useTotalBalance } from 'app/hooks/use-total-balance';
import { useSelector } from 'app/store';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { useFiatCurrency, useFiatToUsdRate } from 'lib/fiat-currency';
import { getTezosGasMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID, type StoredAccount } from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';
import { getAccountAddressForTezos, getAccountAddressForEvm } from 'temple/accounts';
import { getReadOnlyEvm } from 'temple/evm';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useEthereumMainnetChain, useTezosMainnetChain } from 'temple/front';

import Money from './Money';

export type EquityCurrency = 'tez' | 'eth' | 'btc' | 'fiat';

interface Props {
  account: StoredAccount;
  currency: EquityCurrency;
}

export const TotalEquity = memo<Props>(({ account, currency }) => {
  const tezosPkh = getAccountAddressForTezos(account);

  if (tezosPkh) return <TotalEquityForTezosOnly accountPkh={tezosPkh} targetCurrency={currency} />;

  const evmAddress = getAccountAddressForEvm(account);

  if (evmAddress) return <TotalEquityForEvmOnly address={evmAddress} targetCurrency={currency} />;

  return null;
});

const TotalEquityForTezosOnly = memo<{ accountPkh: string; targetCurrency: EquityCurrency }>(
  ({ accountPkh, targetCurrency }) => {
    const totalTezosBalanceInDollar = useTotalBalance(accountPkh, TEZOS_MAINNET_CHAIN_ID);

    if (targetCurrency === 'fiat') return <TotalEquityForTezosOnlyInFiat amountInDollar={totalTezosBalanceInDollar} />;

    if (targetCurrency === 'tez')
      return <TotalEquityForTezosOnlyInGas accountPkh={accountPkh} amountInDollar={totalTezosBalanceInDollar} />;

    return <span>{UNDER_DEVELOPMENT_MSG}</span>;
  }
);

const TotalEquityForTezosOnlyInFiat = memo<{ amountInDollar: string }>(({ amountInDollar }) => {
  const {
    selectedFiatCurrency: { symbol: fiatSymbol }
  } = useFiatCurrency();

  const fiatToUsdRate = useFiatToUsdRate();

  const amountInFiat = useMemo(
    () => (isTruthy(fiatToUsdRate) ? new BigNumber(amountInDollar).times(fiatToUsdRate) : ZERO),
    [amountInDollar, fiatToUsdRate]
  );

  return (
    <>
      {/* <span className="mr-1">≈</span> */}
      <Money smallFractionFont={false} fiat>
        {amountInFiat}
      </Money>
      <span style={SYMBOL_STYLE}>{fiatSymbol}</span>
    </>
  );
});

const TotalEquityForTezosOnlyInGas = memo<{ accountPkh: string; amountInDollar: string }>(
  ({ amountInDollar, accountPkh }) => {
    const network = useTezosMainnetChain();
    const { symbol: gasTokenSymbol } = getTezosGasMetadata(TEZOS_MAINNET_CHAIN_ID);

    const tezosToUsdRate = useSelector(state => state.currency.usdToTokenRates.data[TEZ_TOKEN_SLUG]);
    const { value: gasBalance } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

    const amountInGas = useMemo(() => {
      const amountInDollarBN = new BigNumber(amountInDollar);

      const { decimals } = getTezosGasMetadata(network.chainId);

      return amountInDollarBN.isZero() || !isTruthy(tezosToUsdRate)
        ? gasBalance
        : amountInDollarBN.dividedBy(tezosToUsdRate).decimalPlaces(decimals);
    }, [gasBalance, tezosToUsdRate, amountInDollar, network.chainId]);

    return (
      <>
        <Money smallFractionFont={false}>{amountInGas || ZERO}</Money>
        <span style={SYMBOL_STYLE}>{gasTokenSymbol}</span>
      </>
    );
  }
);

const TotalEquityForEvmOnly = memo<{ address: HexString; targetCurrency: EquityCurrency }>(
  ({ address, targetCurrency }) => {
    const mainnetChain = useEthereumMainnetChain();
    const currency = mainnetChain.currency;

    const viemClient = getReadOnlyEvm(mainnetChain.rpcBaseURL);

    const { data, isLoading } = useTypedSWR(['evm-gas-balance', address, mainnetChain.rpcBaseURL], () =>
      viemClient.getBalance({ address })
    );

    const balanceStr = useMemo(
      () => (data ? atomsToTokens(String(data), currency.decimals).toFixed(6) : '0'),
      [data, currency.decimals]
    );

    if (targetCurrency !== 'eth') return <span>{UNDER_DEVELOPMENT_MSG}</span>;

    if (isLoading) return <span>Loading...</span>;

    return (
      <>
        <Money smallFractionFont={false}>{balanceStr}</Money>
        <span style={SYMBOL_STYLE}>{currency.symbol}</span>
      </>
    );
  }
);

const SYMBOL_STYLE = { marginLeft: `${4 / 24}em` };
