import React, { FC, memo, useMemo, useCallback } from 'react';

import { Spinner } from 'app/atoms';
import { DelegateButton, RedelegateButton } from 'app/atoms/BakingButtons';
import { useIsStakingNotSupported, useManagableTezosStakeInfo } from 'app/hooks/use-baking-hooks';
import { BakerBanner } from 'app/templates/BakerBanner';
import { T } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';
import { TezosNetworkEssentials } from 'temple/networks';

import { BakingSectionSelectors } from './selectors';

interface Props {
  network: TezosNetworkEssentials;
  accountPkh: string;
  bakerPkh: string;
  cannotDelegate: boolean;
}

export const BakerBannerWithStake = memo<Props>(({ network, accountPkh, bakerPkh, cannotDelegate }) => {
  const { rpcBaseURL } = network;
  const { symbol } = getTezosGasMetadata(network.chainId);

  const isNotSupportedSwr = useIsStakingNotSupported(rpcBaseURL, bakerPkh);

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

  const stakingIsNotSupported = isNotSupportedSwr.data;

  const isLoading = isNotSupportedSwr.isLoading || isShouldManageLoading;

  const StakeOrManageButton = useMemo<FC | undefined>(() => {
    if (isLoading) return () => <Spinner className="w-8 self-center" theme="gray" />;

    if (stakingIsNotSupported && !shouldManage) return;

    return () => (
      <DelegateButton
        to={`/staking/${network.chainId}?tab=${shouldManage ? 'my-stake' : 'new-stake'}`}
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
  }, [isLoading, cannotDelegate, stakingIsNotSupported, shouldManage, symbol, network.chainId]);

  return (
    <BakerBanner
      network={network}
      accountPkh={accountPkh}
      bakerPkh={bakerPkh}
      HeaderRight={BakerBannerHeaderRight}
      ActionButton={StakeOrManageButton}
    />
  );
});
