import React, { FC } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { TezosTokenIconWithNetwork } from 'app/templates/AssetIcon';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';

interface SwapFieldProps {
  tezosChainId: string;
  assetSlug?: string;
  assetSymbol: string;
  onSelectAssetClick: EmptyFn;
  testId?: string;
}

const SwapSelectTokenFace: FC<SwapFieldProps> = ({
  tezosChainId,
  assetSlug,
  assetSymbol,
  onSelectAssetClick,
  testId
}) => (
  <div {...setTestID(testId)}>
    {assetSlug ? (
      <Button
        onClick={onSelectAssetClick}
        className="bg-white py-[3px] px-2 rounded-8 flex items-center justify-between -mr-2.5 cursor-pointer w-[120px]"
      >
        <div className="flex items-center">
          <TezosTokenIconWithNetwork tezosChainId={tezosChainId} assetSlug={assetSlug} size={32} />
          <span className="text-text text-xs font-semibold overflow-hidden max-w-10 text-ellipsis">{assetSymbol}</span>
        </div>
        <IconBase Icon={CompactDown} className={'text-primary'} size={16} />
      </Button>
    ) : (
      <Button
        type="button"
        onClick={onSelectAssetClick}
        className="flex justify-center items-center text-font-description-bold text-white bg-primary hover:bg-primary-hover rounded-md py-1"
        style={{ width: '91px' }}
      >
        <T id="selectToken" />
      </Button>
    )}
  </div>
);

export default SwapSelectTokenFace;
