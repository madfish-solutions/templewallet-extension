import React, { memo, useCallback } from 'react';

import browser from 'webextension-polyfill';

import { Button, IconBase } from 'app/atoms';
import { ActionModal } from 'app/atoms/action-modal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { T } from 'lib/i18n';

import { V2IntroductionModalSelectors } from './selectors';

interface V2IntroductionModalProps {
  setShouldShowV2IntroModal: (value: boolean) => Promise<void>;
}

const V2_DOCS_URL =
  'https://docs.templewallet.com/blog/the-temple-wallet-tezos-evm-update-the-beginning-of-the-new-chapter/';

export const V2IntroductionModal = memo(({ setShouldShowV2IntroModal }: V2IntroductionModalProps) => {
  const handleClose = useCallback(() => setShouldShowV2IntroModal(false), [setShouldShowV2IntroModal]);
  const handleLinkClick = useCallback(async () => {
    await handleClose();
    await browser.tabs.create({ url: V2_DOCS_URL });
  }, [handleClose]);

  return (
    <ActionModal hasHeader={false} onClose={handleClose}>
      <div className="relative w-full flex flex-col items-center px-3 py-4 gap-y-2">
        <Button className="absolute top-3 right-3" onClick={handleClose}>
          <IconBase Icon={CloseIcon} className="text-grey-2" />
        </Button>

        <p className="py-1 text-font-regular-bold text-center">
          <T id="evmUpdateHere" />
        </p>

        <p className="py-1 mb-1 text-font-description text-grey-1 text-center">
          <T id="evmUpdateDescription" />
        </p>

        <StyledButton
          className="w-full flex justify-center gap-x-0.5 text-secondary"
          size="L"
          onClick={handleLinkClick}
          color="secondary-low"
          testID={V2IntroductionModalSelectors.aboutUpdateButton}
        >
          <span className="text-font-regular-bold">
            <T id="aboutUpdate" />
          </span>
          <IconBase Icon={OutLinkIcon} />
        </StyledButton>
      </div>
    </ActionModal>
  );
});
