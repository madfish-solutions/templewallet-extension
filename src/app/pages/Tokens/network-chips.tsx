import { FC } from 'react';

import { TotalEquity } from 'app/atoms/TotalEquity';
import { useGetEvmChainAccountTotalBalance } from 'app/hooks/total-balance/use-evm-account-total-balance';
import { useTezosTotalBalance } from 'app/hooks/total-balance/use-tezos-total-balance';
import { useTokensSelectedChainsState } from 'app/hooks/use-assets-view-state';
import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { NetworkChips as NetworkChipsTemplate } from 'app/templates/network-chips';
import { OneOfChains, useAccount, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface NetworkChipsProps {
  applicableNetworks: OneOfChains[];
}

export const NetworkChips: FC<NetworkChipsProps> = ({ applicableNetworks }) => {
  const { hideSmallBalance } = useTokensListOptionsSelector();
  const { selectedChains, setSelectedChains } = useTokensSelectedChainsState();
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const account = useAccount();

  const totalTezBalanceInDollar = useTezosTotalBalance(accountTezAddress ?? '', hideSmallBalance, false);
  const getEvmChainAccountTotalBalance = useGetEvmChainAccountTotalBalance(
    accountEvmAddress ?? '0x',
    hideSmallBalance,
    false
  );

  const getChainTotalBalance = (chain: OneOfChains) =>
    chain.kind === TempleChainKind.Tezos ? totalTezBalanceInDollar : getEvmChainAccountTotalBalance(chain.chainId);
  const sortedNetworks = testnetModeEnabled
    ? applicableNetworks
    : applicableNetworks.toSorted((a, b) => Number(getChainTotalBalance(b)) - Number(getChainTotalBalance(a)));

  return (
    <NetworkChipsTemplate
      chips={sortedNetworks.map(chain => ({
        chain,
        label: (
          <TotalEquity
            account={account}
            filterChain={chain}
            currency="fiat"
            tooltip={false}
            ignoreSmallBalances={hideSmallBalance}
            includeDeposits={false}
          />
        )
      }))}
      selectedChains={selectedChains}
      setSelectedChains={setSelectedChains}
    />
  );
};
