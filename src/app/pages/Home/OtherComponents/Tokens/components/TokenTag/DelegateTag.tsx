import React, { memo, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { HomeSelectors } from 'app/pages/Home/Home.selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n';
import { useAccount, useDelegate } from 'lib/temple/front';
import { navigate } from 'lib/woozie';

import { AssetsSelectors } from '../../../Assets.selectors';
import modStyles from '../../Tokens.module.css';

export const DelegateTezosTag = memo(() => {
  const acc = useAccount();
  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash);
  const { trackEvent } = useAnalytics();

  const handleTagClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      trackEvent(HomeSelectors.delegateButton, AnalyticsEventCategory.ButtonPress);
      navigate('/explore/tez/?tab=delegation');
    },
    [trackEvent]
  );

  const NotDelegatedButton = useMemo(
    () => (
      <Button
        onClick={handleTagClick}
        className={classNames('uppercase ml-2 px-1.5 py-1', modStyles.tagBase, modStyles.delegateTag)}
        testID={AssetsSelectors.assetItemDelegateButton}
      >
        <T id="notDelegated" />
      </Button>
    ),
    [handleTagClick]
  );

  const TezosDelegated = useMemo(
    () => (
      <Button
        onClick={handleTagClick}
        className={classNames('inline-flex items-center px-1.5 ml-2 py-1', modStyles.tagBase, modStyles.delegateTag)}
        testID={AssetsSelectors.assetItemApyButton}
      >
        APY: 5.6%
      </Button>
    ),
    [handleTagClick]
  );

  return myBakerPkh ? TezosDelegated : NotDelegatedButton;
});
