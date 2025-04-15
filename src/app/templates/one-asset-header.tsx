import React, { memo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import InFiat from 'app/templates/InFiat';
import {
  useCategorizedTezosAssetMetadata,
  isCollectible,
  useEvmCategorizedAssetMetadata,
  getTokenName
} from 'lib/metadata';
import { getCollectibleName, isEvmCollectible } from 'lib/metadata/utils';
import { EvmChain, OneOfChains, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface BaseProps {
  assetSlug: string;
  amount: string;
  className?: string;
}

interface OneAssetHeaderProps extends BaseProps {
  network: OneOfChains;
}

export const OneAssetHeader = memo<OneAssetHeaderProps>(({ network, ...rest }) =>
  network.kind === TempleChainKind.Tezos ? (
    <TezosContent network={network} {...rest} />
  ) : (
    <EvmContent network={network} {...rest} />
  )
);

interface TezosContentProps extends BaseProps {
  network: TezosChain;
}

const TezosContent = memo<TezosContentProps>(({ network, assetSlug, amount, className }) => {
  const metadata = useCategorizedTezosAssetMetadata(assetSlug, network.chainId);

  return (
    <div className={clsx('flex flex-col justify-center items-center text-center', className)}>
      <TezosAssetIconWithNetwork tezosChainId={network.chainId} assetSlug={assetSlug} />

      <p className="text-font-num-bold-14 mt-2 max-w-88 truncate">
        <span>{amount}</span>
        {isCollectible(metadata) && <span className="ml-1">{getTokenName(metadata)}</span>}
      </p>
      {!isCollectible(metadata) && <AmountInFiat network={network} assetSlug={assetSlug} amount={amount} />}
    </div>
  );
});

interface EvmContentProps extends BaseProps {
  network: EvmChain;
}

const EvmContent = memo<EvmContentProps>(({ network, assetSlug, amount, className }) => {
  const metadata = useEvmCategorizedAssetMetadata(assetSlug, network.chainId);

  return (
    <div className={clsx('flex flex-col justify-center items-center text-center', className)}>
      <EvmAssetIconWithNetwork evmChainId={network.chainId} assetSlug={assetSlug} />

      <p className="text-font-num-bold-14 mt-2 max-w-88 truncate">
        <span>{amount}</span>
        {isEvmCollectible(metadata) && <span className="ml-1">{getCollectibleName(metadata)}</span>}
      </p>
      {!isEvmCollectible(metadata) && <AmountInFiat network={network} assetSlug={assetSlug} amount={amount} />}
    </div>
  );
});

const AmountInFiat = memo<Omit<OneAssetHeaderProps, 'className'>>(({ network, assetSlug, amount }) => (
  <InFiat
    chainId={network.chainId}
    assetSlug={assetSlug}
    volume={amount}
    smallFractionFont={false}
    roundingMode={BigNumber.ROUND_FLOOR}
  >
    {({ balance, symbol }) => (
      <span className="text-font-num-12 text-grey-1">
        {balance}
        {symbol}
      </span>
    )}
  </InFiat>
));
