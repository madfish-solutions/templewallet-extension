import { TID } from 'lib/i18n';

export interface UrlEntityBase {
  id: string;
  name: string;
  nameI18nKey?: TID;
  default?: boolean;
}
