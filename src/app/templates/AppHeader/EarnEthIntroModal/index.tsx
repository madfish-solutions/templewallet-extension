import React, { memo, useCallback } from 'react';

import browser from 'webextension-polyfill';

import { Button, IconBase } from 'app/atoms';
import { ActionModal } from 'app/atoms/action-modal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { ETH_COIN_ANIMATION_OPTIONS, EVERSTAKE_ETHEREUM_STAKE_UTM_LINK } from 'app/pages/EarnEth/constants';
import { SHOULD_SHOW_EARN_ETH_INTRO_MODAL_STORAGE_KEY } from 'lib/constants';
import { T } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { Lottie } from 'lib/ui/react-lottie';

import { EarnEthIntroModalSelectors } from './selectors';

export const EarnEthIntroModal = memo(() => {
  const [shouldShowEarnEthIntroModal, setShouldShowEarnEthIntroModal] = useStorage(
    SHOULD_SHOW_EARN_ETH_INTRO_MODAL_STORAGE_KEY
  );

  const handleClose = useCallback(() => setShouldShowEarnEthIntroModal(false), [setShouldShowEarnEthIntroModal]);

  const handleLinkClick = useCallback(async () => {
    await handleClose();
    await browser.tabs.create({ url: EVERSTAKE_ETHEREUM_STAKE_UTM_LINK });
  }, [handleClose]);

  if (!shouldShowEarnEthIntroModal) return null;

  return (
    <ActionModal hasHeader={false} onClose={handleClose}>
      <div className="relative w-full flex flex-col items-center px-3 pt-3 pb-4">
        <Button className="absolute top-3 right-3" onClick={handleClose}>
          <IconBase Icon={CloseIcon} className="text-grey-2" />
        </Button>

        <Lottie isClickToPauseDisabled options={ETH_COIN_ANIMATION_OPTIONS} height={172} width={172} />

        <p className="mb-1 text-font-regular-bold text-center">
          <T id="stakeEth" />
        </p>

        <p className="mb-6 text-font-description text-grey-1 text-center">
          <T id="stakeEthDescription" />
        </p>

        <StyledButton
          className="w-full flex justify-center gap-x-0.5 text-secondary"
          size="L"
          onClick={handleLinkClick}
          color="secondary-low"
          testID={EarnEthIntroModalSelectors.stakeWithEverstakeButton}
        >
          <span className="text-font-regular-bold">
            <T id="stakeWithEverstake" />
          </span>
          <IconBase Icon={OutLinkIcon} />
        </StyledButton>
      </div>
    </ActionModal>
  );
});
