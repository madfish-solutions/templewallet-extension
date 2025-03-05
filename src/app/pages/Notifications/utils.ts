export const formatGeneralDate = (date: number | string) =>
  new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });

export const formatWeekdayHourDate = (date: number | string) =>
  new Date(date).toLocaleString('en-GB', {
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric'
  });
