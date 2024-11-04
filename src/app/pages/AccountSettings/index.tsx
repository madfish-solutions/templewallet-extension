import React, { memo, useCallback, useMemo, useState } from 'react';

import { Button, IconBase, ToggleSwitch } from 'app/atoms';
import { AccLabel } from 'app/atoms/AccLabel';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName } from 'app/atoms/AccountName';
import { CopyButton } from 'app/atoms/CopyButton';
import { EvmNetworksLogos, TezNetworkLogo } from 'app/atoms/NetworksLogos';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { StyledButton } from 'app/atoms/StyledButton';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { useAllAccountsReactiveOnRemoval } from 'app/hooks/use-all-accounts-reactive';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import PageLayout from 'app/layouts/PageLayout';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { getDerivationPath } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { useAlert } from 'lib/ui';
import { useAllAccounts, useCurrentAccountId } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ConfirmRevealPrivateKeyAccessModal } from './confirm-reveal-private-key-access-modal';
import { EditAccountNameModal } from './edit-account-name-modal';
import { RemoveAccountModal } from './remove-account-modal';
import { RevealPrivateKeyModal } from './reveal-private-key-modal';
import { AccountSettingsSelectors } from './selectors';
import { PrivateKeyPayload } from './types';

interface AccountSettingsProps {
  id: string;
}

enum AccountSettingsModal {
  EditName,
  ConfirmRevealPrivateKeyAccess,
  RevealPrivateKey,
  RemoveAccount
}

export const AccountSettings = memo<AccountSettingsProps>(({ id }) => {
  const alert = useAlert();
  const currentAccountId = useCurrentAccountId();
  const { setAccountHidden } = useTempleClient();
  useAllAccountsReactiveOnRemoval();
  const allAccounts = useAllAccounts();
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);

  const [visibilityBeingChanged, setVisibilityBeingChanged] = useState(false);
  const [currentModal, setCurrentModal] = useState<AccountSettingsModal | null>(null);
  const [privateKeysPayload, setPrivateKeysPayload] = useState<PrivateKeyPayload[]>([]);
  const shouldDisableVisibilityChange = visibilityBeingChanged || currentAccountId === id;

  const account = useMemo(() => allAccounts.find(({ id: accountId }) => accountId === id), [allAccounts, id]);

  const handleVisibilityChange = useCallback(
    async (newValue: boolean) => {
      try {
        setVisibilityBeingChanged(true);
        await setAccountHidden(id, !newValue);
      } catch (e: any) {
        console.error(e);

        alert({ title: t('error'), description: e.message });
      } finally {
        setVisibilityBeingChanged(false);
      }
    },
    [alert, id, setAccountHidden]
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

  const goToRevealPrivateKey = useCallback((privateKeys: PrivateKeyPayload[]) => {
    setPrivateKeysPayload(privateKeys);
    setCurrentModal(AccountSettingsModal.RevealPrivateKey);
  }, []);

  const handleModalClose = useCallback(() => {
    setCurrentModal(null);
    setPrivateKeysPayload([]);
  }, []);

  const modal = useMemo(() => {
    switch (currentModal) {
      case AccountSettingsModal.EditName:
        return <EditAccountNameModal account={account!} onClose={handleModalClose} />;
      case AccountSettingsModal.ConfirmRevealPrivateKeyAccess:
        return (
          <ConfirmRevealPrivateKeyAccessModal
            account={account!}
            onClose={handleModalClose}
            onReveal={goToRevealPrivateKey}
          />
        );
      case AccountSettingsModal.RemoveAccount:
        return <RemoveAccountModal account={account!} onClose={handleModalClose} />;
      case AccountSettingsModal.RevealPrivateKey:
        return <RevealPrivateKeyModal privateKeys={privateKeysPayload} onClose={handleModalClose} />;
      default:
        return null;
    }
  }, [account, currentModal, goToRevealPrivateKey, handleModalClose, privateKeysPayload]);

  const openModalFactory = useCallback((modal: AccountSettingsModal) => () => setCurrentModal(modal), []);
  const openEditNameModal = useMemo(() => openModalFactory(AccountSettingsModal.EditName), [openModalFactory]);
  const openRevealPrivateKeyModal = useMemo(
    () => openModalFactory(AccountSettingsModal.ConfirmRevealPrivateKeyAccess),
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
    <PageLayout
      pageTitle={t('editAccount')}
      contentPadding={false}
      onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}
      bottomEdgeThreshold={16}
    >
      <div className="w-full h-full flex flex-col px-4">
        <div className="flex gap-1 items-end justify-between py-4">
          <div className="flex gap-1">
            <AccountAvatar seed={id} size={60} />

            <div className="flex flex-col">
              <AccountName account={account} testID={AccountSettingsSelectors.accountName} />

              <span className="ml-1.5 text-grey-1 text-font-small">
                <T id="totalBalance" />:
              </span>
              <span className="ml-1.5 text-font-num-14">
                <TotalEquity account={account} currency="fiat" />
              </span>
            </div>
          </div>

          <AccLabel type={account.type} />
        </div>

        <div className="flex flex-col pt-0.5 pb-5 gap-3">
          <SettingsCellGroup>
            <SettingsCellSingle cellName={<T id="displayAccount" />} Component="div">
              <ToggleSwitch
                checked={!account.hidden}
                onChange={handleVisibilityChange}
                disabled={shouldDisableVisibilityChange}
                testID={AccountSettingsSelectors.visibilityToggle}
              />
            </SettingsCellSingle>
          </SettingsCellGroup>

          <SettingsCellGroup>
            <SettingsCellSingle
              cellName={<T id="editName" />}
              Component={Button}
              onClick={openEditNameModal}
              testID={AccountSettingsSelectors.editName}
            >
              <IconBase size={16} Icon={ChevronRightIcon} className="text-primary" />
            </SettingsCellSingle>
          </SettingsCellGroup>

          {(account.type === TempleAccountType.HD || account.type === TempleAccountType.Imported) && (
            <SettingsCellGroup>
              <SettingsCellSingle
                cellName={<T id="revealPrivateKey" />}
                Component={Button}
                onClick={openRevealPrivateKeyModal}
                testID={AccountSettingsSelectors.revealPrivateKey}
              >
                <IconBase size={16} Icon={ChevronRightIcon} className="text-primary" />
              </SettingsCellSingle>
            </SettingsCellGroup>
          )}
        </div>

        {derivationPaths.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
            <p className="text-font-description-bold text-grey-2">
              <T id="derivationPath" />
            </p>

            {derivationPaths.map(({ chainName, path }) => (
              <SettingsCellGroup key={chainName}>
                <SettingsCellSingle
                  cellName={path}
                  Component={CopyButton}
                  text={path}
                  testID={AccountSettingsSelectors.derivationPathButton}
                  testIDProperties={{ chainName }}
                >
                  {chainName === 'tezos' ? <TezNetworkLogo /> : <EvmNetworksLogos />}
                </SettingsCellSingle>
              </SettingsCellGroup>
            ))}
          </div>
        )}
      </div>

      <ActionsButtonsBox className="sticky left-0 bottom-0" shouldCastShadow={!bottomEdgeIsVisible}>
        <StyledButton
          className="flex-1"
          size="L"
          color="red-low"
          onClick={openRemoveAccountModal}
          testID={AccountSettingsSelectors.removeAccount}
        >
          <T id="removeAccount" />
        </StyledButton>
      </ActionsButtonsBox>

      {modal}
    </PageLayout>
  );
});
