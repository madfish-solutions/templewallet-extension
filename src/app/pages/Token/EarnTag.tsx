import { memo, useMemo } from 'react';

import { FireAnimatedEmoji } from 'app/atoms/fire-animated-emoji';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHEREUM_APR, TEZOS_APY } from 'lib/constants';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { Link } from 'lib/woozie';
import { TempleChainKind } from 'temple/types';

interface Props {
  chainKind: TempleChainKind;
  chainId: string | number;
  assetSlug: string;
}

export const EarnTag = memo<Props>(({ chainKind, chainId, assetSlug }) => {
  const data = useMemo(() => {
    if (chainKind === TempleChainKind.Tezos && assetSlug === TEZ_TOKEN_SLUG) {
      return {
        label: `${TEZOS_APY}% APY`,
        to: `/earn-tez/${chainId}`
      };
    }

    if (chainKind === TempleChainKind.EVM && assetSlug === EVM_TOKEN_SLUG && chainId === ETHEREUM_MAINNET_CHAIN_ID) {
      return {
        label: `${ETHEREUM_APR}% APR`,
        to: '/earn-eth'
      };
    }

    return null;
  }, [assetSlug, chainId, chainKind]);

  if (!data) return null;

  return (
    <Link
      to={data.to}
      className="flex justify-center items-center gap-x-1 p-2 rounded-6 bg-white border-0.5 border-lines"
    >
      <FireAnimatedEmoji />
      <span className="text-font-small-bold">{data.label}</span>
    </Link>
  );
});
