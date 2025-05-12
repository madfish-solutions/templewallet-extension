import React, { memo, useCallback, useState } from 'react';

import { DecryptBackup } from './decrypt-backup';
import { GoogleAuth } from './google-auth';
import { GoogleBackup } from './types';

interface GoogleBackupFormProps {
  next: (seed?: string, password?: string) => void;
}

export const GoogleBackupForm = memo<GoogleBackupFormProps>(({ next }) => {
  const [backupContent, setBackupContent] = useState<GoogleBackup['content']>();

  const handleBackup = useCallback(
    (backup: GoogleBackup) => {
      if (backup.content) {
        setBackupContent(backup.content);
      } else {
        next();
      }
    },
    [next]
  );

  return backupContent ? (
    <DecryptBackup next={next} backupContent={backupContent} />
  ) : (
    <GoogleAuth next={handleBackup} />
  );
});
