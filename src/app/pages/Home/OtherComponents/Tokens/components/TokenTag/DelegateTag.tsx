import React, { memo, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n';
import { useDelegate } from 'lib/temple/front';
import { navigate } from 'lib/woozie';
import { TezosNetworkEssentials } from 'temple/networks';

import { AssetsSelectors } from '../../../Assets.selectors';
import modStyles from '../../Tokens.module.css';

interface Props {
  network: TezosNetworkEssentials;
  pkh: string;
}

export const DelegateTezosTag = memo<Props>(({ network, pkh }) => {
  const { data: myBakerPkh } = useDelegate(pkh, network);
  const { trackEvent } = useAnalytics();

  const handleTagClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      trackEvent(HomeSelectors.delegateButton, AnalyticsEventCategory.ButtonPress);
      navigate(`/explore/${network.chainId}/tez/?tab=delegation`);
    },
    [network.chainId, trackEvent]
  );

  const NotDelegatedButton = useMemo(
    () => (
      <Button
        onClick={handleTagClick}
        className={classNames('uppercase ml-2 px-1.5 py-1 bg-secondary hover:bg-secondary-hover', modStyles.tagBase)}
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
        className={classNames(
          'inline-flex items-center px-1.5 ml-2 py-1 bg-secondary hover:bg-secondary-hover',
          modStyles.tagBase
        )}
        testID={AssetsSelectors.assetItemApyButton}
      >
        APY: 5.6%
      </Button>
    ),
    [handleTagClick]
  );

  return myBakerPkh ? TezosDelegated : NotDelegatedButton;
});
