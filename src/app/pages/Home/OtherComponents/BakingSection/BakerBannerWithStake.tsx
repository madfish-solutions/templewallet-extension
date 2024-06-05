import React, { FC, memo, useMemo, useCallback } from 'react';

import { Spinner } from 'app/atoms';
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

  const isNotSupportedSwr = useIsStakingNotSupported(rpcBaseURL, bakerPkh);
  const stakedSwr = useStakedAmount(rpcBaseURL, accountPkh);
  const requestsSwr = useUnstakeRequests(rpcBaseURL, accountPkh);

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

  const stakingIsNotSupported = isNotSupportedSwr.data;
  const staked = stakedSwr.data?.gt(0);
  const shouldManage: boolean = staked || Boolean(requestsSwr.data?.finalizable.length);

  const isSupportedLoading = isNotSupportedSwr.isLoading || stakedSwr.isLoading || requestsSwr.isLoading;

  console.log(1, isNotSupportedSwr.isLoading, stakedSwr.isLoading, requestsSwr.isLoading);
  console.log(2, isNotSupportedSwr.error, stakedSwr.error, requestsSwr.error);

  const StakeOrManageButton = useMemo<FC | undefined>(() => {
    if (isSupportedLoading) return () => <Spinner className="w-8 self-center" theme="gray" />;

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
  }, [isSupportedLoading, cannotDelegate, stakingIsNotSupported, shouldManage, staked, symbol]);

  return <BakerBanner bakerPkh={bakerPkh} HeaderRight={BakerBannerHeaderRight} ActionButton={StakeOrManageButton} />;
});
