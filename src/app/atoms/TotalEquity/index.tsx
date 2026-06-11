import { FC } from 'react';

import { useEvmAccountTotalBalance } from 'app/hooks/total-balance/use-evm-account-total-balance';
import { useEvmChainTotalBalance } from 'app/hooks/total-balance/use-evm-chain-total-balance';
import { useMultiChainTotalBalance } from 'app/hooks/total-balance/use-multi-chain-total-balance';
import { useTezosTotalBalance } from 'app/hooks/total-balance/use-tezos-total-balance';
import { EquityCurrency } from 'app/hooks/use-equity-currency';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { StoredAccount, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { TempleChainKind } from 'temple/types';

import { TotalEquityBase } from './TotalEquityBase';

interface CommonTotalEquityProps {
  currency: EquityCurrency;
  tooltip?: boolean;
  ignoreSmallBalances?: boolean;
  includeDeposits?: boolean;
}

interface TotalEquityProps extends CommonTotalEquityProps {
  account: StoredAccount;
  filterChain?: FilterChain;
}

export const TotalEquity: FC<TotalEquityProps> = ({
  account,
  filterChain = null,
  includeDeposits = true,
  currency,
  tooltip,
  ignoreSmallBalances
}) => {
  const accountTezAddress = getAccountAddressForTezos(account);
  const accountEvmAddress = getAccountAddressForEvm(account);

  const isTezosFilter = filterChain?.kind === TempleChainKind.Tezos && filterChain?.chainId === TEZOS_MAINNET_CHAIN_ID;
  const isEvmFilter = filterChain?.kind === TempleChainKind.EVM;

  const commonProps = { includeDeposits, currency, tooltip, ignoreSmallBalances };

  if (isTezosFilter && accountTezAddress)
    return <TezosTotalEquity accountTezAddress={accountTezAddress} {...commonProps} />;

  if (isEvmFilter && accountEvmAddress)
    return <EvmChainTotalEquity accountEvmAddress={accountEvmAddress} chainId={filterChain.chainId} {...commonProps} />;

  if (!filterChain && accountTezAddress && accountEvmAddress)
    return (
      <MultiChainTotalEquity
        accountTezAddress={accountTezAddress}
        accountEvmAddress={accountEvmAddress}
        {...commonProps}
      />
    );

  if (!filterChain && accountTezAddress)
    return <TezosTotalEquity accountTezAddress={accountTezAddress} {...commonProps} />;

  if (!filterChain && accountEvmAddress)
    return <EvmAccountTotalEquity accountEvmAddress={accountEvmAddress} {...commonProps} />;

  return <TotalEquityBase totalBalanceInDollar="0" targetCurrency={currency} tooltip={tooltip} />;
};

const OneCaseTotalEquityHOC = <T extends CommonTotalEquityProps>(
  useTotalBalance: (input: Omit<T, 'currency' | 'tooltip'>) => string
) => {
  function OneCaseTotalEquity({ currency, tooltip, ...totalBalanceInput }: T) {
    const totalBalanceInDollar = useTotalBalance(totalBalanceInput);

    return <TotalEquityBase totalBalanceInDollar={totalBalanceInDollar} targetCurrency={currency} tooltip={tooltip} />;
  }

  return OneCaseTotalEquity;
};

interface MultiChainTotalEquityProps extends CommonTotalEquityProps {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

const MultiChainTotalEquity = OneCaseTotalEquityHOC<MultiChainTotalEquityProps>(
  ({ accountTezAddress, accountEvmAddress, ignoreSmallBalances, includeDeposits }) =>
    useMultiChainTotalBalance(accountTezAddress, accountEvmAddress, ignoreSmallBalances, includeDeposits)
);

interface EvmChainTotalEquityProps extends CommonTotalEquityProps {
  accountEvmAddress: HexString;
  chainId: number;
}

const EvmChainTotalEquity = OneCaseTotalEquityHOC<EvmChainTotalEquityProps>(
  ({ accountEvmAddress, chainId, ignoreSmallBalances, includeDeposits }) =>
    useEvmChainTotalBalance(accountEvmAddress, chainId, ignoreSmallBalances, includeDeposits)
);

interface EvmAccountTotalEquityProps extends CommonTotalEquityProps {
  accountEvmAddress: HexString;
}

const EvmAccountTotalEquity = OneCaseTotalEquityHOC<EvmAccountTotalEquityProps>(
  ({ accountEvmAddress, ignoreSmallBalances, includeDeposits }) =>
    useEvmAccountTotalBalance(accountEvmAddress, ignoreSmallBalances, includeDeposits)
);

interface TezosTotalEquityProps extends CommonTotalEquityProps {
  accountTezAddress: string;
}

const TezosTotalEquity = OneCaseTotalEquityHOC<TezosTotalEquityProps>(
  ({ accountTezAddress, ignoreSmallBalances, includeDeposits }) =>
    useTezosTotalBalance(accountTezAddress, ignoreSmallBalances, includeDeposits)
);
