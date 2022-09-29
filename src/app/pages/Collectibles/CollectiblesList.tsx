import React from 'react';

import classNames from 'clsx';

import { ReactComponent as AddToListIcon } from 'app/icons/add-to-list.svg';
import { CollectibleItem } from 'app/pages/Collectibles/CollectibleItem';
import { AssetsSelectors } from 'app/pages/Explore/Assets.selectors';
import SearchAssetField from 'app/templates/SearchAssetField';
import { T } from 'lib/i18n/react';
import { AssetTypesEnum, useFilteredAssets } from 'lib/temple/assets';
import { useAccount, useAllTokensBaseMetadata, useChainId, useCollectibleTokens } from 'lib/temple/front';
import { useNonFungibleTokensBalances } from 'lib/temple/front/non-fungible-tokens-balances';
import { TZKT_FETCH_QUERY_SIZE } from 'lib/tzkt';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';
import { Link } from 'lib/woozie';

const CollectiblesList = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const { data: collectibles = [] } = useCollectibleTokens(chainId, publicKeyHash, true);

  const collectibleSlugs = collectibles.map(collectible => collectible.tokenSlug);

  const { filteredAssets, searchValue, setSearchValue } = useFilteredAssets(collectibleSlugs);

  return (
    <div className={classNames('w-full max-w-sm mx-auto')}>
      <div className="mt-1 mb-3 w-full flex items-strech">
        <SearchAssetField value={searchValue} onValueChange={setSearchValue} />

        <Link
          to={`/manage-assets/${AssetTypesEnum.Collectibles}`}
          className={classNames(
            'ml-2 flex-shrink-0',
            'px-3 py-1',
            'rounded overflow-hidden',
            'flex items-center',
            'text-gray-600 text-sm',
            'transition ease-in-out duration-200',
            'hover:bg-gray-100',
            'opacity-75 hover:opacity-100 focus:opacity-100'
          )}
          testID={AssetsSelectors.ManageButton}
        >
          <AddToListIcon className={classNames('mr-1 h-5 w-auto stroke-current stroke-2')} />
          <T id="manage" />
        </Link>
      </div>
      <div className="mt-1 mb-3 w-full border rounded border-gray-200">
        {filteredAssets.length === 0 ? (
          <p className={'text-gray-600 text-center text-xs py-6'}>
            <T id="zeroCollectibleText" />
          </p>
        ) : (
          <>
            {filteredAssets.map((slug, index) => (
              <CollectibleItem key={slug} assetSlug={slug} index={index} itemsLength={filteredAssets.length} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default CollectiblesList;
