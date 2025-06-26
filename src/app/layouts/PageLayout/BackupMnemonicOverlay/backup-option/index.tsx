import React, { memo, useCallback } from 'react';

import { Button } from 'app/atoms';
import { T, TID } from 'lib/i18n';

import { ReactComponent as GoogleDriveBackup } from './google-drive-backup.svg';
import ManualBackupSrc from './manual-backup.png';
import OverwriteBackupSrc from './overwrite-backup.png';
import SwitchAccountSrc from './switch-account.png';

export enum IllustrationName {
  GoogleDriveBackup = 'GoogleDriveBackup',
  ManualBackup = 'ManualBackup',
  OverwriteBackup = 'OverwriteBackup',
  SwitchAccount = 'SwitchAccount'
}

const assets = {
  [IllustrationName.GoogleDriveBackup]: GoogleDriveBackup,
  [IllustrationName.ManualBackup]: ManualBackupSrc,
  [IllustrationName.OverwriteBackup]: OverwriteBackupSrc,
  [IllustrationName.SwitchAccount]: SwitchAccountSrc
};

interface BackupOptionProps<T extends string> {
  type: T;
  titleI18nKey: TID;
  descriptionI18nKey: TID;
  testID: string;
  illustrationName: IllustrationName;
  onClick: SyncFn<T>;
}

const BackupOptionHOC = <T extends string>() =>
  memo<BackupOptionProps<T>>(({ type, titleI18nKey, descriptionI18nKey, testID, illustrationName, onClick }) => {
    const Asset = assets[illustrationName];
    const handleClick = useCallback(() => onClick(type), [onClick, type]);

    return (
      <Button
        className="flex items-center gap-2 p-4 rounded-lg hover:bg-grey-4 border-0.5 border-lines"
        testID={testID}
        onClick={handleClick}
      >
        {typeof Asset === 'string' ? (
          <img src={Asset} alt="" className="w-14 h-auto" />
        ) : (
          <Asset className="w-14 h-auto" />
        )}
        <div className="flex-1 flex flex-col gap-1 text-left">
          <p className="text-font-medium-bold text-black">
            <T id={titleI18nKey} />
          </p>
          <p className="text-font-description text-grey-1">
            <T id={descriptionI18nKey} />
          </p>
        </div>
      </Button>
    );
  });

export type BackupOptionType = 'google-drive' | 'manual';
export type BackupOptionByTypeProps = BackupOptionProps<BackupOptionType>;
export const BackupOptionByType = BackupOptionHOC<BackupOptionType>();

type GoogleDriveBackupOptionType = 'switch-account' | 'manual' | 'overwrite';
export type GoogleDriveBackupOptionProps = BackupOptionProps<GoogleDriveBackupOptionType>;
export const GoogleDriveBackupOption = BackupOptionHOC<GoogleDriveBackupOptionType>();
