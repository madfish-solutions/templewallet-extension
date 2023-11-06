import { useAllTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { migrateFromIndexedDB } from 'lib/assets/migrations';
import { migrate } from 'lib/local-storage/migrator';
import { useDidMount } from 'lib/ui/hooks';

export const useAssetsMigrations = () => {
  const allMetadatas = useAllTokensMetadataSelector();

  useDidMount(
    () =>
      void migrate([
        {
          name: 'assets-migrations@1.18.2',
          up: () => migrateFromIndexedDB(allMetadatas)
        }
      ])
  );
};
