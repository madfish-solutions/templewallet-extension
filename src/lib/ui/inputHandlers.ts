import React from 'react';

export const inputChangeHandler = (
  evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined,
  setValue: (value: string) => void
): void => {
  if (onChange) {
    onChange(evt);
    if (evt.defaultPrevented) {
      return;
    }
  }

  setValue(evt.target.value);
};

export const checkedHandler = (
  evt: React.ChangeEvent<HTMLInputElement>,
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined,
  setValue: (value: boolean) => void
): void => {
  if (onChange) {
    onChange(evt);
    if (evt.defaultPrevented) {
      return;
    }
  }

  setValue(evt.target.checked);
};

export const focusHandler = (
  evt: React.FocusEvent,
  onFocus: React.FocusEventHandler | undefined,
  setFocus: (value: boolean) => void
): void => {
  if (onFocus) {
    onFocus(evt);
    if (evt.defaultPrevented) {
      return;
    }
  }

  setFocus(true);
};

export const blurHandler = (
  evt: React.FocusEvent,
  onBlur: React.FocusEventHandler | undefined,
  setFocus: (value: boolean) => void
): void => {
  if (onBlur) {
    onBlur(evt);
    if (evt.defaultPrevented) {
      return;
    }
  }

  setFocus(false);
};
