import React from 'react';

import {ReactComponent as CollectiblePlaceholder} from "../../icons/collectiblePlaceholder.svg";

const CollectibleItem = ({collectible}) => {
    console.log({collectible})
    return (
        <div className="flex items-center">
            <div className="p-2">
                <div style={{borderRadius: '12px'}} className="border border-gray-300 w-16 h-16 flex items-center justify-center">
                    <CollectiblePlaceholder style={{}} />
                </div>
            </div>
            <div className="pl-2">
                <p style={{color: '#1B262C'}} className="text-sm">NFT name</p>
                <p className="text-gray-600 text-xs">Last price 1000000 tez</p>
            </div>
        </div>
    )
}

export default CollectibleItem;
