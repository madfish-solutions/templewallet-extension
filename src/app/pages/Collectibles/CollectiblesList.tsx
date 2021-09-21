import React, {useCallback, useEffect, useMemo, useState} from 'react';

import classNames from "clsx";

import {T} from "../../../lib/i18n/react";
import {
    isFungibleTokenDisplayed, useAccount,
    useAllCollectiblesBaseMetadata, useAllKnownCollectibleTokenSlugs,
    useChainId, useCollectibleTokens,
    useFungibleTokens
} from "../../../lib/temple/front";
import {Link} from "../../../lib/woozie";
import {ReactComponent as AddToListIcon} from "../../icons/add-to-list.svg";
import SearchAssetField from "../../templates/SearchAssetField";
import {AssetsSelectors} from "../Explore/Assets.selectors";
import {TokenStatuses} from "../ManageAssets";
import CollectibleItem from "./CollectibleItem";

const assetType = 'collectibles'

const CollectiblesList = () => {
    const chainId = useChainId(true)!;
    const account = useAccount();
    const address = account.publicKeyHash;
    console.log({chainId, address})
    const {data: collectibles = [], error: error1} = useCollectibleTokens(chainId, address);
    console.log({error1, collectibles})
    const [searchValue, setSearchValue] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);

    const handleSearchFieldFocus = useCallback(() => {
        setSearchFocused(true);
    }, [setSearchFocused]);
    const handleSearchFieldBlur = useCallback(() => {
        setSearchFocused(false);
    }, [setSearchFocused]);

    // const {
    //     data: tokens = [],
    //     revalidate,
    //     isValidating: fungibleTokensLoading,
    // } = useFungibleTokens(chainId, address);
    // const tokenStatuses = useMemo(() => {
    //     const statuses: TokenStatuses = {};
    //     for (const t of tokens) {
    //         statuses[t.tokenSlug] = {
    //             displayed: isFungibleTokenDisplayed(t),
    //             removed: t.status === ITokenStatus.Removed,
    //         };
    //     }
    //     return statuses;
    // }, [tokens]);

    // console.log({tokenStatuses})

    const collectiblesArray = useMemo(() =>
        Object.keys(allCollectiblesBaseMetadata).map((item) => {
            return Object.assign(allCollectiblesBaseMetadata[item], {contract: item});
        }), [allCollectiblesBaseMetadata])

    console.log({collectiblesArray})

    useEffect(() => {
        console.log({searchValue})
    }, [searchValue])

    return (
        <div className={classNames("w-full max-w-sm mx-auto")}>
            <div className="mt-1 mb-3 w-full flex items-strech">
                <SearchAssetField
                    value={searchValue}
                    onValueChange={setSearchValue}
                    onFocus={handleSearchFieldFocus}
                    onBlur={handleSearchFieldBlur}
                />

                <Link
                    to={`/manage-assets/${assetType}`}
                    className={classNames(
                        "ml-2 flex-shrink-0",
                        "px-3 py-1",
                        "rounded overflow-hidden",
                        "flex items-center",
                        "text-gray-600 text-sm",
                        "transition ease-in-out duration-200",
                        "hover:bg-gray-100",
                        "opacity-75 hover:opacity-100 focus:opacity-100"
                    )}
                    testID={AssetsSelectors.ManageButton}
                >
                    <AddToListIcon
                        className={classNames("mr-1 h-5 w-auto stroke-current stroke-2")}
                    />
                    <T id="manage" />
                </Link>
            </div>
            <div className='mt-1 mb-3 w-full border rounded border-gray-200'>
                {collectiblesArray.map((item) => (
                    <CollectibleItem key={item.name} collectible={item} />
                ))}
            </div>
        </div>
    )
}

export default CollectiblesList;
