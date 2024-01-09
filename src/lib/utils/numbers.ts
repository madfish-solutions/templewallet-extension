export const isPositiveNumber = (value?: number): value is number => value != null && value > 0;

const THOUSAND = 1000;
const MILLION = 1000 * 1000;
const BILLION = 1000 * 1000 * 1000;

export const kFormatter = (num: number): string => {
  if (isNaN(num)) {
    return '';
  }

  const sign = Math.sign(num);

  const formattedValue = Math.abs(num);

  if (formattedValue >= BILLION) {
    return (sign * Math.round(formattedValue / BILLION)).toLocaleString() + 'B';
  }

  if (formattedValue >= MILLION) {
    return (sign * Math.round(formattedValue / MILLION)).toLocaleString() + 'M';
  }

  if (formattedValue >= THOUSAND) {
    return (sign * Math.round(formattedValue / THOUSAND)).toLocaleString() + 'K';
  }

  return (sign * formattedValue).toLocaleString();
};
