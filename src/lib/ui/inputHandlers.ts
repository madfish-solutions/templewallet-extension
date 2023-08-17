import type {
  SyntheticEvent,
  ChangeEvent,
  ChangeEventHandler,
  EventHandler,
  FocusEvent,
  FocusEventHandler
} from 'react';

export const inputChangeHandler = (
  evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined,
  setValue: (value: string) => void
) => baseHandler(evt, onChange, () => setValue(evt.target.value));

export const checkedHandler = (
  evt: ChangeEvent<HTMLInputElement>,
  onChange: ChangeEventHandler<HTMLInputElement> | undefined,
  setValue: (value: boolean) => void
) => baseHandler(evt, onChange, () => setValue(evt.target.checked));

export const focusHandler = (
  evt: FocusEvent,
  onFocus: FocusEventHandler | undefined,
  setFocus: (value: boolean) => void
) => baseHandler(evt, onFocus, () => setFocus(true));

export const blurHandler = (
  evt: FocusEvent,
  onBlur: FocusEventHandler | undefined,
  setFocus: (value: boolean) => void
) => baseHandler(evt, onBlur, () => setFocus(false));

const baseHandler = <E extends SyntheticEvent>(
  evt: E,
  onEvent: EventHandler<E> | undefined,
  setValue: () => void
): void => {
  if (onEvent) {
    onEvent(evt);

    if (evt.defaultPrevented) return;
  }

  setValue();
};
