import React, { memo, useCallback, useState } from 'react';

import { IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import {
  ActivityListContainer,
  EvmActivityList,
  TezosActivityList,
  MultichainActivityList
} from 'app/templates/activity';
import { NetworkSelectModalContent } from 'app/templates/NetworkSelectModal';
import { useBooleanState } from 'lib/ui/hooks';
import { OneOfChains } from 'temple/front';

export const ActivityPage = memo(() => {
  const { filterChain: initFilterChain } = useAssetsFilterOptionsSelector();

  const [filterChain, setFilterChain] = useState<FilterChain>(initFilterChain);

  const [filtersModalOpen, setFiltersModalOpen, setFiltersModalClosed] = useBooleanState(false);

  const handleFilterChainSelect = useCallback(
    (chain: OneOfChains | null) => {
      setFilterChain(chain);
      setFiltersModalClosed();
    },
    [setFiltersModalClosed]
  );

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
          <NetworkSelectModalContent
            opened={filtersModalOpen}
            selectedNetwork={filterChain}
            handleNetworkSelect={handleFilterChainSelect}
          />
        )}
      </PageModal>

      {filterChain ? (
        <ActivityListContainer chainId={filterChain.chainId}>
          {filterChain.kind === 'tezos' ? (
            <TezosActivityList tezosChainId={filterChain.chainId} />
          ) : (
            <EvmActivityList chainId={filterChain.chainId} />
          )}
        </ActivityListContainer>
      ) : (
        <ActivityListContainer>
          <MultichainActivityList />
        </ActivityListContainer>
      )}
    </PageLayout>
  );
});
