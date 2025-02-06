import { TezosActivity } from 'lib/activity';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useTezosGenericAssetsMetadataCheck } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

interface Config {
  activities: TezosActivity[];
  accountPkh?: string;
  mainAsset?: {
    chainId: string;
    slug: string;
  };
}

export const useTezosAssetsFromActivitiesCheck = ({ activities, accountPkh, mainAsset }: Config) => {
  const assetsSlugsToCheck = useMemoWithCompare(() => {
    const slugs = new Set<string>();

    activities.forEach(({ operationsCount, operations, chainId }) => {
      const toThisChainAssetSlug = (assetSlug: string) => toChainAssetSlug(TempleChainKind.Tezos, chainId, assetSlug);
      if (operationsCount === 1) {
        const operation = operations.at(0);
        const assetSlug = operation?.assetSlug;
        if (assetSlug) {
          slugs.add(toThisChainAssetSlug(assetSlug));
        }
      } else {
        operations.forEach(op => void (op.assetSlug && slugs.add(toThisChainAssetSlug(op.assetSlug))));
      }
    });

    if (mainAsset) {
      const { chainId, slug: assetSlug } = mainAsset;
      slugs.add(toChainAssetSlug(TempleChainKind.Tezos, chainId, assetSlug));
    }

    return Array.from(slugs);
  }, [activities, mainAsset]);
  useTezosGenericAssetsMetadataCheck(assetsSlugsToCheck, accountPkh);
};
