import React, { memo, useCallback, useEffect, useState } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName } from 'app/atoms/AccountName';
import { AnimatedDot } from 'app/atoms/AnimatedDot';
import { Button } from 'app/atoms/Button';
import { useRewardsBadgeVisible } from 'app/hooks/use-rewards-badge';
import { useSearchParamsBoolean } from 'app/hooks/use-search-params-boolean';
import { ReactComponent as BurgerIcon } from 'app/icons/base/menu.svg';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { useNewNotificationsAmountSelector } from 'app/store/notifications/selectors';
import { EarnEthIntroModal } from 'app/templates/AppHeader/EarnEthIntroModal';
import { V2IntroductionModal } from 'app/templates/AppHeader/V2IntroductionModal';
import { SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY, SHOULD_SHOW_V2_INTRO_MODAL_STORAGE_KEY } from 'lib/constants';
import { useStorage } from 'lib/temple/front';
import Popper from 'lib/ui/Popper';
import { useAccount } from 'temple/front';

import { AccountsModal } from '../AccountsModal';

import { LetsExchangeModal } from './LetsExchangeModal';
import MenuDropdown from './MenuDropdown';

export const AppHeader = memo(() => {
  const account = useAccount();
  const rewardsBadgeVisible = useRewardsBadgeVisible();
  const newNotificationsAmount = useNewNotificationsAmountSelector();
  const menuDotVisible = rewardsBadgeVisible || newNotificationsAmount > 0;

  const {
    value: accountsModalIsOpen,
    setTrue: openAccountsModal,
    setFalse: closeAccountsModal
  } = useSearchParamsBoolean('accountsModal');
  const [shouldShowV2IntroModal, setShouldShowV2IntroModal] = useStorage(SHOULD_SHOW_V2_INTRO_MODAL_STORAGE_KEY);

  const [shouldOpenLetsExchangeModal, setShouldOpenLetsExchangeModal] = useStorage<boolean>(
    SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY
  );
  const [shouldShowLetsExchangeModal, setShouldShowLetsExchangeModal] = useState(shouldOpenLetsExchangeModal);
  useEffect(() => {
    if (shouldOpenLetsExchangeModal) {
      setShouldShowLetsExchangeModal(true);
    }
  }, [shouldOpenLetsExchangeModal, setShouldShowLetsExchangeModal]);

  const handleLetsExchangeModalShown = useCallback(
    () => setShouldOpenLetsExchangeModal(false),
    [setShouldOpenLetsExchangeModal]
  );
  const handleCloseLetsExchangeModal = useCallback(
    () => setShouldShowLetsExchangeModal(false),
    [setShouldShowLetsExchangeModal]
  );

  return (
    <div className="relative z-header flex items-center py-3 px-4 gap-x-1 rounded-t-inherit">
      <AccountAvatar
        seed={account.id}
        size={32}
        onClick={openAccountsModal}
        testID={HomeSelectors.accountIcon}
        elementType="button"
      />

      <AccountsModal opened={accountsModalIsOpen} onRequestClose={closeAccountsModal} />

      <AccountName account={account} />

      <div className="flex-1" />

      <Popper placement="bottom-end" strategy="fixed" popup={props => <MenuDropdown {...props} />}>
        {({ ref, opened, toggleOpened }) => (
          <Button
            ref={ref}
            className={clsx(
              'relative p-1 rounded-md text-secondary bg-secondary-low',
              'hover:text-secondary-hover hover:bg-secondary-hover-low',
              opened && 'text-secondary-hover bg-secondary-hover-low'
            )}
            onClick={toggleOpened}
            testID={HomeSelectors.accountMenuButton}
          >
            {menuDotVisible && <AnimatedDot className="top-1.5 left-1" />}
            <IconBase Icon={BurgerIcon} size={16} />
          </Button>
        )}
      </Popper>

      {shouldShowV2IntroModal ? (
        <V2IntroductionModal setShouldShowV2IntroModal={setShouldShowV2IntroModal} />
      ) : shouldShowLetsExchangeModal ? (
        <LetsExchangeModal onClose={handleCloseLetsExchangeModal} onShown={handleLetsExchangeModalShown} />
      ) : (
        <EarnEthIntroModal />
      )}
    </div>
  );
});
