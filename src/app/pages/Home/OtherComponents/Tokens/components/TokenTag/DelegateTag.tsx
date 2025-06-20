import React, { memo, useCallback, useMemo } from 'react';

import { TagButton } from 'app/atoms/TagButton';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { TEZOS_APY } from 'lib/constants';
import { T } from 'lib/i18n';
import { useDelegate } from 'lib/temple/front';
import { navigate } from 'lib/woozie';
import { TezosNetworkEssentials } from 'temple/networks';

import { AssetsSelectors } from '../../../Assets.selectors';

interface Props {
  network: TezosNetworkEssentials;
  pkh: string;
}

export const DelegateTezosTag = memo<Props>(({ network, pkh }) => {
  const { data: myBakerPkh } = useDelegate(pkh, network, false);
  const { trackEvent } = useAnalytics();

  const handleTagClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      trackEvent(HomeSelectors.delegateButton, AnalyticsEventCategory.ButtonPress);
      navigate({
        pathname: `/earn-tez/${network.chainId}`
      });
    },
    [network.chainId, trackEvent]
  );

  return useMemo(
    () =>
      myBakerPkh ? (
        <TagButton onClick={handleTagClick} testID={AssetsSelectors.assetItemApyButton}>
          <T id="tezosApy" substitutions={String(TEZOS_APY)} />
        </TagButton>
      ) : (
        <TagButton onClick={handleTagClick} testID={AssetsSelectors.assetItemDelegateButton}>
          <T id="notDelegated" />
        </TagButton>
      ),
    [handleTagClick, myBakerPkh]
  );
});
