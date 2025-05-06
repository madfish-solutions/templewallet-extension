import React, { memo, useEffect } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName } from 'app/atoms/AccountName';
import { Button } from 'app/atoms/Button';
import { useSearchParamsBoolean } from 'app/hooks/use-search-params-boolean';
import { ReactComponent as BurgerIcon } from 'app/icons/base/menu.svg';
import { ReactComponent as ChatIcon } from 'app/icons/base/message.svg';
import { FeedbackModal } from 'app/layouts/PageLayout/FeedbackModal';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { IS_BETA_MODAL_SHOWED_ONCE_STORAGE_KEY } from 'lib/constants';
import { useStorage } from 'lib/temple/front';
import { useBooleanState } from 'lib/ui/hooks';
import Popper from 'lib/ui/Popper';
import { useAccount } from 'temple/front';

import { AccountsModal } from '../AccountsModal';

import MenuDropdown from './MenuDropdown';

export const AppHeader = memo(() => {
  const account = useAccount();

  const [isBetaModalShowedOnce, setBetaModalShowedOnce] = useStorage(IS_BETA_MODAL_SHOWED_ONCE_STORAGE_KEY);
  const [isFeedbackModalOpen, setFeedbackModalOpened, setFeedbackModalClosed] = useBooleanState(false);

  useEffect(() => {
    if (isDefined(isBetaModalShowedOnce) && !isBetaModalShowedOnce) {
      setFeedbackModalOpened();
      setBetaModalShowedOnce(true);
    }
  }, [isBetaModalShowedOnce, setBetaModalShowedOnce, setFeedbackModalOpened]);

  const {
    value: accountsModalIsOpen,
    setTrue: openAccountsModal,
    setFalse: closeAccountsModal
  } = useSearchParamsBoolean('accountsModal');

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

      <div className="flex gap-x-2">
        <Button
          className={COMMON_BUTTON_CLASSNAMES}
          onClick={setFeedbackModalOpened}
          testID={HomeSelectors.feedbackButton}
        >
          <IconBase Icon={ChatIcon} />
        </Button>

        <Popper placement="bottom-end" strategy="fixed" popup={props => <MenuDropdown {...props} />}>
          {({ ref, opened, toggleOpened }) => (
            <Button
              ref={ref}
              className={clsx(COMMON_BUTTON_CLASSNAMES, opened && 'text-secondary-hover bg-secondary-hover-low')}
              onClick={toggleOpened}
              testID={HomeSelectors.accountMenuButton}
            >
              <IconBase Icon={BurgerIcon} />
            </Button>
          )}
        </Popper>
      </div>

      {isFeedbackModalOpen && <FeedbackModal onClose={setFeedbackModalClosed} />}
    </div>
  );
});

const COMMON_BUTTON_CLASSNAMES =
  'p-1 rounded-md text-secondary bg-secondary-low hover:text-secondary-hover hover:bg-secondary-hover-low';
