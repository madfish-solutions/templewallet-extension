import React, { FC, NamedExoticComponent, memo, useMemo } from 'react';

import { AccountAvatar } from 'app/atoms/AccountAvatar';
import CustomSelect, { OptionRenderProps } from 'app/templates/CustomSelect';
import { EvmOperationView } from 'app/templates/EvmOperationView';
import { ModifyFeeAndLimit } from 'app/templates/ExpensesView/ExpensesView';
import TezosOperationView from 'app/templates/TezosOperationView';
import { T } from 'lib/i18n';
import { TempleEvmDAppPayload, TempleTezosDAppPayload } from 'lib/temple/types';
import { AccountForChain } from 'temple/accounts';
import { NetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { EvmAccountOptionContentHOC, TezosAccountOptionContentHOC } from './account-option';

interface ConnectViewProps<T extends TempleChainKind> {
  accounts: AccountForChain<T>[];
  accountPkhToConnect: string;
  setAccountPkhToConnect: SyncFn<string>;
  network: NetworkEssentials<T>;
}

type DAppPayload<T extends TempleChainKind> = T extends TempleChainKind.EVM
  ? TempleEvmDAppPayload
  : TempleTezosDAppPayload;

type OperationDAppPayload<T extends TempleChainKind> = Exclude<DAppPayload<T>, { type: 'connect' }>;

interface OperationViewProps<T extends TempleChainKind> {
  network: NetworkEssentials<T>;
  payload: OperationDAppPayload<T>;
  error?: any;
  modifyFeeAndLimit?: ModifyFeeAndLimit;
}

interface PayloadContentProps<T extends TempleChainKind> extends Omit<OperationViewProps<T>, 'payload'> {
  accountPkhToConnect: string;
  payload: DAppPayload<T>;
  accounts: AccountForChain<T>[];
  setAccountPkhToConnect: SyncFn<string>;
}

type AccountOptionContentHOC<T extends TempleChainKind> = (
  network: NetworkEssentials<T>
) => NamedExoticComponent<OptionRenderProps<AccountForChain<T>, unknown>>;

const AccountIcon = <T extends TempleChainKind>({ item }: OptionRenderProps<AccountForChain<T>>) => (
  <AccountAvatar size={32} seed={item.id} className="flex-shrink-0" />
);

const getPkh = (account: AccountForChain) => account.address;

const ConnectViewHOC = <T extends TempleChainKind>(AccountOptionContentHOC: AccountOptionContentHOC<T>) =>
  memo<ConnectViewProps<T>>(({ accounts, accountPkhToConnect, network, setAccountPkhToConnect }) => {
    const AccountOptionContent = useMemo(() => AccountOptionContentHOC(network), [network]);

    return (
      <div className="w-full flex flex-col">
        <h2 className="mb-2 leading-tight flex flex-col">
          <span className="text-base font-semibold text-gray-700">
            <T id="account" />
          </span>

          <span className="mt-px text-xs font-light text-gray-600 max-w-9/10">
            <T id="toBeConnectedWithDApp" />
          </span>
        </h2>

        <CustomSelect<AccountForChain<T>, string>
          activeItemId={accountPkhToConnect}
          getItemId={getPkh}
          items={accounts}
          maxHeight="8rem"
          onSelect={setAccountPkhToConnect}
          OptionIcon={AccountIcon}
          OptionContent={AccountOptionContent}
          autoFocus
        />
      </div>
    );
  });

const PayloadContentHOC = <T extends TempleChainKind>(
  AccountOptionContentHOC: AccountOptionContentHOC<T>,
  OperationView: FC<OperationViewProps<T>>
) => {
  const ConnectView = ConnectViewHOC(AccountOptionContentHOC);

  return ({
    network,
    payload,
    error,
    modifyFeeAndLimit,
    accounts,
    accountPkhToConnect,
    setAccountPkhToConnect
  }: PayloadContentProps<T>) =>
    payload.type === 'connect' ? (
      <ConnectView
        accounts={accounts}
        accountPkhToConnect={accountPkhToConnect}
        setAccountPkhToConnect={setAccountPkhToConnect}
        network={network}
      />
    ) : (
      <OperationView
        network={network}
        payload={payload as OperationDAppPayload<T>}
        error={error}
        modifyFeeAndLimit={modifyFeeAndLimit}
      />
    );
};

export const TezosPayloadContent = PayloadContentHOC(TezosAccountOptionContentHOC, TezosOperationView);

export const EvmPayloadContent = PayloadContentHOC(EvmAccountOptionContentHOC, EvmOperationView);
