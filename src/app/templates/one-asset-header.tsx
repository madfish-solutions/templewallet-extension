import React, { FC, memo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import InFiat from 'app/templates/InFiat';
import { getTokenName, isCollectible, useEvmGenericAssetMetadata, useGenericTezosAssetMetadata } from 'lib/metadata';
import { ChainAssetMetadata } from 'lib/metadata/types';
import { getAssetSymbol, isEvmCollectible } from 'lib/metadata/utils';
import { ChainId, ChainOfKind } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

interface ContentProps<T extends TempleChainKind> {
  network: ChainOfKind<T>;
  assetSlug: string;
  amount: string;
  className?: string;
}

const ContentHOC = <T extends TempleChainKind>(
  useAssetMetadata: (assetSlug: string, chainId: ChainId<T>) => ChainAssetMetadata<T> | undefined,
  isChainCollectible: SyncFn<ChainAssetMetadata<T> | undefined, boolean>,
  AssetIconWithNetwork: FC<{ assetSlug: string; chainId: ChainId<T> }>
) =>
  memo<ContentProps<T>>(({ network, assetSlug, amount, className }) => {
    const metadata = useAssetMetadata(assetSlug, network.chainId);

    return (
      <div className={clsx('flex flex-col justify-center items-center text-center', className)}>
        <AssetIconWithNetwork chainId={network.chainId} assetSlug={assetSlug} />

        <p className="text-font-num-bold-14 mt-2 max-w-88 truncate">
          <span>{amount}</span>
          <span className="ml-1">
            {isChainCollectible(metadata) ? getTokenName(metadata) : getAssetSymbol(metadata)}
          </span>
        </p>
        {!isChainCollectible(metadata) && <AmountInFiat network={network} assetSlug={assetSlug} amount={amount} />}
      </div>
    );
  });

const TezosContent = ContentHOC<TempleChainKind.Tezos>(
  useGenericTezosAssetMetadata,
  isCollectible,
  ({ assetSlug, chainId }) => <TezosAssetIconWithNetwork tezosChainId={chainId} assetSlug={assetSlug} />
);
const EvmContent = ContentHOC<TempleChainKind.EVM>(
  useEvmGenericAssetMetadata,
  isEvmCollectible,
  ({ assetSlug, chainId }) => <EvmAssetIconWithNetwork evmChainId={chainId} assetSlug={assetSlug} />
);

type OneAssetHeaderProps = ContentProps<TempleChainKind>;

export const OneAssetHeader = memo<OneAssetHeaderProps>(({ network, ...rest }) =>
  network.kind === TempleChainKind.Tezos ? (
    <TezosContent network={network} {...rest} />
  ) : (
    <EvmContent network={network} {...rest} />
  )
);

const AmountInFiat = memo<Omit<OneAssetHeaderProps, 'className'>>(({ network, assetSlug, amount }) => (
  <InFiat
    chainId={network.chainId}
    assetSlug={assetSlug}
    volume={amount}
    smallFractionFont={false}
    roundingMode={BigNumber.ROUND_FLOOR}
    evm={network.kind === TempleChainKind.EVM}
  >
    {({ balance, symbol }) => (
      <span className="text-font-num-12 text-grey-1">
        <span>{balance}</span>
        <span className="ml-0.5">{symbol}</span>
      </span>
    )}
  </InFiat>
));
