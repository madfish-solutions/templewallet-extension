import React, { memo } from 'react';

import { TempleChainKind } from 'temple/types';

import { EvmSwapForm } from './EvmSwapForm';
import { ReviewData } from './interfaces';
import { TezosSwapForm } from './TezosSwapForm';

interface SwapFormProps {
  chainKind?: string | null;
  chainId?: string | number | null;
  activeField: 'from' | 'to';
  selectedChainAssets: { from: string | null; to: string | null };
  slippageTolerance: number;
  onReview: (data: ReviewData) => void;
  onSelectAssetClick: (field: 'from' | 'to') => void;
  handleToggleIconClick: EmptyFn;
}

export const SwapForm = memo<SwapFormProps>(
  ({
    onReview,
    slippageTolerance,
    selectedChainAssets,
    onSelectAssetClick,
    handleToggleIconClick,
    activeField,
    chainKind,
    chainId
  }) => {
    if (chainKind === TempleChainKind.EVM) {
      return (
        <EvmSwapForm
          chainId={chainId as number}
          slippageTolerance={slippageTolerance}
          onReview={onReview}
          onSelectAssetClick={onSelectAssetClick}
          selectedChainAssets={selectedChainAssets}
          activeField={activeField}
          handleToggleIconClick={handleToggleIconClick}
        />
      );
    }

    return (
      <TezosSwapForm
        slippageTolerance={slippageTolerance}
        onReview={onReview}
        onSelectAssetClick={onSelectAssetClick}
        selectedChainAssets={selectedChainAssets}
        activeField={activeField}
        handleToggleIconClick={handleToggleIconClick}
      />
    );
  }
);
