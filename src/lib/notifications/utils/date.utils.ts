const defaultFormatDateOptions: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
};

export const formatDateOutput = (
  date: number | string,
  locale = 'en-GB',
  formatDateOptions = defaultFormatDateOptions
) => new Date(date).toLocaleString(locale, formatDateOptions);
