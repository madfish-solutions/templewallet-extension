import React, { FC } from 'react';

import { T } from 'lib/i18n/react';
import { useExplorerBaseUrls } from 'lib/temple/front/blockexplorer';
import { TransactionActivityNotificationInterface } from 'lib/teztok-api/interfaces';

import OpenInExplorerChip from '../../../../atoms/OpenInExplorerChip';
import HashChip from '../../../../templates/HashChip';
import { BaseActivity } from './BaseActivity';

interface TransactionActivityProps extends TransactionActivityNotificationInterface {
  index: number;
}

export const TransactionActivity: FC<TransactionActivityProps> = props => {
  const { transactionHash } = props;
  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();

  return (
    <BaseActivity {...props}>
      <div className="flex row items-center mt-4">
        <span className="font-inter text-gray-700 text-xs font-normal">
          <T id="transaction" />
        </span>
        <HashChip hash={transactionHash} firstCharsCount={10} lastCharsCount={7} small className="mx-1" />

        {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} hash={transactionHash} />}
      </div>
    </BaseActivity>
  );
};
