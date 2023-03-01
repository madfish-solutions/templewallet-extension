import React, {
  ComponentType,
  forwardRef,
  HTMLAttributes,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useMemo,
  useState
} from 'react';

import { Modifier } from '@popperjs/core';
import classNames from 'clsx';
import { useDebounce } from 'use-debounce';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { useFocusOnElement } from 'lib/ui/hooks';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';

export type IconifiedSelectOptionRenderProps<T> = {
  option: T;
  index?: number;
};

type IconifiedSelectRenderComponent<T> = ComponentType<IconifiedSelectOptionRenderProps<T>>;

type IconifiedSelectProps<T> = {
  Icon: IconifiedSelectRenderComponent<T>;
  OptionSelectedIcon: IconifiedSelectRenderComponent<T>;
  OptionInMenuContent: IconifiedSelectRenderComponent<T>;
  OptionSelectedContent: IconifiedSelectRenderComponent<T>;
  getKey: (option: T) => string | number | undefined;
  isDisabled?: (option: T) => boolean;
  options: T[];
  value: T;
  onChange?: (a: T) => void;
  className?: string;
  title: ReactNode;
  padded?: boolean;
  search?: {
    placeholder?: string;
    filterItems(searchString: string): T[];
  };
};

const IconifiedSelectWithSearch = <T extends unknown>({
  Icon,
  OptionInMenuContent,
  OptionSelectedIcon,
  OptionSelectedContent,
  getKey,
  isDisabled,
  options,
  value,
  onChange,
  className,
  title,
  padded,
  search
}: IconifiedSelectProps<T>) => {
  const [searchString, setSearchString] = useState<string>();

  const [searchStringDebounced] = useDebounce(searchString, 300);

  const searchedOptions = useMemo(() => {
    if (!search || !searchStringDebounced) return options;

    return search.filterItems(searchStringDebounced);
  }, [searchStringDebounced, options]);

  return (
    <div className={className}>
      {title}

      {options.length > 1 ? (
        <Popper
          placement="bottom"
          strategy="fixed"
          modifiers={[sameWidth]}
          popup={({ opened, setOpened, toggleOpened }) => (
            <IconifiedSelectMenu
              isDisabled={isDisabled}
              opened={opened}
              setOpened={setOpened}
              toggleOpened={toggleOpened}
              onChange={onChange}
              Icon={Icon}
              OptionInMenuContent={OptionInMenuContent}
              getKey={getKey}
              options={searchedOptions}
              value={value}
              padded={padded}
              withSearch={!!search}
            />
          )}
        >
          {({ ref, opened, toggleOpened }) => (
            <SelectField
              ref={ref as unknown as React.RefObject<HTMLDivElement>}
              Content={OptionSelectedContent}
              Icon={OptionSelectedIcon}
              opened={opened}
              value={value}
              dropdown
              onClick={toggleOpened}
              search={
                search
                  ? {
                      value: searchString,
                      placeholder: search?.placeholder,
                      onChange: setSearchString
                    }
                  : undefined
              }
            />
          )}
        </Popper>
      ) : (
        <FieldContainer active={false}>
          <FieldInnerComponent Icon={OptionSelectedIcon} Content={OptionSelectedContent} value={value} />
        </FieldContainer>
      )}
    </div>
  );
};

export default IconifiedSelectWithSearch;

type IconifiedSelectMenuProps<T> = PopperRenderProps &
  Omit<IconifiedSelectProps<T>, 'className' | 'title' | 'OptionSelectedContent' | 'OptionSelectedIcon'> & {
    withSearch: boolean;
  };

const IconifiedSelectMenu = <T extends unknown>(props: IconifiedSelectMenuProps<T>) => {
  const {
    opened,
    options,
    value,
    padded,
    withSearch,
    isDisabled,
    setOpened,
    onChange,
    getKey,
    Icon,
    OptionInMenuContent
  } = props;
  const handleOptionClick = useCallback(
    (newValue: T) => {
      if (getKey(newValue) !== getKey(value)) {
        onChange?.(newValue);
      }
      setOpened(false);
    },
    [onChange, setOpened, value, getKey]
  );

  return (
    <DropdownWrapper
      opened={opened}
      className={classNames('origin-top overflow-x-hidden overflow-y-auto', padded && 'p-2')}
      style={{
        maxHeight: '15.125rem',
        backgroundColor: 'white',
        borderColor: '#e2e8f0'
      }}
    >
      {options.map(option => (
        <IconifiedSelectOption
          disabled={isDisabled?.(option)}
          key={getKey(option)}
          value={option}
          selected={getKey(option) === getKey(value)}
          onClick={handleOptionClick}
          Icon={Icon}
          OptionInMenuContent={OptionInMenuContent}
          padded={padded}
          withSearch={withSearch}
        />
      ))}
    </DropdownWrapper>
  );
};

type IconifiedSelectOptionProps<T> = Pick<IconifiedSelectProps<T>, 'Icon' | 'OptionInMenuContent' | 'value'> & {
  disabled?: boolean;
  value: T;
  selected: boolean;
  padded?: boolean;
  withSearch: boolean;
  onClick?: IconifiedSelectProps<T>['onChange'];
};

