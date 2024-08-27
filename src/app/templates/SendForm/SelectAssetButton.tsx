import React, { memo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import Money from 'app/atoms/Money';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { TezosTokenIconWithNetwork } from 'app/templates/AssetIcon';
import { TezosBalance } from 'app/templates/Balance';
import { setTestID, setAnotherSelector, TestIDProperty } from 'lib/analytics';
import { T } from 'lib/i18n';
import { useTezosAssetMetadata, getAssetSymbol } from 'lib/metadata';
import { TezosNetworkEssentials } from 'temple/networks';

interface SelectAssetButtonProps extends TestIDProperty {
  selectedAssetSlug: string;
  network: TezosNetworkEssentials;
  accountPkh: string;
  onClick: EmptyFn;
  className?: string;
}

export const SelectAssetButton = memo<SelectAssetButtonProps>(
  ({ selectedAssetSlug, network, accountPkh, onClick, className, testID }) => {
    const metadata = useTezosAssetMetadata(selectedAssetSlug, network.chainId);

    return (
      <div
        className={clsx(
          'cursor-pointer flex justify-between items-center py-1.5 px-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines',
          className
        )}
        onClick={onClick}
      >
        <div
          className="flex justify-center items-center"
          {...setTestID(testID)}
          {...setAnotherSelector('slug', selectedAssetSlug)}
        >
          <TezosTokenIconWithNetwork tezosChainId={network.chainId} assetSlug={selectedAssetSlug} />

          <TezosBalance network={network} assetSlug={selectedAssetSlug} address={accountPkh}>
            {balance => (
              <div className="flex flex-col items-start ml-2">
                <span className="text-font-description-bold mb-0.5">{getAssetSymbol(metadata)}</span>

                <span className="text-font-num-12 text-grey-1">
                  <Money smallFractionFont={false}>{balance}</Money>
                  <span className="ml-0.5">
                    <T id="available" />
                  </span>
                </span>
              </div>
            )}
          </TezosBalance>
        </div>
        <IconBase Icon={CompactDown} className="text-primary" size={16} />
      </div>
    );
  }
);
