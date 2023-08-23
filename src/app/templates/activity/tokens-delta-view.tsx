import React, { memo, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { TokenDelta } from '@temple-wallet/transactions-parser';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import { AssetIcon } from 'app/templates/AssetIcon';
import { useManyTokensFiatCurrencyPrices, useFiatCurrency } from 'lib/fiat-currency';
import { t } from 'lib/i18n';
import { isCollectible, useManyAssetsMetadata } from 'lib/metadata';
import { getAssetSymbolOrName } from 'lib/temple/activity-new/utils';
import { atomsToTokens } from 'lib/temple/helpers';
import { ZERO } from 'lib/utils/numbers';

export enum FilteringMode {
  NONE = 'NONE',
  /** For swaps and investing liquidity */
  ONLY_POSITIVE_IF_PRESENT = 'ONLY_POSITIVE_IF_PRESENT',
  /** For divesting liquidity */
  ONLY_NEGATIVE_IF_PRESENT = 'ONLY_NEGATIVE_IF_PRESENT'
}

interface Props {
  tokensDeltas: TokenDelta[] | TokenDelta;
  shouldShowNFTCard: boolean;
  isTotal: boolean;
  filteringMode?: FilteringMode;
}

export const TokensDeltaView = memo<Props>(
  ({ tokensDeltas, shouldShowNFTCard, isTotal, filteringMode = FilteringMode.NONE }) => {
    const { selectedFiatCurrency } = useFiatCurrency();
    const tokensDeltasToDisplay = useMemo(() => {
      const sanitizedTokensDeltas = Array.isArray(tokensDeltas) ? tokensDeltas : [tokensDeltas];

      let filterPredicate: (delta: TokenDelta) => boolean;
      switch (filteringMode) {
        case FilteringMode.NONE:
          filterPredicate = () => true;
          break;
        case FilteringMode.ONLY_NEGATIVE_IF_PRESENT:
          filterPredicate = ({ atomicAmount }) => atomicAmount.lt(0);
          break;
        default:
          filterPredicate = ({ atomicAmount }) => atomicAmount.gt(0);
      }

      if (sanitizedTokensDeltas.some(filterPredicate)) {
        return sanitizedTokensDeltas.filter(filterPredicate);
      }

      return sanitizedTokensDeltas;
    }, [tokensDeltas, filteringMode]);
    const assetsSlugs = useMemo(() => tokensDeltasToDisplay.map(({ tokenSlug }) => tokenSlug), [tokensDeltasToDisplay]);
    const assetsMetadata = useManyAssetsMetadata(assetsSlugs);
    const fiatCurrencyPrices = useManyTokensFiatCurrencyPrices(assetsSlugs);
    const assetsSymbolsOrNames = useMemo(
      () => Object.entries(assetsMetadata).map(([, metadata]) => getAssetSymbolOrName(metadata)),
      [assetsMetadata]
    );
    const firstAssetSlug = assetsSlugs[0];
    const firstAtomicDiff = tokensDeltasToDisplay[0]?.atomicAmount ?? ZERO;
    const firstAssetMetadata = assetsMetadata[firstAssetSlug];
    const firstAssetSymbolOrName = assetsSymbolsOrNames[0];
    const firstDiff = useMemo(
      () => atomsToTokens(firstAtomicDiff, firstAssetMetadata?.decimals ?? 0),
      [firstAtomicDiff, firstAssetMetadata]
    );
    const totalFiatAmount = useMemo(
      () =>
        tokensDeltasToDisplay
          .reduce(
            (acc, { atomicAmount, tokenSlug }) =>
              acc.plus(
                atomsToTokens(atomicAmount, assetsMetadata[tokenSlug]?.decimals ?? 0).times(
                  fiatCurrencyPrices[tokenSlug] ?? 0
                )
              ),
            new BigNumber(0)
          )
          .abs(),
      [tokensDeltasToDisplay, fiatCurrencyPrices, assetsMetadata]
    );

    const conditionalDiffClassName = classNames(
      firstDiff.gt(0) ? 'text-green-500' : 'text-red-700',
      isTotal ? 'text-sm leading-tight' : 'text-xs leading-none'
    );
    const sign = firstDiff.gt(0) ? '+' : '-';
    const tokensCount = tokensDeltasToDisplay.length;

    if (tokensCount === 0) {
      return null;
    }

    return (
      <div className="flex flex-row items-center">
        <div className="flex flex-1 flex-col items-right">
          <div className={classNames('inline-flex text-right justify-end font-medium', conditionalDiffClassName)}>
            {tokensCount === 1 && (
              <span>
                {sign}{' '}
                <Money forceUseFormattingThreshold smallFractionFont={false}>
                  {firstDiff.abs()}
                </Money>{' '}
                {firstAssetSymbolOrName}
              </span>
            )}
            {tokensCount === 2 && `${sign} ${assetsSymbolsOrNames.join(t('listSeparation'))}`}
            {tokensCount > 2 && `${sign} ${t('tokenAndSeveralOthers', [firstAssetSymbolOrName, tokensCount - 1])}`}
          </div>
          <div className="text-gray-500 text-xs leading-5 text-right">
            <Money fiat smallFractionFont={false}>
              {totalFiatAmount}
            </Money>{' '}
            {selectedFiatCurrency.symbol}
          </div>
        </div>
        {/* TODO: implement plugs for broken images and audio only NFTs, and handle many other cases */}
        {shouldShowNFTCard && isDefined(firstAssetMetadata) && isCollectible(firstAssetMetadata) && (
          <AssetIcon assetSlug={firstAssetSlug} className="ml-2 rounded-lg border border-gray-300 w-9 h-9" size={36} />
        )}
      </div>
    );
  }
);
