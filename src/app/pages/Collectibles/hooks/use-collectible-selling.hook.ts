import { useCallback, useState } from 'react';

import type { WalletOperation } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { useFormAnalytics } from 'lib/analytics';
import { getObjktMarketplaceContract } from 'lib/apis/objkt';
import type { ObjktOffer } from 'lib/apis/objkt/types';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { useAccount, useTezos } from 'lib/temple/front';
import { getTransferPermissions } from 'lib/utils/get-transfer-permissions';
import { parseTransferParamsToParamsWithKind } from 'lib/utils/parse-transfer-params';

const DEFAULT_OBJKT_STORAGE_LIMIT = 350;

export const useCollectibleSelling = (assetSlug: string, offer?: ObjktOffer) => {
  const tezos = useTezos();
  const { publicKeyHash } = useAccount();
  const [isSelling, setIsSelling] = useState(false);
  const [operation, setOperation] = useState<WalletOperation | nullish>();
  const [operationError, setOperationError] = useState<unknown>();
  const formAnalytics = useFormAnalytics('Collectible Page/Sell By Best Offer Form');

  const initiateSelling = useCallback(async () => {
    if (!offer || isSelling) return;
    setIsSelling(true);
    setOperation(null);
    setOperationError(null);

    formAnalytics.trackSubmit({ assetSlug });

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
      .then(
        operation => {
          setOperation(operation);

          formAnalytics.trackSubmitSuccess({ assetSlug });
        },
        error => {
          setOperation(null);

          if (error.message === 'Declined') return;
          console.error(error);

          setOperationError(error);

          formAnalytics.trackSubmitFail({ assetSlug });
        }
      )
      .finally(() => void setIsSelling(false));
  }, [tezos, isSelling, offer, assetSlug, publicKeyHash, setOperation, setOperationError, formAnalytics]);

  return { isSelling, initiateSelling, operation, operationError };
};
