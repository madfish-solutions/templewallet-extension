import React, { FC, memo } from 'react';

import { IconBase } from 'app/atoms';
import { ReactComponent as UnlockFillIcon } from 'app/icons/base/unlock_fill.svg';
import { AccountCard } from 'app/templates/AccountCard';
import { EvmOperationView } from 'app/templates/EvmOperationView';
import { ModifyFeeAndLimit } from 'app/templates/ExpensesView/ExpensesView';
import TezosOperationView from 'app/templates/TezosOperationView';
import { T, TID } from 'lib/i18n';
import { StoredAccount, TempleEvmDAppPayload, TempleTezosDAppPayload } from 'lib/temple/types';
import { NetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

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
  account: StoredAccount;
  payload: DAppPayload<T>;
  openAccountsModal: EmptyFn;
}

interface ConnectViewProps {
  accountToConnect: StoredAccount;
  openAccountsModal: EmptyFn;
}

const permissionsDescriptionsI18nKeys: TID[] = [
  'viewWalletPermissionDescription',
  'transactionsPermissionDescription',
  'signingPermissionDescription'
];

const ConnectView = memo<ConnectViewProps>(({ accountToConnect, openAccountsModal }) => (
  <div className="w-full flex flex-col gap-4">
    <AccountCard
      account={accountToConnect}
      isCurrent={false}
      attractSelf={false}
      searchValue=""
      showRadioOnHover={false}
      onClick={openAccountsModal}
    />

    <div className="bg-white shadow-bottom rounded-lg p-4">
      <p className="my-1 text-font-description-bold text-grey-1">
        <T id="permissions" />
      </p>
      {permissionsDescriptionsI18nKeys.map(key => (
        <div className="flex justify-between items-center py-2.5" key={key}>
          <span className="text-font-description">
            <T id={key} />
          </span>
          <div className="bg-grey-4 rounded-md pl-1.5 pr-2 py-1 flex items-center gap-px">
            <IconBase Icon={UnlockFillIcon} size={12} className="text-success" />

            <span className="text-font-num-bold-10 uppercase">
              <T id="allowed" />
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
));

const PayloadContentHOC =
  <T extends TempleChainKind>(OperationView: FC<OperationViewProps<T>>) =>
  ({ network, payload, error, modifyFeeAndLimit, account, openAccountsModal }: PayloadContentProps<T>) =>
    payload.type === 'connect' ? (
      <ConnectView accountToConnect={account} openAccountsModal={openAccountsModal} />
    ) : (
      <OperationView
        network={network}
        payload={payload as OperationDAppPayload<T>}
        error={error}
        modifyFeeAndLimit={modifyFeeAndLimit}
      />
    );

export const TezosPayloadContent = PayloadContentHOC<TempleChainKind.Tezos>(TezosOperationView);

export const EvmPayloadContent = PayloadContentHOC<TempleChainKind.EVM>(EvmOperationView);
