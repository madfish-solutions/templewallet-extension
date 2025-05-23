import React, { FC } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';

interface SwapFieldProps {
  inputName: 'input' | 'output';
  chainId: string | number;
  assetSlug?: string;
  assetSymbol: string;
  onSelectAssetClick: (field: 'from' | 'to') => void;
  testId?: string;
}

const SwapSelectTokenFace: FC<SwapFieldProps> = ({
  inputName,
  chainId,
  assetSlug,
  assetSymbol,
  onSelectAssetClick,
  testId
}) => (
  <div {...setTestID(testId)}>
    {assetSlug ? (
      <Button
        onClick={() => onSelectAssetClick(inputName === 'input' ? 'from' : 'to')}
        className="bg-white py-[3px] px-2 rounded-8 flex items-center justify-between -mr-2.5 cursor-pointer w-[120px]"
      >
        <div className="flex items-center">
          {typeof chainId === 'string' ? (
            <TezosAssetIconWithNetwork tezosChainId={chainId} assetSlug={assetSlug} size={32} />
          ) : (
            <EvmAssetIconWithNetwork evmChainId={chainId} assetSlug={assetSlug} size={32} />
          )}
          <span className="text-text text-xs font-semibold overflow-hidden max-w-10 text-ellipsis">{assetSymbol}</span>
        </div>
        <IconBase Icon={CompactDown} className="text-primary" />
      </Button>
    ) : (
      <Button
        type="button"
        onClick={() => onSelectAssetClick(inputName === 'input' ? 'from' : 'to')}
        className="flex justify-center items-center text-font-description-bold text-white bg-primary hover:bg-primary-hover rounded-md py-1"
        style={{ width: '91px' }}
      >
        <T id="selectToken" />
      </Button>
    )}
  </div>
);

export default SwapSelectTokenFace;
