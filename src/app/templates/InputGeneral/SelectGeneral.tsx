import React, { ChangeEventHandler, ReactNode, FC, Dispatch, SetStateAction } from 'react';

import classNames from 'clsx';
import { v4 } from 'uuid';

import AssetField from 'app/atoms/AssetField';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { t } from 'lib/i18n';
import Popper from 'lib/ui/Popper';
import { sameWidthModifiers } from 'lib/ui/same-width-modifiers';
import { isDefined } from 'lib/utils/is-defined';

interface Props<T> {
  DropdownFaceContent: ReactNode;
  Input?: ReactNode;
  className?: string;
  searchProps: SelectSearchProps;
  optionsProps: SelectOptionsPropsBase<T>;
}

export const SelectGeneral = <T extends unknown>({
  DropdownFaceContent,
  Input,
  searchProps,
  optionsProps
}: Props<T>) => {
  const isInputDefined = isDefined(Input);
  return (
    <Popper
      placement="top"
      strategy="fixed"
      modifiers={sameWidthModifiers}
      popup={({ opened, setOpened }) => <SelectOptions opened={opened} setOpened={setOpened} {...optionsProps} />}
    >
      {({ opened, toggleOpened }) =>
        opened ? (
          <SelectSearch {...searchProps} />
        ) : (
          <div
            className="w-full flex items-center justify-between border rounded-md border-gray-300"
            style={{ height: '4.5rem' }}
          >
            <button
              className={classNames(
                'flex gap-2 py-5 pl-4 pr-3 items-center',
                isInputDefined && 'border-r border-gray-300',
                !isInputDefined && 'w-full justify-between'
              )}
              onClick={toggleOpened}
              style={{ height: '4.5rem' }}
            >
              {DropdownFaceContent}
              <ChevronDownIcon className="text-gray-600 stroke-current stroke-2" style={{ height: 16, width: 16 }} />
            </button>
            {Input}
          </div>
        )
      }
    </Popper>
  );
};
interface SelectOptionsPropsBase<T> {
  options: Array<T>;
  noItemsText: ReactNode;
  onOptionChange: (newValue: T) => void;
  renderOptionContent: (option: T) => ReactNode;
}
interface SelectOptionsProps<T> extends SelectOptionsPropsBase<T> {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
}

const SelectOptions = <T extends unknown>({
  opened,
  options,

  noItemsText,
  onOptionChange,
  setOpened,
  renderOptionContent
}: SelectOptionsProps<T>) => {
  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top overflow-x-hidden overflow-y-auto"
      style={{
        maxHeight: '15.125rem',
        backgroundColor: 'white',
        borderColor: '#e2e8f0'
      }}
    >
      {options.length ? (
        <FlatList
          data={options}
          renderItem={(option: T) => (
            <button
              className="flex items-center w-full py-1.5 px-2 text-left rounded transition easy-in-out duration-200 mb-1 bg-gray-200 hover:bg-gray-100 opacity-25 cursor-default cursor-pointer"
              onClick={() => {
                onOptionChange(option);
                setOpened(false);
              }}
            >
              {renderOptionContent(option)}
            </button>
          )}
        />
      ) : (
        <p className="flex items-center justify-center text-gray-600 text-base font-light p-2">
          <SearchIcon className="w-5 h-auto mr-1 stroke-current" />
          <span>{noItemsText}</span>
        </p>
      )}
    </DropdownWrapper>
  );
};

interface SelectSearchProps {
  searchValue: string;
  tokenIdValue?: string;
  showTokenIdInput?: boolean;
  onSearchChange: ChangeEventHandler<HTMLInputElement>;
  onTokenIdChange?: (newValue: number | string | undefined) => void;
}
const SelectSearch: FC<SelectSearchProps> = ({
  searchValue,
  tokenIdValue,
  showTokenIdInput = false,
  onSearchChange,
  onTokenIdChange
}) => {
  return (
    <div
      className="w-full flex items-stretch transition ease-in-out duration-200 w-full border rounded-md border-orange-500 bg-gray-100"
      style={{ height: '4.5rem' }}
    >
      <div className="items-center ml-5 mr-3 my-6">
        <SearchIcon className="w-6 h-auto text-gray-500 stroke-current stroke-2" />
      </div>

      <div className="text-lg flex flex-1 items-stretch">
        <div className="flex-1 flex items-stretch mr-2">
          <input
            autoFocus
            value={searchValue}
            className="w-full px-2 bg-transparent placeholder-gray-500"
            placeholder={t('swapTokenSearchInputPlaceholder')}
            onChange={onSearchChange}
          />
        </div>

        {showTokenIdInput && (
          <div className="w-24 flex items-stretch border-l border-gray-300">
            <AssetField
              autoFocus
              value={tokenIdValue}
              assetDecimals={0}
              fieldWrapperBottomMargin={false}
              placeholder={t('tokenId')}
              style={{ padding: '0 0.5rem', borderRadius: 0 }}
              containerStyle={{ flexDirection: 'row' }}
              containerClassName="items-stretch"
              className="text-lg border-none bg-opacity-0 focus:shadow-none"
              onChange={onTokenIdChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface FlatListProps<T> {
  data: Array<T>;
  renderItem: (props: T) => ReactNode;
}

const FlatList = <T extends unknown>({ data, renderItem }: FlatListProps<T>) => {
  return (
    <ul style={{ display: 'flex', flexDirection: 'column' }}>
      {data.map(prop => (
        <li key={v4()}>{renderItem(prop)}</li>
      ))}
    </ul>
  );
};
