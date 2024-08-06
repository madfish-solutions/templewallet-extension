import { capitalize } from 'lodash';

import { getPluralKey, t } from 'lib/i18n';

export const getOptionLabel = (option: string) => capitalize(t(getPluralKey('words', Number(option)), option));
