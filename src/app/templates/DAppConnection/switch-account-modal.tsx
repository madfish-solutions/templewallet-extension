import React, { memo, useCallback, useState } from 'react';

import clsx from 'clsx';

import { IconBase, Identicon } from 'app/atoms';
import DAppLogo from 'app/atoms/DAppLogo';
import { ActionsButtonsBox, CLOSE_ANIMATION_TIMEOUT } from 'app/atoms/PageModal';
import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as LinkIcon } from 'app/icons/base/link.svg';
import { DAppSession, isTezosDAppSession } from 'app/storage/dapps';
import { toastInfo, toastWarning } from 'app/toaster';
import { t, T } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { useAccount, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { AccountCard } from '../account-card';

interface SwitchAccountModalProps {
  dApp: [string, DAppSession];
  onClose: EmptyFn;
}

export const SwitchAccountModal = memo(({ dApp, onClose }: SwitchAccountModalProps) => {
  const { switchDAppEvmAccount, switchDAppTezosAccount } = useTempleClient();
  const [isLoading, setIsLoading] = useState(false);
  const account = useAccount();
  const { name: accountName, id: accountId } = account;
  const [origin, dAppSession] = dApp;
  const { name: appName, icon: appIcon } = dAppSession.appMeta;
  const evmAddress = useAccountAddressForEvm();
  const tezAddress = useAccountAddressForTezos();
  const isTezosDApp = isTezosDAppSession(dAppSession);

  const handleConnectClick = useCallback(async () => {
    try {
      setIsLoading(true);

      if (isTezosDApp) {
        await switchDAppTezosAccount(origin, tezAddress!);
      } else {
        await switchDAppEvmAccount(origin, evmAddress!);
      }

      setTimeout(() => toastInfo(t('connectedAccountToDApp', [accountName, origin])), CLOSE_ANIMATION_TIMEOUT * 2);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [isTezosDApp, onClose, switchDAppTezosAccount, origin, tezAddress, switchDAppEvmAccount, evmAddress, accountName]);

  const handleClose = useCallback(() => {
    setTimeout(() => toastWarning(t('accountNotConnectedWarning', [accountName, origin])), CLOSE_ANIMATION_TIMEOUT * 2);
    onClose();
  }, [onClose, accountName, origin]);

  return (
    <MiniPageModal opened showHeader={false} onRequestClose={handleClose}>
      <div className="p-4 flex flex-col flex-1 gap-4 bg-background rounded-t-lg">
        <div className="flex justify-center gap-3.5 relative">
          <div className="w-13 h-13 flex justify-center items-center bg-white shadow-card rounded-lg">
            <Identicon type="botttsneutral" hash={accountId} size={36} className="rounded-circle" />
          </div>
          <div className="w-13 h-13 flex justify-center items-center bg-white shadow-card rounded-lg">
            <DAppLogo size={30} icon={appIcon} origin={origin} />
          </div>
          <div
            className={clsx(
              'w-5 h-5 rounded-full bg-grey-4 flex justify-center items-center',
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            )}
          >
            <IconBase Icon={LinkIcon} size={12} className="text-grey-1" />
          </div>
        </div>

        <div className="flex flex-col gap-1 text-center">
          <p className="text-font-regular-bold">
            <T id="connectSomeAccountToDAppQuestion" substitutions={[accountName, appName]} />
          </p>
          <p className="text-font-description text-grey-1">
            <T id="currentAccountNotConnectedToDApp" />
          </p>
        </div>

        <AccountCard account={account} isCurrent={false} attractSelf={false} alwaysShowAddresses />
      </div>

      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        <StyledButton size="L" className="w-full" color="primary-low" onClick={handleClose}>
          <T id="cancel" />
        </StyledButton>

        <StyledButton color="primary" size="L" className="w-full" loading={isLoading} onClick={handleConnectClick}>
          <T id="connect" />
        </StyledButton>
      </ActionsButtonsBox>
    </MiniPageModal>
  );
});
