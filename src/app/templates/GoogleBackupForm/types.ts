import { EncryptedBackupObject } from 'lib/temple/backup';

export type AuthState = 'error' | 'success' | 'active';

export interface GoogleBackup {
  email: string;
  content?: EncryptedBackupObject;
}
