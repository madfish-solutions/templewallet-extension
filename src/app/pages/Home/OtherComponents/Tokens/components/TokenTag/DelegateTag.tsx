import React, { FC, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import ABContainer from 'app/atoms/ABContainer';
import { Button } from 'app/atoms/Button';
import { ReactComponent as AlertIcon } from 'app/icons/alert-sm.svg';
import { HomeSelectors } from 'app/pages/Home/Home.selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n';
import { useAccount, useDelegate } from 'lib/temple/front';
import { navigate } from 'lib/woozie';

import { AssetsSelectors } from '../../../Assets.selectors';
import modStyles from '../../Tokens.module.css';

export const DelegateTezosTag: FC = () => {
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

  const buttonA = useMemo(
    () => (
      <Button
        onClick={handleTagClick}
        className={classNames('inline-flex items-center pl-1 ml-2 py-1 pr-1.5', modStyles['apyTag'])}
        testID={AssetsSelectors.assetItemDelegateButton}
      >
        <AlertIcon className="animate-fade-in mr-1 stroke-current" />
        <T id="delegate" />
      </Button>
    ),
    [handleTagClick]
  );

  const buttonB = useMemo(
    () => (
      <Button
        onClick={handleTagClick}
        className={classNames('uppercase ml-2 px-1.5 py-1', modStyles['apyTag'])}
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
        className={classNames('inline-flex items-center px-1.5 ml-2 py-1', modStyles['apyTag'])}
        testID={AssetsSelectors.assetItemApyButton}
      >
        APY: 5.6%
      </Button>
    ),
    [handleTagClick]
  );

  return myBakerPkh ? TezosDelegated : <ABContainer groupAComponent={buttonA} groupBComponent={buttonB} />;
};
