import React, { memo, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';

import { Button, Checkbox, Identicon } from 'app/atoms';
import CopyButton from 'app/atoms/CopyButton';
import { useAllAccountsReactiveOnRemoval } from 'app/hooks/use-all-accounts-reactive';
import { useTotalBalance } from 'app/hooks/use-total-balance';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useFiatCurrency } from 'lib/fiat-currency';
import { T, TID, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { getDerivationPath } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { useAlert } from 'lib/ui';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useAllAccounts, useCurrentAccountId, useTezosMainnetChain } from 'temple/front';
import { useSetAccountId } from 'temple/front/ready';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import { BalanceFiat } from '../Home/OtherComponents/MainBanner/BalanceFiat';

import { AccountAddressesModal } from './account-addresses-modal';
import { EditAccountNameModal } from './edit-account-name-modal';
import { RemoveAccountModal } from './remove-account-modal';
import { RevealPrivateKeyModal } from './reveal-private-key-modal';

interface AccountSettingsProps {
  id: string;
}

enum AccountSettingsModal {
  EditName,
  RevealPrivateKey,
  RemoveAccount,
  AccountAddresses
}

const typesLabelsI18nKeys: Record<TempleAccountType, TID> = {
  [TempleAccountType.HD]: 'hdAccount',
  [TempleAccountType.Imported]: 'importedAccount',
  [TempleAccountType.Ledger]: 'ledger',
  [TempleAccountType.ManagedKT]: 'managedKTAccount',
  [TempleAccountType.WatchOnly]: 'watchOnlyAccount'
};

const menuEntryClassName = 'w-full h-12 flex justify-between items-center px-3 rounded-lg border border-gray-300';
const menuEntryTextClassName = 'text-sm text-gray-900 font-semibold leading-5';

