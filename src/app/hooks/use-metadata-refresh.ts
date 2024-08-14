import { useMemo } from 'react';

import { dispatch } from 'app/store';
import { refreshTokensMetadataAction } from 'app/store/tezos/tokens-metadata/actions';
import { useAllTokensMetadataSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { fetchTokensMetadata } from 'lib/apis/temple';
import { ALL_PREDEFINED_METADATAS_RECORD } from 'lib/assets/known-tokens';
import { reduceToMetadataRecord } from 'lib/metadata/fetch';
import { TempleTezosChainId } from 'lib/temple/types';
import { useDidMount, useMemoWithCompare } from 'lib/ui/hooks';
import { useLocalStorage } from 'lib/ui/local-storage';
import { useEnabledTezosChains } from 'temple/front';

const STORAGE_KEY = 'METADATA_REFRESH';

type RefreshRecords = StringRecord<number>;

const REFRESH_VERSION = 1;

export const useMetadataRefresh = () => {
  const tezosChains = useEnabledTezosChains();

  const tezosChainsIDs = useMemoWithCompare(() => tezosChains.map(chain => chain.chainId), [tezosChains]);

  const [records, setRecords] = useLocalStorage<RefreshRecords>(STORAGE_KEY, {});

  const tokensMetadata = useAllTokensMetadataSelector();
  const slugsOnAppLoad = useMemo(
    () => Object.keys(tokensMetadata).filter(slug => !ALL_PREDEFINED_METADATAS_RECORD[slug]),
    []
  );

  useDidMount(() => {
    for (const chainId of tezosChainsIDs) {
      const lastVersion = records[chainId];
      const setLastVersionPerChainId = () => setRecords(r => ({ ...r, [chainId]: REFRESH_VERSION }));

      const needToSetVersion = !lastVersion || lastVersion < REFRESH_VERSION;

      if (!slugsOnAppLoad.length) {
        if (needToSetVersion) setLastVersionPerChainId();

        continue;
      }

      // Organized refresh only for Mainnet so far. Since fetching by mostly mainnet slugs
      // for other chains might be a waste of request. Need to have slugs by chain record.
      if (!needToSetVersion || chainId !== TempleTezosChainId.Mainnet) continue;

      fetchTokensMetadata(chainId, slugsOnAppLoad).then(
        data => {
          const newRecords = reduceToMetadataRecord(slugsOnAppLoad, data);
          dispatch(refreshTokensMetadataAction(newRecords));
          setLastVersionPerChainId();
        },
        error => console.error(error)
      );
    }
  });
};
