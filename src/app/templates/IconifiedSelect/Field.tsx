import React, { forwardRef, HTMLAttributes, PropsWithChildren } from 'react';

import classNames from 'clsx';

import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { useFocusOnElement } from 'lib/ui/hooks';

import { IconifiedSelectProps } from './types';

type FieldBaseProps = HTMLAttributes<HTMLButtonElement> &
  Pick<IconifiedSelectProps<any>, 'Icon' | 'value'> & {
    Content: IconifiedSelectProps<any>['OptionSelectedContent'];
    dropdown?: boolean;
  };

interface SearchProps {
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

interface IconifiedSelectFieldProps extends FieldBaseProps {
  opened: boolean;
  search?: SearchProps;
}

export const IconifiedSelectField = forwardRef<HTMLDivElement, IconifiedSelectFieldProps>((props, ref) => {
  const { search, ...rest } = props;

  if (search) return <FieldWithSearch ref={ref} {...rest} search={search} />;

  return <FieldWithNoSearch ref={ref} {...rest} />;
});

interface FieldWithNoSearchProps extends FieldBaseProps {
  opened: boolean;
}

const FieldWithNoSearch = forwardRef<HTMLDivElement, FieldWithNoSearchProps>((props, ref) => {
  const { opened, className, style, ...rest } = props;

  return (
    <FieldContainer ref={ref} className={className} style={style}>
      <FieldInnerComponent {...rest} />
    </FieldContainer>
  );
});

interface FieldWithSearchProps extends FieldWithNoSearchProps {
  search: SearchProps;
}

const FieldWithSearch = forwardRef<HTMLDivElement, FieldWithSearchProps>((props, ref) => {
  const { opened, search, className, style, ...rest } = props;

  const searchInputRef = useFocusOnElement<HTMLInputElement>(opened);

  return (
    <FieldContainer ref={ref} active={opened} className={className} style={style}>
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
              onChange={event => search.onChange(event.target.value)}
            />
          </div>
        </div>
      </div>
    </FieldContainer>
  );
});

interface FieldContainerProps {
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const FieldContainer = forwardRef<HTMLDivElement, PropsWithChildren<FieldContainerProps>>(
  ({ active = false, className, style, children }, ref) => (
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

interface FieldInnerComponentProps extends FieldBaseProps {
  hidden?: boolean;
}

export const FieldInnerComponent = forwardRef<HTMLButtonElement, FieldInnerComponentProps>(
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
