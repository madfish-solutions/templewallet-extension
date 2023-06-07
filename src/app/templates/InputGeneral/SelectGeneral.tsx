import React, { ChangeEventHandler, ReactNode, FC, Dispatch, SetStateAction } from 'react';

import { isDefined } from '@rnw-community/shared';
import classNames from 'clsx';
import { List } from 'react-virtualized';

import AssetField from 'app/atoms/AssetField';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnvStyle } from 'app/hooks/use-app-env-style.hook';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { t } from 'lib/i18n';
import Popper from 'lib/ui/Popper';
import { sameWidthModifiers } from 'lib/ui/same-width-modifiers';

export enum DropdownSize {
  Large,
  Small
}
interface Props<T> {
  DropdownFaceContent: ReactNode;
  Input?: ReactNode;
  className?: string;
  searchProps: SelectSearchProps;
  optionsProps: SelectOptionsPropsBase<T>;
  dropdownSize?: DropdownSize;
}

export const SelectGeneral = <T extends unknown>({
  DropdownFaceContent,
  Input,
  searchProps,
  optionsProps,
  dropdownSize = DropdownSize.Small
}: Props<T>) => {
  const isInputDefined = isDefined(Input);

  return (
    <Popper
      placement="bottom"
      strategy="fixed"
      modifiers={sameWidthModifiers}
      fallbackPlacementsEnabled={false}
      popup={({ opened, setOpened }) => <SelectOptions opened={opened} setOpened={setOpened} {...optionsProps} />}
    >
      {({ ref, opened, toggleOpened }) => (
        <div ref={ref as unknown as React.RefObject<HTMLDivElement>}>
          {opened ? (
            <SelectSearch dropdownSize={dropdownSize} {...searchProps} />
          ) : (
            <div
              className="w-full flex items-center justify-between border rounded-md border-gray-300 overflow-hidden"
              style={{ height: dropdownSize === DropdownSize.Small ? '46px' : '4.5rem' }}
            >
              <button
                className={classNames(
                  'flex gap-2 items-center',
                  dropdownSize === DropdownSize.Large ? 'pl-4 pr-3 py-5' : 'overflow-hidden p-2',
                  isInputDefined && 'border-r border-gray-300',
                  !isInputDefined && 'w-full justify-between'
                )}
                onClick={toggleOpened}
                style={{ height: dropdownSize === DropdownSize.Large ? '4.5rem' : 'auto' }}
              >
                {DropdownFaceContent}
                <ChevronDownIcon className="text-gray-600 stroke-current stroke-2" style={{ height: 16, width: 16 }} />
              </button>
              {Input}
            </div>
          )}
        </div>
      )}
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
  isLoading?: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
}

const ROW_HEIGHT = 64;

const SelectOptions = <T extends unknown>({
  opened,
  options,
  noItemsText,
  isLoading,
  onOptionChange,
  setOpened,
  renderOptionContent
}: SelectOptionsProps<T>) => {
  const { dropdownWidth } = useAppEnvStyle();

  const handleOptionClick = (newValue: T) => {
    onOptionChange(newValue);
    setOpened(false);
  };

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
      {(options.length === 0 || isLoading) && (
        <div className="my-8 flex flex-col items-center justify-center text-gray-500">
          {isLoading ? (
            <Spinner theme="primary" style={{ width: '3rem' }} />
          ) : (
            <p className="flex items-center justify-center text-gray-600 text-base font-light">
              <span>Search</span>
            </p>
          )}
        </div>
      )}

      <List
        width={dropdownWidth}
        height={options.length > 2 ? 240 : options.length * ROW_HEIGHT}
        rowCount={options.length}
        rowHeight={ROW_HEIGHT}
        rowRenderer={({ index }) => {
          const option = options[index];

          return (
            <button className="w-full" onClick={() => handleOptionClick(option)}>
              {renderOptionContent(option)}
            </button>
          );
        }}
      />
    </DropdownWrapper>
  );
};

interface SelectSearchProps {
  dropdownSize?: DropdownSize;
  searchValue: string;
  tokenIdValue?: string;
  showTokenIdInput?: boolean;
  onSearchChange: ChangeEventHandler<HTMLInputElement>;
  onTokenIdChange?: (newValue: number | string | undefined) => void;
}
const SelectSearch: FC<SelectSearchProps> = ({
  searchValue,
  tokenIdValue,
  dropdownSize = DropdownSize.Small,
  showTokenIdInput = false,
  onSearchChange,
  onTokenIdChange
}) => {
  return (
    <div
      className={classNames(
        'w-full flex items-center transition ease-in-out duration-200 w-full border rounded-md border-orange-500 bg-gray-100',
        dropdownSize === DropdownSize.Small ? 'p-2' : 'pl-4 pr-3 py-5'
      )}
      style={{ height: dropdownSize === DropdownSize.Small ? '46px' : '4.5rem' }}
    >
      <div className="items-center">
        <SearchIcon className={classNames('w-6 h-auto text-gray-500 stroke-current stroke-2')} />
      </div>

      <div className="text-lg flex flex-1 items-stretch">
        <div className="flex-1 flex items-stretch mr-2">
          <input
            autoFocus
            value={searchValue}
            className="w-full bg-transparent placeholder-gray-500"
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
              style={{ borderRadius: 0 }}
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
