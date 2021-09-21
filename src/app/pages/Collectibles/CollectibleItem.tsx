import React, {useState} from 'react';

import {formatImgUri} from "../../../lib/image-uri";
import {Link} from "../../../lib/woozie";
import {ReactComponent as CollectiblePlaceholder} from "../../icons/collectiblePlaceholder.svg";

const CollectibleItem = ({collectible}) => {
    const [isLoaded, setIsLoaded] = useState(false)
    return (
        <Link to={`/collectible/${collectible.contract}`}>
            <div className="flex items-center">
                <div className="p-2">
                    <div style={{borderRadius: '12px'}} className="border border-gray-300 w-16 h-16 flex items-center justify-center">
                        <img onLoad={() => setIsLoaded(true)} style={!isLoaded ? {display: 'none'} : {}} className='w-12 h-12' src={formatImgUri(collectible.artifactUri)} />
                        {!isLoaded && <CollectiblePlaceholder />}
                    </div>
                </div>
                <div className="pl-2">
                    <p style={{color: '#1B262C'}} className="text-sm">{collectible.name}</p>
                    <p className="text-gray-600 text-xs">Last price 1000000 tez</p>
                </div>
            </div>
        </Link>
    )
}

export default CollectibleItem;
