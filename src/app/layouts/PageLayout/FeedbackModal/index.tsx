import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ActionModal } from 'app/atoms/action-modal';
import { StyledButtonAnchor } from 'app/atoms/StyledButton';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { T, t } from 'lib/i18n';

import { FeedbackModalSelectors } from './selectors';

interface Props {
  isGoogleSyncFeature?: boolean;
  onClose?: EmptyFn;
}

export const FeedbackModal = memo<Props>(({ isGoogleSyncFeature = false, onClose }) => (
  <ActionModal hasHeader={false} onClose={onClose}>
    <div className="relative w-full flex flex-col items-center px-3 py-4 gap-y-2">
      <Button className="absolute top-3 right-3" onClick={onClose}>
        <IconBase Icon={CloseIcon} className="text-grey-2" />
      </Button>

      <p className="py-1 text-font-regular-bold text-center">
        <T id="inBeta" />
      </p>

      <p className="py-1 mb-1 text-font-description text-grey-1 text-center">
        <T id={isGoogleSyncFeature ? 'googleSyncFeatureNotReadyDescription' : 'inBetaDescription'} />
      </p>

      {!isGoogleSyncFeature && (
        <LinkButton title={t('docs')} href="https://docs.templewallet.com" testID={FeedbackModalSelectors.docsButton} />
      )}
      <LinkButton
        title={t('leaveFeedback')}
        href="https://forms.gle/VHLTySD76AaoKZmR6"
        testID={FeedbackModalSelectors.feedbackButton}
      />
    </div>
  </ActionModal>
));

interface LinkButtonProps {
  title: string;
  href: string;
  testID: string;
}

const LinkButton = memo<LinkButtonProps>(({ title, href, testID }) => (
  <StyledButtonAnchor
    href={href}
    className="w-full flex justify-center gap-x-0.5 text-secondary"
    size="L"
    color="secondary-low"
    testID={testID}
  >
    <span className="text-font-regular-bold">{title}</span>
    <IconBase Icon={OutLinkIcon} />
  </StyledButtonAnchor>
));
