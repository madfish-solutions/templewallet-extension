import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { HashChip, IconBase, Spinner } from 'app/atoms';
import Money from 'app/atoms/Money';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import InFiat from 'app/templates/InFiat';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n';
import { OneOfChains, useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

const getNetworkName = (network: OneOfChains | null) => network?.name || 'Unknown';

interface Props {
  chainAssetSlug: string;
  recipientAddress: string;
  estimatedFee: string;
  goToFeeTab: EmptyFn;
  estimatingFee?: boolean;
}

export const DetailsTab: FC<Props> = ({
  chainAssetSlug,
  recipientAddress,
  estimatedFee,
  estimatingFee = false,
  goToFeeTab
}) => {
  const [chainKind, chainId, assetSlug] = useMemo(() => parseChainAssetSlug(chainAssetSlug), [chainAssetSlug]);

  const isEvm = chainKind === TempleChainKind.EVM;

  return (
    <div className="flex flex-col px-4 py-2 mb-6 rounded-lg shadow-bottom border-0.5 border-transparent">
      <div className="py-2 flex flex-row justify-between items-center border-b-0.5 border-lines">
        <p className="p-1 text-font-description text-grey-1">
          <T id="network" />
        </p>
        <div className="flex flex-row items-center">
          {isEvm ? <EvmNetworkInfo chainId={chainId} /> : <TezosNetworkInfo chainId={chainId} />}
        </div>
      </div>

      <div className="py-2 flex flex-row justify-between items-center border-b-0.5 border-lines">
        <p className="p-1 text-font-description text-grey-1">
          <T id="recipient" />
        </p>
        <HashChip hash={recipientAddress} small rounded="base" textShade={100} bgShade={50} />
      </div>

      <div className={clsx('py-2 flex flex-row justify-between items-center', !isEvm && 'border-b-0.5 border-lines')}>
        <p className="p-1 text-font-description text-grey-1">
          <T id="gasFee" />
        </p>
        <div className="flex flex-row items-center">
          <FeesInfo
            chainId={chainId}
            assetSlug={assetSlug}
            isEvm={isEvm}
            loading={estimatingFee}
            amount={estimatedFee}
            goToFeeTab={goToFeeTab}
          />
        </div>
      </div>
      {!isEvm && (
        <div className="py-2 flex flex-row justify-between items-center">
          <p className="p-1 text-font-description text-grey-1">Storage Limit</p>
          <div className="flex flex-row items-center">
            <FeesInfo
              chainId={chainId}
              assetSlug={assetSlug}
              isEvm={isEvm}
              loading={false}
              amount={'0.001'}
              goToFeeTab={goToFeeTab}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const EvmNetworkInfo: FC<{ chainId: number }> = ({ chainId }) => {
  const network = useEvmChainByChainId(chainId);
  const networkName = network?.name || 'Unknown';

  return (
    <>
      <span className="p-1 text-font-description-bold">{networkName}</span>
      <EvmNetworkLogo networkName={networkName} chainId={chainId} />
    </>
  );
};

const TezosNetworkInfo: FC<{ chainId: string }> = ({ chainId }) => {
  const network = useTezosChainByChainId(chainId);
  const networkName = getNetworkName(network);

  return (
    <>
      <span className="p-1 text-font-description-bold">{networkName}</span>
      <TezosNetworkLogo networkName={networkName} chainId={chainId} />
    </>
  );
};

interface FeesInfoProps {
  chainId: string | number;
  assetSlug: string;
  isEvm: boolean;
  amount: string;
  goToFeeTab: EmptyFn;
  loading?: boolean;
}

const FeesInfo: FC<FeesInfoProps> = ({ chainId, assetSlug, isEvm, loading, amount, goToFeeTab }) => {
  if (loading)
    return (
      <div className="flex justify-center items-center w-25">
        <Spinner theme="gray" className="w-8" />
      </div>
    );

  return (
    <>
      <div className="p-1 text-font-num-bold-12">
        <InFiat
          chainId={chainId}
          assetSlug={assetSlug}
          volume={amount}
          smallFractionFont={false}
          roundingMode={BigNumber.ROUND_FLOOR}
          evm={isEvm}
        >
          {({ balance, symbol }) => (
            <span className="pr-1 border-r-1.5 border-lines">
              {symbol}
              {balance}
            </span>
          )}
        </InFiat>
        <span className="pl-1 ">
          <Money cryptoDecimals={6} smallFractionFont={false} tooltipPlacement="bottom">
            {amount}
          </Money>{' '}
          {isEvm ? 'ETH' : 'TEZ'}
        </span>
      </div>
      <IconBase Icon={ChevronRightIcon} className="text-primary cursor-pointer" onClick={goToFeeTab} />
    </>
  );
};
