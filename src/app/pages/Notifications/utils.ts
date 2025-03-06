import { formatDate } from 'lib/i18n';

export const formatGeneralDate = (date: string) => formatDate(date, 'dd/MM/yyyy');

export const formatWeekdayHourDate = (date: string) => formatDate(date, 'EEEE HH:mm');
