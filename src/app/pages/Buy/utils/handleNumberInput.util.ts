import React from 'react';

const numbersAndDotRegExp = /^\d*\.?\d*$/;

export const handleNumberInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
  const inputValue = (event.target as unknown as HTMLInputElement).value;
  if (inputValue.indexOf('0') !== -1 && inputValue.length === 1 && event.key === '0') {
    event.preventDefault();
  }
  if (inputValue.indexOf('.') !== -1 && event.key === '.') {
    event.preventDefault();
  }
  if (!numbersAndDotRegExp.test(event.key)) {
    event.preventDefault();
  }
};
