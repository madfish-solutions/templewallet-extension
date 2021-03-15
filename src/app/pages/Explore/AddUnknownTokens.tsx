import * as React from "react";
import BigNumber from "bignumber.js";
import { BcdAccountToken, getAccount } from "lib/better-call-dev";
import { sanitizeImgUri } from "lib/image-uri";
import {
  useAccount,
  useChainId,
  isKnownChainId,
  useTokens,
  assertTokenType,
  loadContract,
  useTezos,
  fetchTokenMetadata,
} from "lib/temple/front";
import { TempleAssetType, TempleToken } from "lib/temple/types";
import { BCD_NETWORKS_NAMES } from "app/defaults";

const AddUnknownTokens: React.FC = () => {
  const { addToken, allTokens } = useTokens();
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

  const syncTokens = React.useCallback(async () => {
    if (!networkId) {
      return;
    }

    try {
      const account = await getAccount({
        network: networkId,
        address: accountPkh,
      });

      for (const token of account.tokens) {
        if (allTokens.every((t) => !tokensAreSame(t, token))) {
          try {
            const meta = await fetchTokenMetadata(
              tezos,
              token.contract,
              token.token_id
            );

            let isFA12Token = false;
            try {
              await assertTokenType(
                TempleAssetType.FA1_2,
                await loadContract(tezos, token.contract, false),
                tezos
              );
              isFA12Token = true;
            } catch {}

            const positiveBalance = new BigNumber(token.balance).isPositive();
            const baseTokenProps = {
              address: token.contract,
              decimals: meta.decimals,
              fungible: true,
              symbol: meta.symbol,
              name: meta.name,
              iconUrl: meta.iconUrl ? sanitizeImgUri(meta.iconUrl) : undefined,
              status: positiveBalance
                ? ("displayed" as const)
                : ("hidden" as const),
            };

            if (isFA12Token) {
              await addToken({
                ...baseTokenProps,
                type: TempleAssetType.FA1_2,
              });
            } else {
              await addToken({
                ...baseTokenProps,
                id: token.token_id,
                type: TempleAssetType.FA2,
              });
            }
          } catch {}
        }
      }
    } catch {}
  }, [accountPkh, networkId, addToken, allTokens, tezos]);

  const syncTokensRef = React.useRef(syncTokens);
  React.useEffect(() => {
    syncTokensRef.current = syncTokens;
  }, [syncTokens]);

  React.useEffect(() => {
    if (!networkId) {
      return;
    }

    const timeout = setTimeout(syncTokensRef.current);
    return () => clearTimeout(timeout);
  }, [networkId, accountPkh]);

  return null;
};

export default AddUnknownTokens;

function tokensAreSame(token1: TempleToken, token2: BcdAccountToken) {
  return (
    token1.address === token2.contract &&
    (token1.type !== TempleAssetType.FA2 || token1.id === token2.token_id)
  );
}
