import { FC, useCallback, useEffect, useMemo, useRef } from "react";

import BigNumber from "bignumber.js";

import { BCD_NETWORKS_NAMES } from "app/defaults";
import {
  BcdAccountTokenBalance,
  getAccountTokenBalances,
} from "lib/better-call-dev";
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

const AddUnknownTokens: FC = () => {
  const { allTokens, addToken } = useTokens();
  const { publicKeyHash: accountPkh } = useAccount();
  const tezos = useTezos();
  const chainId = useChainId();
  const networkId = useMemo(
    () =>
      (isKnownChainId(chainId!)
        ? BCD_NETWORKS_NAMES.get(chainId)
        : undefined) ?? null,
    [chainId]
  );

  const syncTokens = useCallback(async () => {
    if (!networkId) {
      return;
    }

    const size = 10;
    let offset = 0;

    while (true) {
      try {
        const { balances, total } = await getAccountTokenBalances({
          network: networkId,
          address: accountPkh,
          size,
          offset,
        });

        for (const token of balances) {
          try {
            if (allTokens.every((t) => !tokensAreSame(t, token))) {
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

              const positiveBalance = new BigNumber(
                token.balance
              ).isGreaterThan(0);
              const baseTokenProps = {
                address: token.contract,
                decimals: meta.decimals,
                fungible: true,
                symbol: meta.symbol,
                name: meta.name,
                iconUrl: meta.iconUrl
                  ? sanitizeImgUri(meta.iconUrl)
                  : undefined,
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
            }
          } catch {}
        }

        offset += size;
        if (offset >= total) {
          break;
        }
      } catch {
        break;
      }
    }
  }, [accountPkh, networkId, addToken, allTokens, tezos]);

  const syncTokensRef = useRef(syncTokens);
  useEffect(() => {
    syncTokensRef.current = syncTokens;
  }, [syncTokens]);

  useEffect(() => {
    if (!networkId) {
      return;
    }

    const timeout = setTimeout(syncTokensRef.current, 1_000);
    return () => clearTimeout(timeout);
  }, [networkId, accountPkh]);

  return null;
};

export default AddUnknownTokens;

function tokensAreSame(
  localToken: TempleToken,
  bcdToken: BcdAccountTokenBalance
) {
  return (
    localToken.address === bcdToken.contract &&
    (localToken.type !== TempleAssetType.FA2 ||
      localToken.id === bcdToken.token_id)
  );
}
