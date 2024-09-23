import React, { memo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as CompactDownIcon } from 'app/icons/base/compact_down.svg';
import { TezosPreActivity } from 'lib/activity/tezos/types';
import { t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { useExplorerHref } from 'temple/front/block-explorers';
import { TezosChain } from 'temple/front/chains';

import { InteractionsConnector } from './InteractionsConnector';
import { TezosActivityOperationComponent } from './TezosActivityOperation';

interface Props {
  activity: TezosPreActivity;
  chain: TezosChain;
  accountAddress: string;
}

export const TezosActivityComponent = memo<Props>(({ activity, chain, accountAddress }) => {
  const [expanded, , , toggleExpanded] = useBooleanState(false);

  const networkName = chain.nameI18nKey ? t(chain.nameI18nKey) : chain.name;

  const { hash } = activity;

  const blockExplorerUrl = useExplorerHref(chain.chainId, hash);

  const operations = activity.operations;

  return (
    <div className="flex flex-col">
      {operations.slice(0, 3).map((operation, i) => (
        <React.Fragment key={`${hash}-${i}`}>
          {i > 0 && <InteractionsConnector />}

          <TezosActivityOperationComponent
            hash={hash}
            operation={operation}
            chain={chain}
            networkName={networkName}
            blockExplorerUrl={blockExplorerUrl}
            accountAddress={accountAddress}
          />
        </React.Fragment>
      ))}

      {operations.length > 3 ? (
        <>
          <button
            className="ml-2 mt-1 mb-2 flex px-1 py-0.5 text-font-description-bold text-grey-1"
            onClick={toggleExpanded}
          >
            <span>{expanded ? 'Show less' : 'Show more'}</span>

            <IconBase Icon={CompactDownIcon} size={12} className={clsx('text-grey-2', expanded && 'rotate-180')} />
          </button>

          {expanded
            ? operations.slice(3).map((operation, j) => (
                <React.Fragment key={`${hash}-${j}`}>
                  {j > 0 && <InteractionsConnector />}

                  <TezosActivityOperationComponent
                    hash={hash}
                    operation={operation}
                    chain={chain}
                    networkName={networkName}
                    blockExplorerUrl={blockExplorerUrl}
                    accountAddress={accountAddress}
                  />
                </React.Fragment>
              ))
            : null}
        </>
      ) : null}
    </div>
  );
});
