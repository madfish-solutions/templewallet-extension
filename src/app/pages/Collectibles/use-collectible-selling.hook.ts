import { useCallback, useState } from 'react';

import BigNumber from 'bignumber.js';

import type { CollectibleDetails } from 'app/store/collectibles/state';
import { getObjktMarketplaceContract } from 'lib/apis/objkt';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { useAccount, useTezos } from 'lib/temple/front';
import { getTransferPermissions } from 'lib/utils/get-transfer-permissions';
import { parseTransferParamsToParamsWithKind } from 'lib/utils/parse-transfer-params';

const DEFAULT_OBJKT_STORAGE_LIMIT = 350;

export const useCollectibleSelling = (assetSlug: string, offer?: CollectibleDetails['offers'][number]) => {
  const tezos = useTezos();
  const { publicKeyHash } = useAccount();
  const [isSelling, setIsSelling] = useState(false);

  const initiateSelling = useCallback(async () => {
    if (!offer || isSelling) return;
    setIsSelling(true);

    const { contract: tokenAddress, id } = fromFa2TokenSlug(assetSlug);
    const tokenId = Number(id.toString());

    const contract = await getObjktMarketplaceContract(tezos, offer.marketplace_contract);

    const transferParams =
      'fulfill_offer' in contract.methods
        ? contract.methods.fulfill_offer(offer.bigmap_key, tokenId).toTransferParams()
        : contract.methods.offer_accept(offer.bigmap_key).toTransferParams();

    const tokenToSpend = {
      standard: 'fa2' as const,
      contract: tokenAddress,
      tokenId
    };

    const { approve, revoke } = await getTransferPermissions(
      tezos,
      offer.marketplace_contract,
      publicKeyHash,
      tokenToSpend,
      new BigNumber('0')
    );

    const operationParams = approve
      .concat(transferParams)
      .concat(revoke)
      .map(params => parseTransferParamsToParamsWithKind({ ...params, storageLimit: DEFAULT_OBJKT_STORAGE_LIMIT }));

    await tezos.wallet
      .batch(operationParams)
      .send()
      .catch(error => {
        console.error('Operation send error:', error);
      });

    setIsSelling(false);
  }, [tezos, isSelling, offer, assetSlug, publicKeyHash]);

  return { isSelling, initiateSelling };
};
