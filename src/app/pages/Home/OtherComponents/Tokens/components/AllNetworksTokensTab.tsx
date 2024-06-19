import React, { FC, useMemo, useRef } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { SyncSpinner } from 'app/atoms';
import { FilterButton } from 'app/atoms/FilterButton';
import { IconButton } from 'app/atoms/IconButton';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options';
import { useAccountTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ContentContainer, StickyBar } from 'app/layouts/containers';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { SearchBarField } from 'app/templates/SearchField';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EmptySection } from './EmptySection';
import { EvmListItem, TezosListItem } from './ListItem';

interface AllNetworksTokensTabProps {
  accountTezAddress: string;
  accountEvmAddress: HexString;
}

export const AllNetworksTokensTab: FC<AllNetworksTokensTabProps> = ({ accountTezAddress, accountEvmAddress }) => {
  const { filtersOpened, toggleFiltersOpened } = useAssetsFilterOptionsState();

  const { paginatedSlugs, isSyncing, loadNext } = useAccountTokensListingLogic(accountTezAddress, accountEvmAddress);

  const tezosChains = useAllTezosChains();

  const contentElement = useMemo(
    () =>
      paginatedSlugs.map(chainKindSlug => {
        const [chainKind, chainId, assetSlug] = fromChainAssetSlug(chainKindSlug);

        if (chainKind === TempleChainKind.Tezos) {
          return (
            <TezosListItem
              network={tezosChains[chainId]}
              key={chainKindSlug}
              publicKeyHash={accountTezAddress}
              assetSlug={assetSlug}
            />
          );
        }

        return (
          <EvmListItem
            key={chainKindSlug}
            chainId={chainId as number}
            assetSlug={assetSlug}
            publicKeyHash={accountEvmAddress}
          />
        );
      }),
    [paginatedSlugs, tezosChains]
  );

  const stickyBarRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <StickyBar ref={stickyBarRef}>
        <SearchBarField disabled value="" onValueChange={emptyFn} testID={AssetsSelectors.searchAssetsInputTokens} />

        <FilterButton ref={filterButtonRef} active={filtersOpened} onClick={toggleFiltersOpened} />

        <IconButton Icon={ManageIcon} />
      </StickyBar>

      <ContentContainer>
        {paginatedSlugs.length === 0 ? (
          <EmptySection isSyncing={isSyncing} />
        ) : (
          <>
            <SimpleInfiniteScroll loadNext={loadNext}>{contentElement}</SimpleInfiniteScroll>
            {isSyncing && <SyncSpinner className="mt-4" />}
          </>
        )}
      </ContentContainer>
    </>
  );
};
