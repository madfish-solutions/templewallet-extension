import React, {useCallback, useMemo, useState} from 'react';

import classNames from "clsx";

import {T} from "../../../lib/i18n/react";
import {useAllCollectiblesBaseMetadata} from "../../../lib/temple/front";
import {Link} from "../../../lib/woozie";
import {ReactComponent as AddToListIcon} from "../../icons/add-to-list.svg";
import SearchAssetField from "../../templates/SearchAssetField";
import {AssetsSelectors} from "../Explore/Assets.selectors";

const CollectiblesList = () => {
    const allCollectiblesBaseMetadata = useAllCollectiblesBaseMetadata();
    const [searchValue, setSearchValue] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);

    const handleSearchFieldFocus = useCallback(() => {
        setSearchFocused(true);
    }, [setSearchFocused]);
    const handleSearchFieldBlur = useCallback(() => {
        setSearchFocused(false);
    }, [setSearchFocused]);

    console.log({allCollectiblesBaseMetadata})

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
                    to="/manage-assets"
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

        </div>
    )
}

export default CollectiblesList;
