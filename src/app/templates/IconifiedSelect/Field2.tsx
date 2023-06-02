import React, { forwardRef, HTMLAttributes, PropsWithChildren, ReactNode } from 'react';

import classNames from 'clsx';

import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { setTestID, TestIDProps } from 'lib/analytics';
import { useFocusOnElement } from 'lib/ui/hooks';

import { IconifiedSelectProps2, IconifiedSelectPropsBase2 } from './types';

type FieldBaseProps2 = HTMLAttributes<HTMLButtonElement> &
  IconifiedSelectPropsBase2 & {
    Content: ReactNode;
    dropdown?: boolean;
  };

interface SearchProps {
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  inputTestID?: string;
}

interface IconifiedSelectFieldProps2 extends FieldBaseProps2, TestIDProps {
  opened: boolean;
  search?: SearchProps;
  BeforeContent: ReactNode;
}

export const IconifiedSelectField2 = forwardRef<HTMLDivElement, IconifiedSelectFieldProps2>((props, ref) => {
  const { search, ...rest } = props;

  if (search) return <FieldWithSearch2 ref={ref} {...rest} search={search} />;

  return <FieldWithNoSearch2 ref={ref} {...rest} />;
});

interface FieldWithNoSearchProps extends FieldBaseProps2, TestIDProps {
  opened: boolean;
  BeforeContent: IconifiedSelectProps2['BeforeContent'];
}
interface FieldWithNoSearchProps extends FieldBaseProps2, TestIDProps {
  opened: boolean;
  BeforeContent: ReactNode;
}
interface FieldWithNoSearchProps2 extends FieldBaseProps2, TestIDProps {
  opened: boolean;
  BeforeContent: ReactNode;
}

const FieldWithNoSearch2 = forwardRef<HTMLDivElement, FieldWithNoSearchProps2>((props, ref) => {
  const { opened, className, style, testID, BeforeContent, ...rest } = props;

  return (
    <FieldContainer2 ref={ref} className={className} style={style} BeforeContent={BeforeContent}>
      <FieldInnerComponent2 {...rest} />
    </FieldContainer2>
  );
});

interface FieldWithSearchProps extends FieldWithNoSearchProps {
  search: SearchProps;
}

const FieldWithSearch2 = forwardRef<HTMLDivElement, FieldWithSearchProps>((props, ref) => {
  const { opened, search, className, style, testID, BeforeContent, ...rest } = props;

  const searchInputRef = useFocusOnElement<HTMLInputElement>(opened);

  return (
    <FieldContainer2 ref={ref} opened={opened} className={className} style={style} BeforeContent={BeforeContent}>
      <FieldInnerComponent2 {...rest} hidden={opened} />

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
              {...setTestID(search.inputTestID)}
            />
          </div>
        </div>
      </div>
    </FieldContainer2>
  );
});

interface FieldContainerProps {
  active?: boolean;
  opened?: boolean;
  className?: string;
  style?: React.CSSProperties;
  BeforeContent: ReactNode;
}

export const FieldContainer2 = forwardRef<HTMLDivElement, PropsWithChildren<FieldContainerProps>>(
  ({ opened = false, className, style, BeforeContent, children }, ref) => (
    <>
      {BeforeContent}
      <div
        ref={ref as unknown as React.RefObject<HTMLDivElement>}
        className={classNames(
          'w-full flex items-stretch transition ease-in-out duration-200 w-full border rounded-md',
          opened ? 'border-orange-500 bg-gray-100' : 'border-gray-300',
          className
        )}
        style={style}
      >
        {children}
      </div>
    </>
  )
);

export const FieldInnerComponent2 = forwardRef<HTMLButtonElement, FieldBaseProps2>(
  ({ Content, hidden, dropdown, className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={classNames(
        'w-full p-2 flex items-center font-light',
        hidden && 'hidden',
        dropdown ? 'cursor-pointer' : 'cursor-default',
        className
      )}
      {...rest}
    >
      {Content}

      {dropdown && (
        <>
          <div className="flex-1" />

          <ChevronDownIcon className="mx-2 h-5 w-auto text-gray-600 stroke-current stroke-2" />
        </>
      )}
    </button>
  )
);
