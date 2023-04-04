import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import ABContainer from 'app/atoms/ABContainer';
import { Button } from 'app/atoms/Button';
import { ReactComponent as AlertIcon } from 'app/icons/alert-sm.svg';
import { HomeSelectors } from 'app/pages/Home/Home.selectors';
import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { ABTestGroup } from 'lib/apis/temple';
import { T } from 'lib/i18n';
import { useAccount, useDelegate } from 'lib/temple/front';
import { navigate } from 'lib/woozie';

import { AssetsSelectors } from '../../../Assets.selectors';
import modStyles from '../../Tokens.module.css';

export const DelegateTezosTag: FC = () => {
  const acc = useAccount();
  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash);
  const { trackEvent } = useAnalytics();
  const groupName = useUserTestingGroupNameSelector();

  const handleTagClick = (e: React.MouseEvent<HTMLButtonElement>, testGroupName: ABTestGroup) => {
    e.preventDefault();
    e.stopPropagation();
    trackEvent(HomeSelectors.delegateButton, AnalyticsEventCategory.ButtonPress, {
      abTestingCategory: testGroupName
    });
    navigate('/explore/tez/?tab=delegation');
  };

  const buttonA = useMemo(
    () => (
      <Button
        onClick={event => handleTagClick(event, ABTestGroup.A)}
        className={classNames('inline-flex items-center pl-1 ml-2 py-1 pr-1.5', modStyles['apyTag'])}
        testID={AssetsSelectors.assetItemDelegateButton}
      >
        <AlertIcon className="animate-fade-in mr-1 stroke-current" />
        <T id="delegate" />
      </Button>
    ),
    []
  );

  const buttonB = useMemo(
    () => (
      <Button
        onClick={event => handleTagClick(event, ABTestGroup.B)}
        className={classNames('uppercase ml-2 px-1.5 py-1', modStyles['apyTag'])}
        testID={AssetsSelectors.assetItemDelegateButton}
      >
        <T id="notDelegated" />
      </Button>
    ),
    []
  );

  const TezosDelegated = useMemo(
    () => (
      <Button
        onClick={event => handleTagClick(event, groupName)}
        className={classNames('inline-flex items-center px-1.5 ml-2 py-1', modStyles['apyTag'])}
        testID={AssetsSelectors.assetItemApyButton}
      >
        APY: 5.6%
      </Button>
    ),
    [myBakerPkh]
  );

  return myBakerPkh ? TezosDelegated : <ABContainer groupAComponent={buttonA} groupBComponent={buttonB} />;
};
