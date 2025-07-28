import React, { memo } from 'react';

import { Chain as ViemChain } from 'viem';

import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';

import { SuggestedChainsGroupItem } from './item';

interface SuggestedChainsGroupProps {
  title: string;
  chains: ViemChain[];
  searchValue: string;
  onChainSelect: SyncFn<ViemChain>;
  className?: string;
}

export const SuggestedChainsGroup = memo<SuggestedChainsGroupProps>(
  ({ title, chains, searchValue, onChainSelect, className }) => (
    <InputContainer className={className} header={<p className="my-1 text-font-description-bold">{title}</p>}>
      <SettingsCellGroup>
        {chains.map((chain, i) => (
          <SuggestedChainsGroupItem
            key={chain.id}
            item={chain}
            isLast={i === chains.length - 1}
            onChainSelect={onChainSelect}
            searchValue={searchValue}
          />
        ))}
      </SettingsCellGroup>
    </InputContainer>
  )
);