const IconifiedSelectOption = <T extends unknown>(props: IconifiedSelectOptionProps<T>) => {
  const { disabled, value, selected, padded, withSearch, onClick, Icon, OptionInMenuContent } = props;

  const handleClick = useCallback(() => {
    onClick?.(value);
  }, [onClick, value]);

  return (
    <button
      type="button"
      className={classNames(
        'flex items-center w-full py-3 px-4 text-left rounded transition easy-in-out duration-200',
        padded && 'mb-1',
        selected ? 'bg-gray-200' : !disabled && 'hover:bg-gray-100',
        disabled && 'opacity-25',
        disabled ? 'cursor-default' : 'cursor-pointer'
      )}
      disabled={disabled}
      // style={{
      //   padding: '0.375rem 1.5rem 0.375rem 0.5rem'
      // }}
      autoFocus={!withSearch && selected}
      onClick={disabled ? undefined : handleClick}
    >
      <Icon option={value} />

      <OptionInMenuContent option={value} />
    </button>
  );
};

type FieldInnerComponentProps = HTMLAttributes<HTMLButtonElement> &
  Pick<IconifiedSelectProps<any>, 'Icon' | 'value'> & {
    Content: IconifiedSelectProps<any>['OptionSelectedContent'];
    dropdown?: boolean;
    hidden?: boolean;
  };

const FieldInnerComponent = forwardRef<HTMLButtonElement, FieldInnerComponentProps>(
  ({ Content, Icon, value, hidden, dropdown, className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={classNames(
        'w-full p-2 flex items-center',
        hidden && 'hidden',
        dropdown ? 'cursor-pointer' : 'cursor-default',
        className
      )}
      {...rest}
    >
      <Icon option={value} />

      <div className="font-light leading-none">
        <div className="flex items-center">
          <Content option={value} />
        </div>
      </div>

      {dropdown && (
        <>
          <div className="flex-1" />

          <ChevronDownIcon className="mx-2 h-5 w-auto text-gray-600 stroke-current stroke-2" />
        </>
      )}
    </button>
  )
);

interface FieldContainerProps {
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const FieldContainer = forwardRef<HTMLDivElement, PropsWithChildren<FieldContainerProps>>(
  ({ active, className, style, children }, ref) => (
    <div
      ref={ref as unknown as React.RefObject<HTMLDivElement>}
      className={classNames(
        'w-full flex items-stretch transition ease-in-out duration-200 w-full border rounded-md',
        active ? 'border-orange-500 bg-gray-100' : 'border-gray-300',
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
);

interface SearchProps {
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

interface SelectFieldProps extends FieldInnerComponentProps {
  opened: boolean;
  search?: SearchProps;
}

const SelectField = forwardRef<HTMLDivElement, SelectFieldProps>((props, ref) => {
  const { search, ...rest } = props;

  if (search) return <SelectFieldWithSearch ref={ref} {...rest} search={search} />;

  return <SelectFieldWithoutSearch ref={ref} {...rest} />;
});

interface SelectFieldWithoutSearchProps extends FieldInnerComponentProps {
  opened: boolean;
}

const SelectFieldWithoutSearch = forwardRef<HTMLDivElement, SelectFieldWithoutSearchProps>((props, ref) => {
  const { opened, className, ...rest } = props;

  return (
    <FieldContainer ref={ref} active={opened} className={className} style={{ minHeight: '4.5rem' }}>
      <FieldInnerComponent {...rest} hidden={opened} />
    </FieldContainer>
  );
});

interface SelectFieldWithSearchProps extends FieldInnerComponentProps {
  opened: boolean;
  search: SearchProps;
}

const SelectFieldWithSearch = forwardRef<HTMLDivElement, SelectFieldWithSearchProps>((props, ref) => {
  const { opened, search, className, ...rest } = props;

  const searchInputRef = useFocusOnElement<HTMLInputElement>(opened);

  return (
    <FieldContainer ref={ref} active={opened} className={className} style={{ minHeight: '4.5rem' }}>
      <FieldInnerComponent {...rest} hidden={opened} />

      <div className={opened ? 'contents' : 'hidden'}>
        <div className="flex items-center pl-5 pr-3 py-3">
          <SearchIcon className="w-6 h-auto text-gray-500 stroke-current stroke-2" />
        </div>
        <div className="text-lg flex flex-1 items-stretch">
          <div className="flex-1 flex items-stretch mr-2">
            <input
              ref={searchInputRef}
              value={search.value || ''}
              className="w-full px-2 bg-transparent placeholder-gray-500"
              placeholder={search.placeholder}
              // autoFocus
              // onBlur={handleBlur}
              // onFocus={handleFocus}
              onChange={event => search.onChange(event.target.value)}
            />
          </div>
        </div>
      </div>
    </FieldContainer>
  );
});

const sameWidth: Modifier<string, any> = {
  name: 'sameWidth',
  enabled: true,
  phase: 'beforeWrite',
  requires: ['computeStyles'],
  fn: ({ state }) => {
    state.styles.popper.width = `${state.rects.reference.width}px`;
  },
  effect: ({ state }) => {
    state.elements.popper.style.width = `${(state.elements.reference as any).offsetWidth}px`;
    return () => {};
  }
};
