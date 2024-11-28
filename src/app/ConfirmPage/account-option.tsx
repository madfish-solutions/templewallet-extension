import React, { FC, memo } from 'react';

import { AccountTypeBadge, HashShortView, Money, Name } from 'app/atoms';
import { BalanceProps, EvmBalance, TezosBalance } from 'app/templates/Balance';
import { OptionRenderProps } from 'app/templates/CustomSelect';
import { TEZOS_METADATA, getTezosGasMetadata, useEvmGasMetadata } from 'lib/metadata';
import { AccountForChain } from 'temple/accounts';
import { DEFAULT_EVM_CURRENCY, NetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

const makeAccountOptionContentHOC =
  <T extends TempleChainKind>(
    Balance: FC<BalanceProps<T>>,
    useGasMetadata: (chainId: NetworkEssentials<T>['chainId']) => { symbol?: string } | undefined,
    fallbackSymbol: string
  ) =>
  (networkEssentials: NetworkEssentials<T>) =>
    memo<OptionRenderProps<AccountForChain<T>>>(({ item: acc }) => {
      const gasMetadata = useGasMetadata(networkEssentials.chainId);

      return (
        <>
          <div className="flex flex-wrap items-center">
            <Name className="text-sm font-medium leading-tight">{acc.name}</Name>
            <AccountTypeBadge accountType={acc.type} />
          </div>

          <div className="flex flex-wrap items-center mt-1">
            <div className="text-xs leading-none text-gray-700">
              <HashShortView hash={acc.address} />
            </div>

            <Balance network={networkEssentials} address={acc.address as HexString}>
              {bal => (
                <div className="ml-2 text-xs leading-none flex items-baseline text-gray-600">
                  <Money>{bal}</Money>
                  <span className="ml-1" style={{ fontSize: '0.75em' }}>
                    {gasMetadata?.symbol ?? fallbackSymbol}
                  </span>
                </div>
              )}
            </Balance>
          </div>
        </>
      );
    });

export const TezosAccountOptionContentHOC = makeAccountOptionContentHOC(
  TezosBalance,
  getTezosGasMetadata,
  TEZOS_METADATA.symbol
);

export const EvmAccountOptionContentHOC = makeAccountOptionContentHOC(
  EvmBalance,
  useEvmGasMetadata,
  DEFAULT_EVM_CURRENCY.symbol
);
