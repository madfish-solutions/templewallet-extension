import React from 'react';

import classNames from "clsx";

import PageLayout from "app/layouts/PageLayout";

import {formatImgUri} from "../../../lib/image-uri";
import {useAllCollectiblesBaseMetadata} from "../../../lib/temple/front";

const CollectiblePage = ({address}) => {
    const allCollectiblesBaseMetadata = useAllCollectiblesBaseMetadata();
    const collectibleData = allCollectiblesBaseMetadata[address]
    return (
        <PageLayout
            pageTitle={collectibleData.name}
        >
            <div className={classNames("w-full max-w-sm mx-auto")}>
                <div style={{borderRadius: '12px'}} className={'border border-gray-300 max-w-xs p-6 mx-auto my-10'}>
                    <img src={formatImgUri(collectibleData.artifactUri)} alt=""/>
                </div>
            </div>
        </PageLayout>

    )
}

export default CollectiblePage
