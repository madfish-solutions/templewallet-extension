import React, { memo } from 'react';

import { T } from 'lib/i18n';

import { Banner } from './Banner';

interface Props {
  popup?: boolean;
  onReviewClick: EmptyFn;
}

export const TermsOfUseUpdateBanner = memo<Props>(({ popup, onReviewClick }) => (
  <Banner
    title={<T id="templeWalletUpdate" />}
    description={<T id="templeWalletUpdateDescription" />}
    actionName={<T id="reviewUpdate" />}
    popup={popup}
    onActionClick={onReviewClick}
  />
));
