import { useEffect, useMemo } from 'react';

import { useDispatch } from 'react-redux';

import { refreshTokensMetadataAction } from 'app/store/tokens-metadata/actions';
import { useAllTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { fetchTokensMetadata } from 'lib/apis/temple';
import { ALL_PREDEFINED_METADATAS_RECORD } from 'lib/assets/known-tokens';
import { reduceToMetadataRecord } from 'lib/metadata/fetch';
import { useChainId } from 'lib/temple/front';
import { TempleChainId } from 'lib/temple/types';
import { useLocalStorage } from 'lib/ui/local-storage';

const STORAGE_KEY = 'METADATA_REFRESH';

type RefreshRecords = Record<string, number>;

const REFRESH_VERSION = 1;

export const useMetadataRefresh = () => {
  const chainId = useChainId()!;
  const dispatch = useDispatch();

  const [records, setRecords] = useLocalStorage<RefreshRecords>(STORAGE_KEY, {});

  const tokensMetadata = useAllTokensMetadataSelector();
  const slugsOnAppLoad = useMemo(
    () => Object.keys(tokensMetadata).filter(slug => !ALL_PREDEFINED_METADATAS_RECORD[slug]),
    []
  );

  useEffect(() => {
    const lastVersion = records[chainId];
    const setLastVersion = () => setRecords(r => ({ ...r, [chainId]: REFRESH_VERSION }));

    const needToSetVersion = !lastVersion || lastVersion < REFRESH_VERSION;

    if (!slugsOnAppLoad.length) {
      if (needToSetVersion) setLastVersion();

      return;
    }

    if (!needToSetVersion || chainId !== TempleChainId.Mainnet) return;

    fetchTokensMetadata(chainId, slugsOnAppLoad).then(
      data => {
        const record = reduceToMetadataRecord(slugsOnAppLoad, data);
        dispatch(refreshTokensMetadataAction(record));
        setLastVersion();
      },
      error => console.error(error)
    );
  }, [chainId]);
};
