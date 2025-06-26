import React, { memo, useCallback } from 'react';

import { GoogleAuth as GenericGoogleAuth } from 'app/templates/google-auth';
import { FileDoesNotExistError } from 'lib/apis/google';
import { EncryptedBackupObject, readGoogleDriveBackup } from 'lib/temple/backup';

interface GoogleAuthProps {
  onBackupContent: SyncFn<EncryptedBackupObject>;
  onMissingBackup: EmptyFn;
}

export const GoogleAuth = memo<GoogleAuthProps>(({ onBackupContent, onMissingBackup }) => {
  const handleAuth = useCallback(
    async (googleAuthToken: string) => {
      try {
        onBackupContent(await readGoogleDriveBackup(googleAuthToken));
      } catch (e) {
        if (e instanceof FileDoesNotExistError) {
          onMissingBackup();
        } else {
          throw e;
        }
      }
    },
    [onBackupContent, onMissingBackup]
  );

  return <GenericGoogleAuth next={handleAuth} />;
});