export const AccountSettings = memo<AccountSettingsProps>(({ id }) => {
  const alert = useAlert();
  const currentAccountId = useCurrentAccountId();
  const setAccountId = useSetAccountId();
  const { setAccountVisible } = useTempleClient();
  useAllAccountsReactiveOnRemoval();
  const allAccounts = useAllAccounts();
  const firstAccountId = allAccounts[0].id;
  const {
    selectedFiatCurrency: { symbol: fiatSymbol }
  } = useFiatCurrency();
  const [visibilityBeingChanged, setVisibilityBeingChanged] = useState(false);
  const [currentModal, setCurrentModal] = useState<AccountSettingsModal | null>(null);

  const account = useMemo(() => allAccounts.find(({ id: accountId }) => accountId === id), [allAccounts, id]);
  const tezosAddress = account && getAccountAddressForTezos(account);
  const evmAddress = account && getAccountAddressForEvm(account);
  const tezosChain = useTezosMainnetChain();
  const totalBalanceInDollar = useTotalBalance(tezosAddress ?? '', tezosChain.chainId);

  const handleCopyClick = useCallback(() => {
    if (account?.type !== TempleAccountType.HD) {
      return;
    }

    setCurrentModal(AccountSettingsModal.AccountAddresses);
  }, [account?.type]);

  const handleVisibilityChange = useCallback(
    async (newValue: boolean) => {
      try {
        setVisibilityBeingChanged(true);
        if (id === currentAccountId) {
          setAccountId(firstAccountId);
        }
        await setAccountVisible(id, newValue);
      } catch (e: any) {
        console.error(e);

        alert({ title: t('error'), description: e.message });
      } finally {
        setVisibilityBeingChanged(false);
      }
    },
    [alert, currentAccountId, firstAccountId, id, setAccountId, setAccountVisible]
  );

  const derivationPaths = useMemo(() => {
    switch (account?.type) {
      case TempleAccountType.HD:
        return [TempleChainKind.Tezos, TempleChainKind.EVM].map(chainName => ({
          chainName,
          path: getDerivationPath(chainName, account.hdIndex)
        }));
      case TempleAccountType.Ledger:
        return [{ chainName: TempleChainKind.Tezos, path: account.derivationPath }];
      default:
        return [];
    }
  }, [account]);

  const handleModalClose = useCallback(() => setCurrentModal(null), []);
  const modal = useMemo(() => {
    switch (currentModal) {
      case AccountSettingsModal.EditName:
        return <EditAccountNameModal account={account!} onClose={handleModalClose} />;
      case AccountSettingsModal.RevealPrivateKey:
        return <RevealPrivateKeyModal account={account!} onClose={handleModalClose} />;
      case AccountSettingsModal.RemoveAccount:
        return <RemoveAccountModal account={account!} onClose={handleModalClose} />;
      case AccountSettingsModal.AccountAddresses:
        return <AccountAddressesModal account={account!} onClose={handleModalClose} />;
      default:
        return null;
    }
  }, [account, currentModal, handleModalClose]);

  const openModalFactory = useCallback((modal: AccountSettingsModal) => () => setCurrentModal(modal), []);
  const openEditNameModal = useMemo(() => openModalFactory(AccountSettingsModal.EditName), [openModalFactory]);
  const openRevealPrivateKeyModal = useMemo(
    () => openModalFactory(AccountSettingsModal.RevealPrivateKey),
    [openModalFactory]
  );
  const openRemoveAccountModal = useMemo(
    () => openModalFactory(AccountSettingsModal.RemoveAccount),
    [openModalFactory]
  );

  if (!account) {
    return null;
  }

  return (
    <PageLayout pageTitle="Edit Account" hasBackAction>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-sm flex flex-col">
          <div className="w-full flex flex-row p-4 gap-1 items-end">
            <div className="w-15 h-15 flex justify-center items-center rounded-xl border-1.5 border-gray-500">
              <Identicon type="bottts" hash={id} size={56} className="rounded-lg" />
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              {account.type === TempleAccountType.HD ? (
                <Button className="pl-1.5 pr-1 py-1 flex items-center" onClick={handleCopyClick}>
                  <span className="text-sm leading-5 text-gray-900 font-semibold mr-1">{account.name}</span>
                  <CopyIcon className="w-4 h-auto stroke-current text-blue-500" />
                </Button>
              ) : (
                <CopyButton text={tezosAddress ?? evmAddress ?? ''} className="pl-1.5 pr-1 py-1 flex items-center">
                  <span className="text-sm leading-5 text-gray-900 font-semibold mr-1">{account.name}</span>
                  <CopyIcon className="w-4 h-auto stroke-current text-blue-500" />
                </CopyButton>
              )}
              <span className="ml-1.5 text-gray-600 text-xxxs leading-3">
                <T id="totalBalance" />:
              </span>
              <span className="ml-1.5 text-gray-900 text-xs leading-4">
                <BalanceFiat totalBalanceInDollar={totalBalanceInDollar} currency={fiatSymbol} />
              </span>
            </div>
            <span className="text-gray-600 text-xxxs leading-3 font-medium">
              {t(typesLabelsI18nKeys[account.type])}
            </span>
          </div>

          <div className="w-full flex flex-col pt-1 pb-5 px-4 gap-3">
            <div className={menuEntryClassName}>
              <span className={menuEntryTextClassName}>Display</span>

              <label className={clsx('cursor-pointer', visibilityBeingChanged && 'opacity-75')}>
                <Checkbox
                  checked={account.isVisible}
                  disabled={visibilityBeingChanged}
                  onChange={handleVisibilityChange}
                />
              </label>
            </div>

            <Button className={menuEntryClassName} onClick={openEditNameModal}>
              <span className={menuEntryTextClassName}>Edit name</span>

              <ChevronRightIcon className="w-4 h-auto mx-1 text-orange-20 stroke-current" />
            </Button>

            {(account.type === TempleAccountType.HD || account.type === TempleAccountType.Imported) && (
              <Button className={menuEntryClassName} onClick={openRevealPrivateKeyModal}>
                <span className={menuEntryTextClassName}>
                  <T id="revealPrivateKey" />
                </span>

                <ChevronRightIcon className="w-4 h-auto mx-1 text-orange-20 stroke-current" />
              </Button>
            )}
          </div>

          {derivationPaths.length > 0 && (
            <div className="w-full flex flex-col px-4 gap-3">
              <p className="text-xs leading-4 font-semibold text-gray-500">
                <T id="derivationPath" />
              </p>
              {derivationPaths.map(({ chainName, path }) => (
                <CopyButton className={clsx(menuEntryClassName, 'bg-white')} text={path} key={chainName}>
                  <span className={menuEntryTextClassName}>{path}</span>

                  <span className={menuEntryTextClassName}>{TempleChainTitle[chainName]}</span>
                </CopyButton>
              ))}
            </div>
          )}

          <div className="w-full p-4">
            <Button
              className="w-full text-red-500 bg-red-200 rounded-lg p-2 text-base leading-6 font-semibold"
              onClick={openRemoveAccountModal}
            >
              <T id="removeAccount" />
            </Button>
          </div>
        </div>
      </div>
      {modal}
    </PageLayout>
  );
});
