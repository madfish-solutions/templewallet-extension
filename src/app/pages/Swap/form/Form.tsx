import React, { memo } from 'react';

import { TempleChainKind } from 'temple/types';

import { EvmSwapForm } from './EvmSwapForm';
import { SwapFieldName, SwapReviewData } from './interfaces';
import { TezosSwapForm } from './TezosSwapForm';

interface SwapFormProps {
  chainKind?: string | null;
  chainId?: string | number | null;
  activeField: SwapFieldName;
  selectedChainAssets: { from: string | null; to: string | null };
  slippageTolerance: number;
  onReview: SyncFn<SwapReviewData>;
  onSelectAssetClick: SyncFn<SwapFieldName>;
  confirmSwapModalOpened: boolean;
  handleToggleIconClick: EmptyFn;
}

export const SwapForm = memo<SwapFormProps>(
  ({
    onReview,
    slippageTolerance,
    selectedChainAssets,
    onSelectAssetClick,
    handleToggleIconClick,
    confirmSwapModalOpened,
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
          confirmSwapModalOpened={confirmSwapModalOpened}
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
