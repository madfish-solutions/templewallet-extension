import React, { memo } from 'react';

import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { OneOfChains } from 'temple/front';

import { ChainsGroupItem } from './item';

interface ChainsGroup {
  title: string;
  chains: OneOfChains[];
}

interface ChainsGroupViewProps {
  className?: string;
  group: ChainsGroup;
}

export const ChainsGroupView = memo<ChainsGroupViewProps>(({ className, group }) => {
  const { title, chains } = group;

  return (
    <InputContainer className={className} header={<p className="my-1 text-font-description-bold">{title}</p>}>
      <SettingsCellGroup>
        {chains.map((chain, i) => (
          <ChainsGroupItem key={chain.chainId} item={chain} isLast={i === chains.length - 1} />
        ))}
      </SettingsCellGroup>
    </InputContainer>
  );
});
