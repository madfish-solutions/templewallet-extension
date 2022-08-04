import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { useExplorerBaseUrls } from 'lib/temple/front/blockexplorer';

import OpenInExplorerChip from '../../../../atoms/OpenInExplorerChip';
import { useAppEnv } from '../../../../env';
import { useGasToken } from '../../../../hooks/useGasToken';
import HashChip from '../../../../templates/HashChip';
import { BakerRewardsActivityNotificationInterface } from '../ActivityNotifications.interface';
import { BaseActivity } from '../BaseActivity';

interface BakerRewardsActivityProps extends BakerRewardsActivityNotificationInterface {
  index: number;
}

export const BakerRewardsActivity: FC<BakerRewardsActivityProps> = props => {
  const { popup } = useAppEnv();
  const { metadata } = useGasToken();
  const { rewardAmount, rewardLuck, transactionHash } = props;
  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();

  return (
    <BaseActivity {...props}>
      <div className={classNames('flex items-center', popup ? 'row' : 'column')}>
        <span className="font-inter text-gray-600 text-xs font-normal mr-1">
          <T id="yourRewardsAndLuck" substitutions={[rewardAmount, metadata.symbol]} />
        </span>
        <span>({rewardLuck}%)</span>
      </div>

      <div className="flex row items-center mt-4">
        <span className="font-inter text-gray-600 text-xs font-normal">
          <T id="transaction" />
        </span>
        <HashChip hash={transactionHash} firstCharsCount={10} lastCharsCount={7} small className="mx-1" />

        {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} hash={transactionHash} />}
      </div>
    </BaseActivity>
  );
};
