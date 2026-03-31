import React, { memo } from 'react';

import clsx from 'clsx';

import { DropdownTriggerButton } from 'app/atoms/dropdown-trigger-button';
import Money from 'app/atoms/Money';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { EvmBalance, TezosBalance } from 'app/templates/Balance';
import { setAnotherSelector, setTestID, TestIDProperty } from 'lib/analytics';
import { T } from 'lib/i18n';
import {
  getAssetSymbol,
  useEvmCategorizedAssetMetadata,
  useCategorizedTezosAssetMetadata,
  isCollectible,
  getTokenName
} from 'lib/metadata';
import { getCollectibleName, isEvmCollectible } from 'lib/metadata/utils';
import { EvmChain, OneOfChains, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface BaseProps extends TestIDProperty {
  assetSlug: string;
  onClick?: EmptyFn;
  className?: string;
}

interface SelectAssetButtonProps extends BaseProps {
  network: OneOfChains;
  accountPkh: string | HexString;
}

export const SelectAssetButton = memo<SelectAssetButtonProps>(({ assetSlug, network, accountPkh, ...rest }) =>
  network.kind === TempleChainKind.Tezos ? (
    <TezosContent network={network} accountPkh={accountPkh} assetSlug={assetSlug} {...rest} />
  ) : (
    <EvmContent network={network} accountPkh={accountPkh as HexString} assetSlug={assetSlug} {...rest} />
  )
);

const BaseContent = memo<BaseProps & PropsWithChildren>(({ assetSlug, testID, onClick, className, children }) => (
  <DropdownTriggerButton className={clsx('py-1.5 px-3', className)} onClick={onClick}>
    <div className="flex justify-center items-center" {...setTestID(testID)} {...setAnotherSelector('slug', assetSlug)}>
      {children}
    </div>
  </DropdownTriggerButton>
));

interface TezosContentProps extends BaseProps {
  network: TezosChain;
  accountPkh: string;
  assetSlug: string;
}

const TezosContent = memo<TezosContentProps>(({ network, accountPkh, assetSlug, onClick, ...rest }) => {
  const metadata = useCategorizedTezosAssetMetadata(assetSlug, network.chainId);

  return (
    <BaseContent assetSlug={assetSlug} onClick={isCollectible(metadata) ? undefined : onClick} {...rest}>
      <TezosAssetIconWithNetwork tezosChainId={network.chainId} assetSlug={assetSlug} />

      <TezosBalance network={network} assetSlug={assetSlug} address={accountPkh}>
        {balance => (
          <div className="flex flex-col items-start ml-2">
            <span className={clsx('text-font-description-bold mb-0.5', isCollectible(metadata) && 'max-w-70 truncate')}>
              {isCollectible(metadata) ? getTokenName(metadata) : getAssetSymbol(metadata)}
            </span>

            <span className="text-font-num-12 text-grey-1">
              <Money smallFractionFont={false}>{balance}</Money>
              <span className="ml-0.5">
                <T id="available" />
              </span>
            </span>
          </div>
        )}
      </TezosBalance>
    </BaseContent>
  );
});

interface EvmContentProps extends BaseProps {
  network: EvmChain;
  accountPkh: HexString;
  assetSlug: string;
}

const EvmContent = memo<EvmContentProps>(({ network, accountPkh, assetSlug, onClick, ...rest }) => {
  const metadata = useEvmCategorizedAssetMetadata(assetSlug, network.chainId);

  return (
    <BaseContent assetSlug={assetSlug} onClick={isEvmCollectible(metadata) ? undefined : onClick} {...rest}>
      <EvmAssetIconWithNetwork evmChainId={network.chainId} assetSlug={assetSlug} />

      <EvmBalance network={network} address={accountPkh} assetSlug={assetSlug}>
        {balance => (
          <div className="flex flex-col items-start ml-2">
            <span
              className={clsx('text-font-description-bold mb-0.5', isEvmCollectible(metadata) && 'max-w-70 truncate')}
            >
              {isEvmCollectible(metadata) ? getCollectibleName(metadata) : getAssetSymbol(metadata)}
            </span>

            <span className="text-font-num-12 text-grey-1">
              <span className="-ml-px">
                <Money smallFractionFont={false}>{balance}</Money>
              </span>
              <span className="ml-0.5">
                <T id="available" />
              </span>
            </span>
          </div>
        )}
      </EvmBalance>
    </BaseContent>
  );
});
