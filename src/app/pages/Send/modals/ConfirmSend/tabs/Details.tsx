import React, { FC } from 'react';

import { HashChip, IconBase } from 'app/atoms';
import { EvmNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { NETWORK_IMAGE_DEFAULT_SIZE } from 'app/templates/AssetIcon';
import { T } from 'lib/i18n';

interface Props {
  goToFeeTab: EmptyFn;
}

export const DetailsTab: FC<Props> = ({ goToFeeTab }) => {
  return (
    <div className="flex flex-col px-4 py-2 mb-6 rounded-lg shadow-bottom border-0.5 border-transparent">
      <div className="py-2 flex flex-row justify-between items-center border-b-0.5 border-lines">
        <p className="p-1 text-font-description text-grey-1">
          <T id="network" />
        </p>
        <div className="flex flex-row items-center">
          <span className="p-1 text-font-description-bold">Ethereum</span>
          <EvmNetworkLogo networkName="ethereum" chainId={1} size={NETWORK_IMAGE_DEFAULT_SIZE} />
        </div>
      </div>

      <div className="py-2 flex flex-row justify-between items-center border-b-0.5 border-lines">
        <p className="p-1 text-font-description text-grey-1">
          <T id="recipient" />
        </p>
        <HashChip hash="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" small rounded="base" bgShade={50} textShade={100} />
      </div>

      <div className="py-2 flex flex-row justify-between items-center">
        <p className="p-1 text-font-description text-grey-1">
          <T id="gasFee" />
        </p>
        <div className="flex flex-row items-center">
          <div className="p-1 text-font-num-bold-12">
            <span className="pr-1 border-r-1.5 border-lines">$12.34</span>
            <span className="pl-1 ">0.008 ETH</span>
          </div>
          <IconBase Icon={ChevronRightIcon} className="text-primary cursor-pointer" onClick={goToFeeTab} />
        </div>
      </div>
    </div>
  );
};
