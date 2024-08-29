import React, { memo, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { Button, IconBase } from 'app/atoms';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { EmptyState } from 'app/atoms/EmptyState';
import { PageModal } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { TezosListItem } from 'app/pages/Home/OtherComponents/Tokens/components/ListItem';
import { SearchBarField } from 'app/templates/SearchField';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { T } from 'lib/i18n';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { TezosNetworkEssentials } from 'temple/networks';

interface SelectTokenModalProps {
  network: TezosNetworkEssentials;
  publicKeyHash: string;
  slugs: string[];
  onAssetSelect: (slug: string) => void;
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const SelectAssetModal = memo<SelectTokenModalProps>(
  ({ network, publicKeyHash, slugs, onAssetSelect, opened, onRequestClose }) => {
    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const getAssetMetadata = useGetChainTokenOrGasMetadata(network.chainId);

    const searchedSlugs = useMemo(
      () => searchTezosChainAssetsWithNoMeta(searchValueDebounced, slugs, getAssetMetadata, s => s),
      [slugs, getAssetMetadata, searchValueDebounced]
    );

    return (
      <PageModal title="Select Token" opened={opened} onRequestClose={onRequestClose}>
        <div className="flex flex-col px-4 pt-4 pb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-font-description-bold">Filter by network</span>
            <FilterNetworkPopper />
          </div>

          <SearchBarField
            value={searchValue}
            placeholder="Token name"
            defaultRightMargin={false}
            onValueChange={setSearchValue}
          />
        </div>

        <div className="px-4 flex-1 flex flex-col overflow-y-auto">
          {searchedSlugs.length === 0 && <EmptyState />}

          {searchedSlugs.map(slug => (
            <TezosListItem
              key={slug}
              network={network}
              publicKeyHash={publicKeyHash}
              assetSlug={slug}
              onClick={e => {
                e.preventDefault();
                onAssetSelect(slug);
                onRequestClose();
              }}
            />
          ))}
        </div>

        <div className="p-4 pb-6 flex flex-col bg-white">
          <StyledButton size="L" color="primary-low" onClick={onRequestClose}>
            <T id="close" />
          </StyledButton>
        </div>
      </PageModal>
    );
  }
);

interface FilterOptionProps {
  title: string;
  Icon: ImportedSVGComponent;
  onClick?: EmptyFn;
}

const FilterOption = memo<FilterOptionProps>(({ title, Icon, onClick }) => (
  <div
    className="flex justify-between items-center rounded-md hover:bg-grey-4 p-2 text-font-description"
    onClick={onClick}
  >
    <span>{title}</span>
    <IconBase Icon={Icon} size={16} className="text-primary" />
  </div>
));

const FilterNetworkDropdown = memo<PopperRenderProps>(({ opened }) => (
  <ActionsDropdownPopup title="Select Network" opened={opened} style={{ minWidth: 196 }}>
    <FilterOption title="All Networks" Icon={Browse} />
    <FilterOption title="All Networks" Icon={Browse} />
    <FilterOption title="All Networks" Icon={Browse} />
    <FilterOption title="All Networks" Icon={Browse} />
    <FilterOption title="All Networks" Icon={Browse} />
    <FilterOption title="All Networks" Icon={Browse} />
    <FilterOption title="All Networks" Icon={Browse} />
  </ActionsDropdownPopup>
));

const FilterNetworkPopper = memo(() => (
  <Popper placement="bottom-end" strategy="fixed" popup={props => <FilterNetworkDropdown {...props} />}>
    {({ ref, toggleOpened }) => (
      <Button
        ref={ref}
        className="flex items-center p-0.5 text-font-description-bold text-secondary"
        onClick={toggleOpened}
      >
        <span>Tezos</span>
        <IconBase Icon={CompactDown} size={12} />
      </Button>
    )}
  </Popper>
));
