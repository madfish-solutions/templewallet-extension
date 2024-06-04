import React, { FC, memo, useMemo, useCallback } from 'react';

import { DelegateButton, RedelegateButton } from 'app/atoms/BakingButtons';
import { useIsStakingNotSupported, useStakedAmount, useUnstakeRequests } from 'app/hooks/use-baking-hooks';
import { BakerBanner } from 'app/templates/BakerBanner';
import { T } from 'lib/i18n';
import { useGasTokenMetadata } from 'lib/metadata';
import { useAccountPkh, useNetwork } from 'lib/temple/front';

import { BakingSectionSelectors } from './selectors';

interface Props {
  bakerPkh: string;
  cannotDelegate: boolean;
}

export const BakerBannerWithStake = memo<Props>(({ bakerPkh, cannotDelegate }) => {
  const accountPkh = useAccountPkh();
  const { rpcBaseURL } = useNetwork();
  const { symbol } = useGasTokenMetadata();

  const { data: stakedData } = useStakedAmount(rpcBaseURL, accountPkh);

  const stakingIsNotSupported = useIsStakingNotSupported(rpcBaseURL);

  const { data: requests } = useUnstakeRequests(rpcBaseURL, accountPkh);

  const BakerBannerHeaderRight = useCallback<FC<{ staked: number }>>(
    ({ staked }) => (
      <RedelegateButton
        disabled={cannotDelegate}
        staked={staked > 0}
        testID={BakingSectionSelectors.reDelegateButton}
      />
    ),
    [cannotDelegate]
  );

  const staked = stakedData?.gt(0);
  const shouldManage = staked || Boolean(requests?.finalizable.length);

  const StakeOrManageButton = useMemo<FC | undefined>(() => {
    if (stakingIsNotSupported && !shouldManage) return;

    return () => (
      <DelegateButton
        to={`/staking?tab=${shouldManage ? 'my-stake' : 'new-stake'}`}
        small
        flashing={!staked}
        disabled={cannotDelegate}
        testID={shouldManage ? undefined : BakingSectionSelectors.stakeTezosButton}
      >
        {shouldManage ? (
          <T id="manage" />
        ) : (
          <span>
            <T id="stake" /> {symbol}
          </span>
        )}
      </DelegateButton>
    );
  }, [cannotDelegate, stakingIsNotSupported, shouldManage, staked, symbol]);

  return <BakerBanner bakerPkh={bakerPkh} HeaderRight={BakerBannerHeaderRight} ActionButton={StakeOrManageButton} />;
});
