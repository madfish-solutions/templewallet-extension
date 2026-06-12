import { toTezEnabledCollectiblesChainSlugs, useTezosAccountCollectibles } from 'lib/assets/hooks/collectibles';
import { useTezosCollectiblesMetadataPresenceCheck } from 'lib/metadata';

export const useEnsureTezosCollectibles = (accountPkh: string) => {
  const tezosCollectibles = useTezosAccountCollectibles(accountPkh);
  const tezEnabledCollectiblesChainsSlugs = toTezEnabledCollectiblesChainSlugs(tezosCollectibles);
  useTezosCollectiblesMetadataPresenceCheck(tezEnabledCollectiblesChainsSlugs);
};
