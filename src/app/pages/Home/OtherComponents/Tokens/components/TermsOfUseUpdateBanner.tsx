import React, { memo } from 'react';

import { useAcceptedTermsVersionSelector } from 'app/store/settings/selectors';
import { RECENT_TERMS_VERSION } from 'lib/constants';
import { T } from 'lib/i18n';

import { Banner } from './Banner';

interface Props {
  popup?: boolean;
  onReviewClick: EmptyFn;
}

export const TermsOfUseUpdatedBanner = memo<Props>(({ popup, onReviewClick }) => {
  const acceptedTermsVersion = useAcceptedTermsVersionSelector();

  if (acceptedTermsVersion === RECENT_TERMS_VERSION) return null;

  return (
    <Banner
      title={<T id="templeWalletUpdate" />}
      description={<T id="templeWalletUpdateDescription" />}
      actionName={<T id="reviewUpdate" />}
      popup={popup}
      onActionClick={onReviewClick}
    />
  );
});
