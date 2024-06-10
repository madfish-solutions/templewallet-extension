import React, { memo } from 'react';

import Money from 'app/atoms/Money';
import AddressChip from 'app/templates/AddressChip';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { getAssetName, getAssetSymbol, useAssetMetadata } from 'lib/metadata';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

import { HomeSelectors, TokenPageSelectors } from '../selectors';

interface Props {
  tezosChainId: string;
  assetSlug: string;
}

export const AssetBanner = memo<Props>(({ tezosChainId, assetSlug }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const network = useTezosChainByChainId(tezosChainId);

  return network && accountTezAddress ? (
    <TezosAssetBanner network={network} assetSlug={assetSlug} accountPkh={accountTezAddress} />
  ) : (
    UNDER_DEVELOPMENT_MSG
  );
});

interface TezosTezosAssetBanner {
  network: TezosNetworkEssentials;
  accountPkh: string;
  assetSlug: string;
}

const TezosAssetBanner = memo<TezosTezosAssetBanner>(({ network, accountPkh, assetSlug }) => {
  const assetMetadata = useAssetMetadata(assetSlug, network.chainId);
  const assetName = getAssetName(assetMetadata);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return (
    <>
      <div className="flex justify-between items-center my-3">
        <div className="flex items-center">
          <AssetIcon tezosChainId={network.chainId} assetSlug={assetSlug} size={24} className="flex-shrink-0" />

          <div
            className="text-font-medium font-normal text-gray-700 truncate flex-1 ml-2"
            {...setTestID(TokenPageSelectors.tokenName)}
            {...setAnotherSelector('name', assetName)}
          >
            {assetName}
          </div>
        </div>

        <AddressChip
          address={accountPkh}
          tezosNetwork={network}
          modeSwitchTestId={HomeSelectors.addressModeSwitchButton}
        />
      </div>

      <div className="flex items-center text-2xl">
        <Balance network={network} address={accountPkh} assetSlug={assetSlug}>
          {balance => (
            <div className="flex flex-col">
              <div className="flex text-2xl">
                <Money smallFractionFont={false} fiat>
                  {balance}
                </Money>
                <span className="ml-1">{assetSymbol}</span>
              </div>

              <InFiat tezosChainId={network.chainId} assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
                {({ balance, symbol }) => (
                  <div className="mt-1 text-font-regular leading-5 text-gray-500 flex">
                    <span className="mr-1">≈</span>
                    {balance}
                    <span className="ml-1">{symbol}</span>
                  </div>
                )}
              </InFiat>
            </div>
          )}
        </Balance>
      </div>
    </>
  );
});
