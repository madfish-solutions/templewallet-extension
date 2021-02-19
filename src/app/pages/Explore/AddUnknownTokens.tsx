import * as React from "react";
import { BcdAccountToken, getAccount } from "lib/better-call-dev";
import {
  useAccount,
  useChainId,
  isKnownChainId,
  useAllAssetsRef,
  useTokens,
  assertTokenType,
  loadContract,
  useTezos,
} from "lib/thanos/front";
import { ThanosAssetType, ThanosToken } from "lib/thanos/types";
import { BCD_NETWORKS_NAMES } from "app/defaults";

const AddUnknownTokens: React.FC = () => {
  const { addToken, hiddenTokens } = useTokens();
  const assetsRef = useAllAssetsRef();
  const { publicKeyHash: accountPkh } = useAccount();
  const tezos = useTezos();
  const chainId = useChainId();
  const networkId = React.useMemo(
    () =>
      (isKnownChainId(chainId!)
        ? BCD_NETWORKS_NAMES.get(chainId)
        : undefined) ?? null,
    [chainId]
  );

  React.useEffect(() => {
    if (!networkId) {
      return;
    }

    const syncTokens = async () => {
      try {
        const account = await getAccount({
          network: networkId,
          address: accountPkh,
        });

        for (const token of account.tokens) {
          if (
            assetsRef.current.every(
              (knownAsset) =>
                knownAsset.type === ThanosAssetType.TEZ ||
                !tokensAreSame(knownAsset, token)
            ) &&
            !hiddenTokens.some((hiddenToken) =>
              tokensAreSame(hiddenToken, token)
            ) &&
            token.name &&
            token.symbol
          ) {
            let isFA12Token = false;
            try {
              await assertTokenType(
                ThanosAssetType.FA1_2,
                await loadContract(tezos, token.contract, false),
                tezos
              );
              isFA12Token = true;
            } catch {}
            const baseTokenProps = {
              address: token.contract,
              decimals: token.decimals || 0,
              fungible: true,
              symbol: token.symbol,
              name: token.name,
            };
            if (isFA12Token) {
              addToken({
                ...baseTokenProps,
                type: ThanosAssetType.FA1_2,
              });
            } else {
              addToken({
                ...baseTokenProps,
                id: token.token_id,
                type: ThanosAssetType.FA2,
              });
            }
          }
        }
      } catch {}
    };

    const timeout = setTimeout(syncTokens);
    return () => clearTimeout(timeout);
  }, [accountPkh, networkId, addToken, assetsRef, hiddenTokens, tezos]);

  return null;
};

export default AddUnknownTokens;

function tokensAreSame(token1: ThanosToken, token2: BcdAccountToken) {
  return (
    token1.address === token2.contract &&
    (token1.type !== ThanosAssetType.FA2 || token1.id === token2.token_id)
  );
}
