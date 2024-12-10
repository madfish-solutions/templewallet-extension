import { capitalize } from 'lodash';

import { formatDate, toLocalFormat } from 'lib/i18n';

export const formatRpAmount = (amount: number) => toLocalFormat(amount, {});

export const getMonthName = (date: Date) => capitalize(formatDate(date, 'LLLL'));
