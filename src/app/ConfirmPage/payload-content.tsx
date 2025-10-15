import React, { FC, memo } from 'react';

import type { Omit as StrictOmit } from 'viem';

import { CaptionAlert, IconBase } from 'app/atoms';
import { ReactComponent as UnlockFillIcon } from 'app/icons/base/unlock_fill.svg';
import { AccountCard } from 'app/templates/account-card';
import { EvmTransactionView } from 'app/templates/EvmTransactionView';
import { SignPayloadView } from 'app/templates/SignPayloadView';
import { TezosTransactionView } from 'app/templates/TezosTransactionView';
import { TEMPLE_ICON } from 'content-scripts/constants';
import { t, T, TID } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front/client';
import {
  TempleMessageType,
  EvmTransactionRequestWithSender,
  StoredAccount,
  TempleEvmDAppPayload,
  TempleEvmDAppTransactionPayload,
  TempleTezosDAppOperationsPayload,
  TempleTezosDAppPayload,
  EIP6963ProviderInfo
} from 'lib/temple/types';
import { makeIntercomRequest } from 'temple/front/intercom-client';
import { NetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { AddAssetView } from './add-asset/add-asset-view';
import { AddChainView } from './add-chain/add-chain-view';

type DAppPayload<T extends TempleChainKind> = T extends TempleChainKind.EVM
  ? TempleEvmDAppPayload
  : TempleTezosDAppPayload;

type DAppOperationsPayload<T extends TempleChainKind> = T extends TempleChainKind.EVM
  ? TempleEvmDAppTransactionPayload
  : TempleTezosDAppOperationsPayload;

interface OperationViewPropsBase<T extends TempleChainKind> {
  network: NetworkEssentials<T>;
  payload: DAppOperationsPayload<T>;
  error: any;
  formId: string;
  onSubmit: EmptyFn;
}

interface PayloadContentPropsBase<T extends TempleChainKind> extends Omit<OperationViewPropsBase<T>, 'payload'> {
  account: StoredAccount;
  payload: DAppPayload<T>;
  openAccountsModal: EmptyFn;
}

const permissionsDescriptionsI18nKeys: TID[] = [
  'viewWalletPermissionDescription',
  'transactionsPermissionDescription',
  'signingPermissionDescription'
];

const ConnectViewConflict = memo<{
  providers?: EIP6963ProviderInfo[];
  origin?: string;
  onSubmit: EmptyFn;
  dismissConflict?: EmptyFn;
}>(({ providers, origin, dismissConflict }) => {
  useTempleClient();

  const domain = (() => {
    try {
      return origin ? new URL(origin).hostname : new URL(window.origin).hostname;
    } catch {
      return origin || window.origin;
    }
  })();

  const selectOtherWallet = async (provider: EIP6963ProviderInfo) => {
    try {
      await makeIntercomRequest({
        type: TempleMessageType.DAppSelectOtherWalletRequest,
        origin: origin || window.origin,
        rdns: provider.rdns,
        uuid: provider.uuid
      });
    } catch (e) {}
    window.close();
  };

  return (
    <div className="flex flex-col gap-4">
      <CaptionAlert className="mt-1" type="info" message={t('selectWalletCaption', domain)} />

      <div className="flex flex-col gap-3">
        <p className="text-xs text-grey-1">
          <T id="suggested" />
        </p>
        <button
          type="button"
          onClick={dismissConflict}
          className="w-full text-left bg-white rounded-xl shadow-bottom border border-transparent hover:border-lines cursor-pointer"
        >
          <div className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded flex items-center justify-center">
              <img src={TEMPLE_ICON} alt="Temple Wallet" className="w-9 h-9 object-contain" />
            </div>
            <div className="text-font-title">Temple Wallet</div>
          </div>
        </button>
      </div>

      {!!providers?.length && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-grey-1">
            <T id="otherWallets" />
          </p>
          {providers.map(provider => (
            <button
              key={provider.uuid}
              type="button"
              className="w-full text-left bg-white rounded-xl shadow-bottom border border-transparent hover:border-lines cursor-pointer"
              onClick={() => selectOtherWallet(provider)}
            >
              <div className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-grey-5 flex items-center justify-center overflow-hidden">
                  <img src={provider.icon} alt={provider.name} className="w-9 h-9 object-contain" />
                </div>
                <div className="text-font-title">{provider.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const ConnectViewDefault = memo<{
  account: StoredAccount;
  openAccountsModal: EmptyFn;
}>(({ account, openAccountsModal }) => {
  return (
    <div className="flex flex-col gap-4">
      <AccountCard
        showCompactDownIcon
        account={account}
        isCurrent={false}
        attractSelf={false}
        searchValue=""
        showRadioOnHover={false}
        alwaysShowAddresses
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
  );
});

const isConfirmOperationsPayload = <T extends TempleChainKind>(
  payload: DAppPayload<T>
): payload is DAppOperationsPayload<T> => payload.type === 'confirm_operations';

const PayloadContentHOC = <
  T extends TempleChainKind,
  E extends StrictOmit<StringRecord<unknown>, keyof PayloadContentPropsBase<T>>
>(
  OperationView: FC<OperationViewPropsBase<T> & E>
) => {
  const PayloadContent: FC<
    PayloadContentPropsBase<T> & { extraProps: E; dismissConflict?: () => void; showConflict?: boolean }
  > = ({
    network,
    payload,
    error,
    account,
    formId,
    onSubmit,
    openAccountsModal,
    extraProps,
    dismissConflict,
    showConflict
  }) => (
    <div className="w-full flex flex-col gap-4">
      {(() => {
        if (payload.type === 'connect') {
          const providers: EIP6963ProviderInfo[] | undefined = 'providers' in payload ? payload.providers : undefined;
          if (providers?.length && showConflict) {
            return (
              <ConnectViewConflict
                providers={providers}
                origin={payload.origin}
                onSubmit={onSubmit}
                dismissConflict={dismissConflict}
              />
            );
          }
          return <ConnectViewDefault account={account} openAccountsModal={openAccountsModal} />;
        }

        if (payload.type === 'sign' || payload.type === 'personal_sign' || payload.type === 'sign_typed') {
          return <SignPayloadView payload={payload} />;
        }

        if (isConfirmOperationsPayload(payload)) {
          return (
            <OperationView
              network={network}
              payload={payload}
              error={error}
              formId={formId}
              onSubmit={onSubmit}
              {...extraProps}
            />
          );
        }

        if (payload.type === 'add_asset') {
          return <AddAssetView metadata={payload.metadata} />;
        }

        if (payload.type === 'add_chain') {
          return <AddChainView metadata={payload.metadata} />;
        }

        return null;
      })()}
    </div>
  );

  return PayloadContent;
};

export const TezosPayloadContent = PayloadContentHOC<
  TempleChainKind.Tezos,
  { setTotalFee: SyncFn<number>; setStorageLimit: SyncFn<number> }
>(TezosTransactionView);

export const EvmPayloadContent = PayloadContentHOC<
  TempleChainKind.EVM,
  { setFinalEvmTransaction: ReactSetStateFn<EvmTransactionRequestWithSender> }
>(EvmTransactionView);
