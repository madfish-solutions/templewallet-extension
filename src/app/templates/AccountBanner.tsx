import React, { FC, HTMLAttributes, memo, ReactNode, useMemo } from 'react';

import classNames from 'clsx';

import { AccountTypeBadge, Money, Name } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { BalanceProps, EvmBalance, TezosBalance } from 'app/templates/Balance';
import { t } from 'lib/i18n';
import { useTezosGasMetadata, TEZOS_METADATA, useEvmGasMetadata } from 'lib/metadata';
import { StoredAccount } from 'lib/temple/types';
import { AccountForChain, getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { DEFAULT_EVM_CURRENCY, EvmNetworkEssentials, NetworkEssentials, TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

interface Props extends HTMLAttributes<HTMLDivElement> {
  account: StoredAccount | AccountForChain;
  tezosNetwork?: TezosNetworkEssentials;
  evmNetwork?: EvmNetworkEssentials;
  label?: ReactNode;
  labelDescription?: ReactNode;
  labelIndent?: 'sm' | 'md';
  smallLabelIndent?: boolean;
}

const AccountBanner = memo<Props>(
  ({ tezosNetwork, evmNetwork, account, className, label, smallLabelIndent, labelDescription }) => {
    const labelWithFallback = label ?? t('account');

    const [tezosAddress, evmAddress] = useMemo(() => {
      if ('chain' in account && 'address' in account) {
        return [
          getAccountForChainAddress(account, TempleChainKind.Tezos),
          getAccountForChainAddress(account, TempleChainKind.EVM)
        ];
      }

      return [getAccountAddressForTezos(account), getAccountAddressForEvm(account)];
    }, [account]);

    return (
      <div className={classNames('flex flex-col', className)}>
        {(labelWithFallback || labelDescription) && (
          <h2 className={classNames(smallLabelIndent ? 'mb-2' : 'mb-4', 'leading-tight flex flex-col')}>
            {labelWithFallback && <span className="text-font-regular-bold text-gray-700">{labelWithFallback}</span>}

            {labelDescription && (
              <span className="mt-1 text-font-description font-light text-gray-600 max-w-9/10">{labelDescription}</span>
            )}
          </h2>
        )}

        <div className="w-full border rounded-md p-2 flex items-center">
          <AccountAvatar seed={account.id} size={32} className="flex-shrink-0" />

          <div className="flex flex-col items-start ml-2">
            <div className="flex flex-wrap items-center">
              <Name className="text-font-medium font-medium leading-tight text-gray-800">{account.name}</Name>

              <AccountTypeBadge accountType={account.type} />
            </div>

            <TezosAddressView network={tezosNetwork} address={tezosAddress} />
            <EvmAddressView network={evmNetwork} address={evmAddress} />
          </div>
        </div>
      </div>
    );
  }
);

export default AccountBanner;

interface AccountBannerAddressProps {
  address: string;
}

interface BalanceViewProps<T extends TempleChainKind> {
  network: NetworkEssentials<T>;
  address: string;
}

const BalanceViewHOC = <T extends TempleChainKind>(
  Balance: FC<BalanceProps<T>>,
  useGasMetadata: (chainId: NetworkEssentials<T>['chainId']) => { symbol?: string } | undefined,
  fallbackSymbol: string
) =>
  memo<BalanceViewProps<T>>(({ network, address }) => {
    const gasMetadata = useGasMetadata(network.chainId);

    return (
      <Balance network={network} address={address as HexString}>
        {bal => (
          <div className="ml-2 text-font-description leading-none flex items-baseline text-gray-600">
            <Money>{bal}</Money>
            <span className="ml-1" style={{ fontSize: '0.75em' }}>
              {gasMetadata?.symbol ?? fallbackSymbol}
            </span>
          </div>
        )}
      </Balance>
    );
  });

const AccountAddressViewHOC = <T extends TempleChainKind>(
  Balance: FC<BalanceProps<T>>,
  useGasMetadata: (chainId: NetworkEssentials<T>['chainId']) => { symbol?: string } | undefined,
  fallbackSymbol: string
) => {
  const BalanceView = BalanceViewHOC(Balance, useGasMetadata, fallbackSymbol);

  return memo<Partial<BalanceViewProps<T>>>(({ network, address }) =>
    address ? (
      <div className="flex flex-wrap items-center mt-1">
        <AccountBannerAddress address={address} />

        {network && <BalanceView network={network} address={address} />}
      </div>
    ) : null
  );
};

const TezosAddressView = AccountAddressViewHOC(TezosBalance, useTezosGasMetadata, TEZOS_METADATA.symbol);
const EvmAddressView = AccountAddressViewHOC(EvmBalance, useEvmGasMetadata, DEFAULT_EVM_CURRENCY.symbol);

const AccountBannerAddress = memo<AccountBannerAddressProps>(({ address }) => {
  const [start, end] = useMemo(() => {
    const ln = address.length;

    return [address.slice(0, 7), address.slice(ln - 4, ln)];
  }, [address]);

  return (
    <div className="text-xs leading-none text-gray-700">
      {start}
      <span className="opacity-75">...</span>
      {end}
    </div>
  );
});

const getAccountForChainAddress = (account: AccountForChain, chain: TempleChainKind) =>
  account.chain === chain ? account.address : undefined;
