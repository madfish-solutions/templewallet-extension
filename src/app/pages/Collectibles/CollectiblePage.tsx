import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { FormSubmitButton } from 'app/atoms';
import CopyButton from 'app/atoms/CopyButton';
import Divider from 'app/atoms/Divider';
import HashShortView from 'app/atoms/HashShortView';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import PageLayout from 'app/layouts/PageLayout';
import { AssetIcon } from 'app/templates/AssetIcon';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n';
import { useAssetMetadata, getAssetName } from 'lib/metadata';
import { useAccount, useBalance } from 'lib/temple/front';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { navigate } from 'lib/woozie';

interface Props {
  assetSlug: string;
}

const CollectiblePage: FC<Props> = ({ assetSlug }) => {
  const [assetContract, assetId] = useMemo(
    () => [fromFa2TokenSlug(assetSlug).contract, new BigNumber(fromFa2TokenSlug(assetSlug).id)],
    [assetSlug]
  );

  const account = useAccount();
  const accountPkh = account.publicKeyHash;
  const { data: collectibleBalance } = useBalance(assetSlug, accountPkh, {
    suspense: false
  });

  const { copy } = useCopyToClipboard();
  const collectibleData = useAssetMetadata(assetSlug);

  const collectibleName = getAssetName(collectibleData);

  return (
    <PageLayout pageTitle={collectibleName}>
      <div style={{ maxWidth: '360px', margin: 'auto' }} className="text-center pb-4">
        <div className={classNames('w-full max-w-sm mx-auto')}>
          <div style={{ borderRadius: '12px', width: '320px' }} className={'border border-gray-300 p-6 mx-auto my-10'}>
            <AssetIcon assetSlug={assetSlug} />
          </div>
        </div>
        <Divider />
        <div className="flex justify-between items-baseline mt-4 mb-4">
          <p className="text-gray-600 text-xs">
            <T id={'name'} />
          </p>
          <p className="text-xs text-gray-910">{collectibleName}</p>
        </div>
        <div className="flex justify-between items-baseline mt-4 mb-4">
          <p className="text-gray-600 text-xs">
            <T id={'amount'} />
          </p>
          <p className="text-xs text-gray-910">{collectibleBalance ? collectibleBalance.toFixed() : ''}</p>
        </div>
        <div className="flex justify-between items-baseline mb-4">
          <p className="text-gray-600 text-xs">
            <T id={'address'} />
          </p>
          <span className={'flex align-middle'}>
            <p className="text-xs inline align-text-bottom text-gray-910">
              <HashShortView hash={assetContract} />
            </p>
            <CopyButton text={assetContract} type="link">
              <CopyIcon
                style={{ verticalAlign: 'inherit' }}
                className={classNames('h-4 ml-1 w-auto inline', 'stroke-orange stroke-2')}
                onClick={() => copy()}
              />
            </CopyButton>
          </span>
        </div>
        <div className="flex justify-between items-baseline mb-4">
          <p className="text-gray-600 text-xs">
            <T id={'id'} />
          </p>
          <span className={'flex align-middle'}>
            <p className="text-xs inline align-text-bottom text-gray-910">{assetId.toFixed()}</p>
            <CopyButton text={assetId.toFixed()} type="link">
              <CopyIcon
                style={{ verticalAlign: 'inherit' }}
                className={classNames('h-4 ml-1 w-auto inline', 'stroke-orange stroke-2')}
                onClick={() => copy()}
              />
            </CopyButton>
          </span>
        </div>
        <Divider />
        <FormSubmitButton
          className="w-full justify-center border-none"
          style={{
            padding: '10px 2rem',
            background: '#4299e1',
            marginTop: '24px'
          }}
          onClick={() => navigate(`/send/${assetSlug}`)}
        >
          <T id={'send'} />
        </FormSubmitButton>
      </div>
    </PageLayout>
  );
};

export default CollectiblePage;
