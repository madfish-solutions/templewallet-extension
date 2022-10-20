import React, { FC, useMemo } from 'react';

import { List } from 'react-virtualized';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { T } from 'lib/i18n';
import { useAccount, useChainId } from 'lib/temple/front';
import * as Repo from 'lib/temple/repo';

import { useAppEnvStyle } from '../../../../hooks/useAppEnvStyle';
import { AssetOption } from './AssetOption/AssetOption';

interface Props {
  value?: string;
  options: string[];
  isLoading: boolean;
  searchString?: string;
  searchAssetSlug: string;
  showTokenIdInput: boolean;
  opened: boolean;
  setOpened: (newValue: boolean) => void;
  onChange: (newValue: string) => void;
}

export const AssetsMenu: FC<Props> = ({
  value,
  options,
  isLoading,
  searchString,
  searchAssetSlug,
  showTokenIdInput,
  opened,
  setOpened,
  onChange
}) => {
  const { dropdownWidth } = useAppEnvStyle();
  const chainId = useChainId(true)!;
  const account = useAccount();
  const isShowSearchOption = useMemo(() => !options.includes(searchAssetSlug), [options, searchAssetSlug]);

  const handleOptionClick = (newValue: string) => {
    if (value !== newValue) {
      onChange(newValue);
    }
    setOpened(false);
  };

  const handleSearchOptionClick = async (newValue: string) => {
    await Repo.accountTokens.put(
      {
        type: Repo.ITokenType.Fungible,
        chainId,
        account: account.publicKeyHash,
        tokenSlug: newValue,
        status: Repo.ITokenStatus.Enabled,
        addedAt: Date.now()
      },
      Repo.toAccountTokenKey(chainId, account.publicKeyHash, newValue)
    );

    handleOptionClick(newValue);
  };

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top overflow-x-hidden overflow-y-auto"
      style={{
        maxHeight: '15.75rem',
        backgroundColor: 'white',
        borderColor: '#e2e8f0',
        padding: 0
      }}
    >
      {isShowSearchOption && <AssetOption assetSlug={searchAssetSlug} onClick={handleSearchOptionClick} />}
      {(options.length === 0 || isLoading) && (
        <div className="my-8 flex flex-col items-center justify-center text-gray-500">
          {isLoading ? (
            <Spinner theme="primary" style={{ width: '3rem' }} />
          ) : (
            <p className="flex items-center justify-center text-gray-600 text-base font-light">
              {searchString ? <SearchIcon className="w-5 h-auto mr-1 stroke-current" /> : null}

              <span>{showTokenIdInput ? <T id="specifyTokenId" /> : <T id="noAssetsFound" />}</span>
            </p>
          )}
        </div>
      )}
      <List
        width={dropdownWidth}
        height={240}
        rowCount={options.length}
        rowHeight={65}
        rowRenderer={({ key, index, style }) => (
          <AssetOption key={key} assetSlug={options[index]} style={style} onClick={handleOptionClick} />
        )}
      />
    </DropdownWrapper>
  );
};
