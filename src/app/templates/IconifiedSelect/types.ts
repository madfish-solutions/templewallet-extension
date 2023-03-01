import { ComponentType, ReactNode } from 'react';

export type IconifiedSelectOptionRenderProps<T> = {
  option: T;
  index?: number;
};

type IconifiedSelectRenderComponent<T> = ComponentType<IconifiedSelectOptionRenderProps<T>>;

export type IconifiedSelectProps<T> = {
  OptionSelectedIcon: IconifiedSelectRenderComponent<T>;
  OptionSelectedContent: IconifiedSelectRenderComponent<T>;
  Icon: IconifiedSelectRenderComponent<T>;
  OptionInMenuContent: IconifiedSelectRenderComponent<T>;
  getKey: (option: T) => string | number | undefined;
  isDisabled?: (option: T) => boolean;
  options: T[];
  value: T;
  onChange?: (a: T) => void;
  className?: string;
  title: ReactNode;
  padded?: boolean;
  fieldStyle?: React.CSSProperties;
  search?: {
    placeholder?: string;
    filterItems(searchString: string): T[];
  };
};
