import React, { memo, useCallback, useState } from 'react';

import { IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import PageLayout from 'app/layouts/PageLayout';
import { ConfirmCrossChainSendModal } from 'app/pages/Send/cross-chain/modals/ConfirmCrossChainSend';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import {
  ActivityListContainer,
  EvmActivityList,
  TezosActivityList,
  MultichainActivityList
} from 'app/templates/activity';
import { NetworkSelectContent } from 'app/templates/NetworkSelectContent';
import { useBooleanState } from 'lib/ui/hooks';
import { HistoryAction, navigate } from 'lib/woozie';
import { OneOfChains } from 'temple/front';

export const ActivityPage = memo(() => {
  const { filterChain: initFilterChain } = useAssetsFilterOptionsSelector();

  const [filterChain, setFilterChain] = useState<FilterChain>(initFilterChain);

  const [filtersModalOpen, setFiltersModalOpen, setFiltersModalClosed] = useBooleanState(false);

  const [openedExchangeId, setOpenedExchangeId] = useState<string | undefined>();

  const handleFilterChainSelect = useCallback(
    (chain: OneOfChains | null) => {
      setFilterChain(chain);
      setFiltersModalClosed();
    },
    [setFiltersModalClosed]
  );

  const handleCrossChainExchangeClick = (id: string) => setOpenedExchangeId(id);
  const handleCrossChainModalClose = () => setOpenedExchangeId(undefined);

  const handleTryAgain = () => {
    setOpenedExchangeId(undefined);
    navigate('/send?tab=cross-chain', HistoryAction.Push);
  };

  return (
    <PageLayout
      pageTitle="Activity"
      contentPadding
      headerRightElem={
        <IconBase
          Icon={filterChain ? FilterOnIcon : FilterOffIcon}
          className="text-primary cursor-pointer"
          onClick={setFiltersModalOpen}
        />
      }
    >
      <PageModal title="Filter by Network" opened={filtersModalOpen} onRequestClose={setFiltersModalClosed}>
        {() => (
          <NetworkSelectContent
            opened={filtersModalOpen}
            selectedNetwork={filterChain}
            handleNetworkSelect={handleFilterChainSelect}
          />
        )}
      </PageModal>

      {filterChain ? (
        <ActivityListContainer chainId={filterChain.chainId}>
          {filterChain.kind === 'tezos' ? (
            <TezosActivityList
              tezosChainId={filterChain.chainId}
              onCrossChainExchangeClick={handleCrossChainExchangeClick}
            />
          ) : (
            <EvmActivityList chainId={filterChain.chainId} onCrossChainExchangeClick={handleCrossChainExchangeClick} />
          )}
        </ActivityListContainer>
      ) : (
        <ActivityListContainer>
          <MultichainActivityList onCrossChainExchangeClick={handleCrossChainExchangeClick} />
        </ActivityListContainer>
      )}

      <ConfirmCrossChainSendModal
        opened={Boolean(openedExchangeId)}
        initialExchangeId={openedExchangeId}
        onRequestClose={handleCrossChainModalClose}
        onTryAgain={handleTryAgain}
      />
    </PageLayout>
  );
});
