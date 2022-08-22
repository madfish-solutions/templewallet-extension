import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { useExplorerBaseUrls } from 'lib/temple/front/blockexplorer';
import { BakerRewardsActivityNotificationInterface } from 'lib/teztok-api/interfaces';

import Money from '../../../../atoms/Money';
import OpenInExplorerChip from '../../../../atoms/OpenInExplorerChip';
import { useAppEnv } from '../../../../env';
import { useGasToken } from '../../../../hooks/useGasToken';
import HashChip from '../../../../templates/HashChip';
import { BaseActivity } from './BaseActivity';

interface BakerRewardsActivityProps extends BakerRewardsActivityNotificationInterface {
  index: number;
}

export const BakerRewardsActivity: FC<BakerRewardsActivityProps> = props => {
  const { popup } = useAppEnv();
  const { metadata } = useGasToken();
  const { rewardAmount, rewardLuck, transactionHash } = props;
  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();

  const luckClassName = (() => {
    switch (true) {
      case Number(rewardLuck) < -5:
        return 'text-red-700';
      case Number(rewardLuck) > 5:
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  })();

  return (
    <BaseActivity {...props}>
      <div className={classNames('flex items-center', popup ? 'row' : 'column')}>
        <span className="flex items-center gap-1 font-inter text-gray-700 text-xs font-normal mr-1">
          <T
            id="yourRewardsAndLuck"
            substitutions={[
              <span className="flex items-center gap-1">
                <Money smallFractionFont={false}>{rewardAmount}</Money>
                <span>{metadata.symbol}</span>
              </span>
            ]}
          />
        </span>
        <span className={luckClassName}>
          ({Number(rewardLuck) > 0 ? '+' : ''}
          {rewardLuck}%)
        </span>
      </div>

      <div className="flex row items-center mt-4">
        <span className="font-inter text-gray-700 text-xs font-normal">
          <T id="transaction" />
        </span>
        <HashChip hash={transactionHash} firstCharsCount={10} lastCharsCount={7} small className="mx-2" />

        {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} hash={transactionHash} />}
      </div>
    </BaseActivity>
  );
};
