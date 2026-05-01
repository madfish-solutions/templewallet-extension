import React from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { HashShortView, IconBase, TxHashAnchor } from 'app/atoms';
import { Loader } from 'app/atoms/Loader';
import Money from 'app/atoms/Money';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { CrossChainExchange, CrossChainPhase } from 'app/store/cross-chain-send/state';
import InFiat from 'app/templates/InFiat';
import { T } from 'lib/i18n';
import { useBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { CrossChainAssetIcon } from './CrossChainAssetIcon';

interface Props {
  exchange: CrossChainExchange;
  onClick: EmptyFn;
}

type UiStatus = 'pending' | 'failed' | 'success';

const phaseToStatus = (phase: CrossChainPhase): UiStatus => {
  if (phase === 'COMPLETED') return 'success';
  if (phase === 'FAILED') return 'failed';
  return 'pending';
};

export const CrossChainActivityRow = ({ exchange, onClick }: Props) => {
  const status = phaseToStatus(exchange.phase);
  const { fromAsset, fromAmount, recipient, sourceTxHash } = exchange;

  const bnAmount = fromAmount ? new BigNumber(fromAmount) : new BigNumber(0);
  const hasFromFiat = Boolean(fromAsset.chainId && fromAsset.assetSlug);
  const isEvm = fromAsset.chainKind === TempleChainKind.EVM;

  const showTxLink = status !== 'pending' && Boolean(sourceTxHash);

  return (
    <button
      type="button"
      onClick={onClick}
      className="z-1 relative group flex gap-x-2 p-2 rounded-lg text-left cursor-pointer hover:bg-secondary-low w-full"
    >
      <CrossChainAssetIcon asset={fromAsset} size={36} className="shrink-0" style={{ width: 40, height: 40 }} />

      <div className="grow flex flex-col gap-y-1 whitespace-nowrap overflow-hidden">
        <div className="flex gap-x-2 justify-between">
          <div className="shrink-0 flex items-center gap-x-1">
            <span className="text-font-medium">
              <T id="send" />
            </span>
            {status === 'pending' && <Loader size="S" trackVariant="dark" className="text-secondary" />}
            {status === 'failed' && (
              <span className="text-font-small-bold h-4 px-1 leading-4 text-error border-0.5 border-error bg-error-low rounded">
                <T id="failedBadge" />
              </span>
            )}
            {status === 'success' && (
              <span className="text-font-small-bold h-4 px-1 leading-4 text-success border-0.5 border-success bg-success-low rounded">
                <T id="successBadge" />
              </span>
            )}
          </div>

          <div className={clsx('max-w-40 flex text-font-num-14 overflow-hidden', 'group-hover:hidden')}>
            -<Money smallFractionFont={false}>{bnAmount}</Money>
            <span className="whitespace-pre"> {fromAsset.symbol}</span>
          </div>
        </div>

        <div className="flex gap-x-2 justify-between text-font-num-12 text-grey-1">
          {showTxLink && sourceTxHash ? (
            <SourceTxHashLink
              chainKind={exchange.sourceChainKind}
              chainId={exchange.sourceChainId}
              txHash={sourceTxHash}
            />
          ) : (
            <span className="truncate">
              <T id="toLabel" /> <HashShortView hash={recipient} firstCharsCount={6} lastCharsCount={4} />
            </span>
          )}

          <div className={clsx('shrink-0 flex', 'group-hover:hidden')}>
            {hasFromFiat && (
              <InFiat
                assetSlug={fromAsset.assetSlug!}
                chainId={fromAsset.chainId!}
                volume={bnAmount.negated()}
                evm={isEvm}
                smallFractionFont={false}
                withSign
              >
                {({ balance, symbol, noPrice }) =>
                  noPrice ? (
                    <span>—</span>
                  ) : (
                    <>
                      {balance}
                      <span className="ml-1">{symbol}</span>
                    </>
                  )
                }
              </InFiat>
            )}
          </div>
        </div>
      </div>

      <span
        className={clsx(
          'flex items-center flex-nowrap py-0.5 px-1 text-secondary pointer-events-none',
          'absolute right-2 top-1/2 -translate-y-1/2',
          'hidden group-hover:flex'
        )}
      >
        <span className="text-font-description-bold">
          <T id="details" />
        </span>
        <IconBase Icon={ChevronRightIcon} size={12} />
      </span>
    </button>
  );
};

interface SourceTxHashLinkProps {
  chainKind: TempleChainKind;
  chainId: string | number;
  txHash: string;
}

const SourceTxHashLink = ({ chainKind, chainId, txHash }: SourceTxHashLinkProps) => {
  const explorerHref = useBlockExplorerHref(chainKind, chainId, 'tx', txHash);
  return <TxHashAnchor href={explorerHref} hash={txHash} />;
};
