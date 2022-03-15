export const focusHandler = (
  evt: any,
  onFocus: React.FocusEventHandler<HTMLInputElement>,
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

export const checkedHandler = (
  evt: any,
  onChange: React.ChangeEventHandler<HTMLInputElement>,
  setValue: (value: any) => void
): void => {
  if (onChange) {
    onChange(evt);
    if (evt.defaultPrevented) {
      return;
    }
  }

  setValue(evt.target.checked);
};

export const blurHandler = (
  evt: any,
  onBlur: React.FocusEventHandler<HTMLInputElement>,
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
