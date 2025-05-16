import React, { memo, useCallback, useState } from 'react';

import { FileDoesNotExistError, readGoogleDriveFile } from 'lib/apis/google';
import { EncryptedBackupObject, backupFileName } from 'lib/temple/backup';

import { GoogleAuth } from '../google-auth';

import { DecryptBackup } from './decrypt-backup';

interface GoogleBackupFormProps {
  next: (seed?: string, password?: string) => void;
}

export const GoogleBackupForm = memo<GoogleBackupFormProps>(({ next }) => {
  const [backupContent, setBackupContent] = useState<EncryptedBackupObject>();

  const handleAuth = useCallback(
    async (googleAuthToken: string) => {
      try {
        setBackupContent(await readGoogleDriveFile<EncryptedBackupObject>(backupFileName, googleAuthToken));
      } catch (e) {
        if (e instanceof FileDoesNotExistError) {
          next();
        } else {
          throw e;
        }
      }
    },
    [next]
  );

  return backupContent ? <DecryptBackup next={next} backupContent={backupContent} /> : <GoogleAuth next={handleAuth} />;
});
