import React, { FC, memo, useMemo, useCallback } from 'react';

import { Spinner } from 'app/atoms';
import { DelegateButton, RedelegateButton } from 'app/atoms/BakingButtons';
import { useIsStakingNotSupported, useManagableTezosStakeInfo } from 'app/hooks/use-baking-hooks';
import { BakerBanner } from 'app/templates/BakerBanner';
import { useGasToken } from 'lib/assets/hooks';
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
  const { isDcpNetwork } = useGasToken();
  const { rpcBaseURL } = useNetwork();
  const { symbol } = useGasTokenMetadata();

  const { data: stakingIsNotSupported = isDcpNetwork, isLoading: isNotSupportedSwrLoading } = useIsStakingNotSupported(
    rpcBaseURL,
    bakerPkh
  );

  const { mayManage: shouldManage, isLoading: isShouldManageLoading } = useManagableTezosStakeInfo(
    rpcBaseURL,
    accountPkh
  );

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

  const isLoading = isNotSupportedSwrLoading || isShouldManageLoading;

  const StakeOrManageButton = useMemo<FC | undefined>(() => {
    if (isLoading) return () => <Spinner className="w-8 self-center" theme="gray" />;

    if (stakingIsNotSupported && !shouldManage) return;

    return () => (
      <DelegateButton
        to={`/staking?tab=${shouldManage ? 'my-stake' : 'new-stake'}`}
        small
        flashing={!shouldManage}
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
  }, [isLoading, cannotDelegate, stakingIsNotSupported, shouldManage, symbol]);

  return <BakerBanner bakerPkh={bakerPkh} HeaderRight={BakerBannerHeaderRight} ActionButton={StakeOrManageButton} />;
});
