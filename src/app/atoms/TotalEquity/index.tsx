import React, { memo } from 'react';

import { useEvmAccountTotalBalance } from 'app/hooks/total-balance/use-evm-account-total-balance';
import { useEvmChainTotalBalance } from 'app/hooks/total-balance/use-evm-chain-total-balance';
import { useMultiChainTotalBalance } from 'app/hooks/total-balance/use-multi-chain-total-balance';
import { useTezosTotalBalance } from 'app/hooks/total-balance/use-tezos-total-balance';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { StoredAccount, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { TempleChainKind } from 'temple/types';

import { TotalEquityBase } from './TotalEquityBase';
import { EquityCurrency } from './types';

interface TotalEquityProps {
  account: StoredAccount;
  currency: EquityCurrency;
  filterChain?: FilterChain;
}

/** Total balance is dollar value of displayed tokens, taken from store */
export const TotalEquity = memo<TotalEquityProps>(({ account, currency, filterChain = null }) => {
  const accountTezAddress = getAccountAddressForTezos(account);
  const accountEvmAddress = getAccountAddressForEvm(account);

  const isTezosFilter = filterChain?.kind === TempleChainKind.Tezos && filterChain?.chainId === TEZOS_MAINNET_CHAIN_ID;
  const isEvmFilter = filterChain?.kind === TempleChainKind.EVM;

  if (isTezosFilter && accountTezAddress)
    return <TezosTotalEquity accountTezAddress={accountTezAddress} currency={currency} />;

  if (isEvmFilter && accountEvmAddress)
    return (
      <EvmChainTotalEquity accountEvmAddress={accountEvmAddress} chainId={filterChain.chainId} currency={currency} />
    );

  if (!filterChain && accountTezAddress && accountEvmAddress)
    return (
      <MultiChainTotalEquity
        accountTezAddress={accountTezAddress}
        accountEvmAddress={accountEvmAddress}
        currency={currency}
      />
    );

  if (!filterChain && accountTezAddress)
    return <TezosTotalEquity accountTezAddress={accountTezAddress} currency={currency} />;

  if (!filterChain && accountEvmAddress)
    return <EvmAccountTotalEquity accountEvmAddress={accountEvmAddress} currency={currency} />;

  return <TotalEquityBase totalBalanceInDollar="0" targetCurrency={currency} />;
});

interface MultiChainTotalEquityProps extends Pick<TotalEquityProps, 'currency'> {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

const MultiChainTotalEquity = memo<MultiChainTotalEquityProps>(({ accountTezAddress, accountEvmAddress, currency }) => {
  const totalBalanceInDollar = useMultiChainTotalBalance(accountTezAddress, accountEvmAddress);

  return <TotalEquityBase totalBalanceInDollar={totalBalanceInDollar} targetCurrency={currency} />;
});

interface EvmChainTotalEquityProps extends Pick<TotalEquityProps, 'currency'> {
  accountEvmAddress: HexString;
  chainId: number;
}

const EvmChainTotalEquity = memo<EvmChainTotalEquityProps>(({ accountEvmAddress, chainId, currency }) => {
  const totalBalanceInDollar = useEvmChainTotalBalance(accountEvmAddress, chainId);

  return <TotalEquityBase totalBalanceInDollar={totalBalanceInDollar} targetCurrency={currency} />;
});

interface EvmAccountTotalEquityProps extends Pick<TotalEquityProps, 'currency'> {
  accountEvmAddress: HexString;
}

const EvmAccountTotalEquity = memo<EvmAccountTotalEquityProps>(({ accountEvmAddress, currency }) => {
  const totalBalanceInDollar = useEvmAccountTotalBalance(accountEvmAddress);

  return <TotalEquityBase totalBalanceInDollar={totalBalanceInDollar} targetCurrency={currency} />;
});

interface TezosTotalEquityProps extends Pick<TotalEquityProps, 'currency'> {
  accountTezAddress: string;
}

const TezosTotalEquity = memo<TezosTotalEquityProps>(({ accountTezAddress, currency }) => {
  const totalBalanceInDollar = useTezosTotalBalance(accountTezAddress);

  return <TotalEquityBase totalBalanceInDollar={totalBalanceInDollar} targetCurrency={currency} />;
});
