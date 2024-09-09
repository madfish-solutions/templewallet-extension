export type { TID } from './types';

export { getMessage, getCurrentLocale, getDateFnsLocale, getNumberSymbols, formatDate } from './core';

export { updateLocale, onInited } from './loading';

export { toLocalFixed, toLocalFormat, toShortened, getPluralKey } from './numbers';

export type { TProps, ReactSubstitutions } from './react';
export { t, T } from './react';
