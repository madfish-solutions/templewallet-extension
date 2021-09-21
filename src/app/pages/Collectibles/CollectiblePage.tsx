import React from 'react';

import classNames from "clsx";

import PageLayout from "app/layouts/PageLayout";
import { navigate } from "lib/woozie";

import {T} from "../../../lib/i18n/react";
import {formatImgUri} from "../../../lib/image-uri";
import {useAccount, useChainId, useCollectibleTokens} from "../../../lib/temple/front";
import useCopyToClipboard from "../../../lib/ui/useCopyToClipboard";
import CopyButton from "../../atoms/CopyButton";
import Divider from "../../atoms/Divider";
import FormSubmitButton from "../../atoms/FormSubmitButton";
import HashShortView from "../../atoms/HashShortView";
import {ReactComponent as CopyIcon} from "../../icons/copy.svg";


const CollectiblePage = ({address}) => {
    const { copy } = useCopyToClipboard();
    const chainId = useChainId(true)!;
    const account = useAccount();
    const accountAddress = account.publicKeyHash;
    const {data: allCollectibles = [], error} = useCollectibleTokens(chainId, accountAddress);
    console.log({error})
    console.log({allCollectibles})
    const collectibleData = allCollectibles[address]
    return (
        <PageLayout
            pageTitle={collectibleData.name}
        >
            <div
                style={{ maxWidth: "360px", margin: "auto" }}
                className="text-center"
            >
                <div className={classNames("w-full max-w-sm mx-auto")}>
                    <div style={{borderRadius: '12px'}} className={'border border-gray-300 max-w-xs p-6 mx-auto my-10'}>
                        <img src={formatImgUri(collectibleData.artifactUri)} alt=""/>
                    </div>
                </div>
                <Divider />
                <div className="flex justify-between items-baseline mt-4 mb-4">
                    <p className="text-gray-600 text-xs">
                        <T id={"name"} />
                    </p>
                    <p style={{ color: "#1B262C" }} className="text-xs">
                        {collectibleData.name}
                    </p>
                </div>
                <div className="flex justify-between items-baseline mb-4">
                    <p className="text-gray-600 text-xs">
                        <T id={"address"} />
                    </p>
                    <span>
                      <p
                          style={{ color: "#1B262C" }}
                          className="text-xs inline align-text-bottom"
                      >
                          <a
                              className={"text-blue-700 underline"}
                              href={address}
                          >
                              <HashShortView hash={address} />
                          </a>
                      </p>
                        <CopyButton text={address} type="link">
                            <CopyIcon
                                style={{ verticalAlign: "inherit" }}
                                className={classNames(
                                    "h-4 ml-1 w-auto inline",
                                    "stroke-orange stroke-2"
                                )}
                                onClick={() => copy()}
                              />
                        </CopyButton>
                    </span>
                </div>
                <Divider />
                <FormSubmitButton
                    className="w-full justify-center border-none"
                    style={{
                        padding: "10px 2rem",
                        background: "#4299e1",
                        marginTop: "24px",
                    }}
                    onClick={() => navigate(`/send/${address}`)}
                >
                    <T id={"send"} />
                </FormSubmitButton>
            </div>
        </PageLayout>
    )
}

export default CollectiblePage
