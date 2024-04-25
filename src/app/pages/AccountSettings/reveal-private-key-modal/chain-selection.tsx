import React, { memo, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';

import { Button, HashShortView } from 'app/atoms';
import { ActionModalBodyContainer, ActionModalButton, ActionModalButtonsContainer } from 'app/atoms/action-modal';
import SearchField from 'app/templates/SearchField';
import { T, t } from 'lib/i18n';
import { TempleChainTitle } from 'temple/types';

import { PrivateKeyPayload } from './types';

interface ChainSelectionProps {
  privateKeys: PrivateKeyPayload[];
  onSelect: (pk: PrivateKeyPayload) => void;
  onClose: () => void;
}

export const ChainSelection = memo<ChainSelectionProps>(({ privateKeys, onSelect, onClose }) => {
  const [searchValue, setSearchValue] = useState('');
  const matchingPrivateKeys = useMemo(
    () =>
      privateKeys.filter(
        ({ chain, address }) =>
          TempleChainTitle[chain].toLowerCase().includes(searchValue.toLowerCase()) || address === searchValue
      ),
    [privateKeys, searchValue]
  );

  return (
    <>
      <ActionModalBodyContainer>
        <SearchField
          containerClassName="my-4"
          value={searchValue}
          className={clsx(
            'bg-gray-200 focus:outline-none transition ease-in-out duration-200',
            'text-gray-900 placeholder-gray-600 text-xs leading-tight rounded-lg'
          )}
          placeholder={t('searchAccount', '')}
          searchIconClassName="h-3 w-auto text-gray-600 stroke-current"
          searchIconWrapperClassName="pl-3 pr-0.5"
          cleanButtonIconClassName="text-gray-200 w-auto stroke-current stroke-2"
          cleanButtonStyle={{ backgroundColor: '#AEAEB2', borderWidth: 0 }}
          onValueChange={setSearchValue}
        />
        <div className="w-full flex flex-col gap-3">
          {matchingPrivateKeys.map(privateKey => (
            <ChainOption key={privateKey.chain} privateKey={privateKey} onSelect={onSelect} />
          ))}
        </div>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer>
        <ActionModalButton className="bg-orange-200 text-orange-20" onClick={onClose} type="button">
          <T id="cancel" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </>
  );
});

interface ChainOptionProps {
  onSelect: (pk: PrivateKeyPayload) => void;
  privateKey: PrivateKeyPayload;
}

const ChainOption = memo<ChainOptionProps>(({ onSelect, privateKey }) => {
  const { chain, address } = privateKey;

  const handleClick = useCallback(() => onSelect(privateKey), [onSelect, privateKey]);

  return (
    <Button className="w-full flex rounded-md border border-gray-300 p-3" onClick={handleClick}>
      <div className="flex-1 text-left">
        <p className="text-sm text-gray-900 leading-5 font-semibold">{TempleChainTitle[chain]}</p>
        <p className="text-xs text-gray-600 leading-4">
          <HashShortView hash={address} />
        </p>
      </div>
    </Button>
  );
});
