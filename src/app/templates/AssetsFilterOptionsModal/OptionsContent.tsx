import React, { FC, memo, useCallback } from 'react';

import clsx from 'clsx';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Divider, ToggleSwitch, IconBase } from 'app/atoms';
import { NetworkSelectButton } from 'app/atoms/NetworkSelectButton';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { ContentContainer } from 'app/layouts/containers';
import { dispatch } from 'app/store';
import {
  resetTokensFilterOptions,
  setCollectiblesBlurFilterOption,
  setCollectiblesShowInfoFilterOption,
  setTokensGroupByNetworkFilterOption,
  setTokensHideSmallBalanceFilterOption
} from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector, useHasActiveFiltersSelector } from 'app/store/assets-filter-options/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { T, TID } from 'lib/i18n';

interface Props {
  onNetworkSelectClick: EmptyFn;
}

export const OptionsContent = memo<Props>(({ onNetworkSelectClick }) => {
  const options = useAssetsFilterOptionsSelector();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const { filterChain, tokensListOptions, collectiblesListOptions } = options;
  const hasActiveFilters = useHasActiveFiltersSelector();

  const handleTokensHideSmallBalanceChange = useCallback(
    (checked: boolean) => dispatch(setTokensHideSmallBalanceFilterOption(checked)),
    []
  );
  const handleTokensGroupByNetworkChange = useCallback(
    (checked: boolean) => dispatch(setTokensGroupByNetworkFilterOption(checked)),
    []
  );

  const handleCollectiblesBlurChange = useCallback(
    (checked: boolean) => dispatch(setCollectiblesBlurFilterOption(checked)),
    []
  );
  const handleCollectiblesShowInfoChange = useCallback(
    (checked: boolean) => dispatch(setCollectiblesShowInfoFilterOption(checked)),
    []
  );

  return (
    <FadeTransition>
      <ContentContainer withShadow={false}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between p-1">
            <p className="text-font-description-bold">
              <T id="network" />
            </p>

            {hasActiveFilters && (
              <button
                className="flex items-center gap-0.5 text-secondary"
                onClick={() => dispatch(resetTokensFilterOptions())}
              >
                <span className="text-font-description-bold">
                  <T id="resetAll" />
                </span>
                <IconBase Icon={XCircleFillIcon} size={12} />
              </button>
            )}
          </div>

          <NetworkSelectButton selectedChain={filterChain} onClick={onNetworkSelectClick} />
        </div>

        <TogglesContainer labelTitle="tokensList">
          <ToggleRow
            labelId="hideSmallBalance"
            checked={tokensListOptions.hideSmallBalance}
            disabled={testnetModeEnabled}
            onChange={handleTokensHideSmallBalanceChange}
            isFirst
          />
          <Divider thinest />
          <ToggleRow
            labelId="groupByNetwork"
            checked={tokensListOptions.groupByNetwork}
            disabled={Boolean(filterChain)}
            onChange={handleTokensGroupByNetworkChange}
            isLast
          />
        </TogglesContainer>

        <TogglesContainer labelTitle="collectiblesView">
          <ToggleRow
            labelId="blurSensitiveContent"
            checked={collectiblesListOptions.blur}
            onChange={handleCollectiblesBlurChange}
            isFirst
          />
          <Divider thinest />
          <ToggleRow
            labelId="showDetails"
            checked={collectiblesListOptions.showInfo}
            onChange={handleCollectiblesShowInfoChange}
            isLast
          />
        </TogglesContainer>
      </ContentContainer>
    </FadeTransition>
  );
});

interface TogglesContainerProps extends PropsWithChildren {
  labelTitle: TID;
}

const TogglesContainer: FC<TogglesContainerProps> = ({ labelTitle, children }) => (
  <div className="flex flex-col gap-1 mt-4">
    <p className="text-font-description-bold p-1">
      <T id={labelTitle} />
    </p>

    <div className="rounded-8 border-0.5 border-lines overflow-hidden">{children}</div>
  </div>
);

interface ToggleRowProps {
  labelId: TID;
  checked: boolean;
  disabled?: boolean;
  onChange: SyncFn<boolean>;
  isFirst?: boolean;
  isLast?: boolean;
}

const ToggleRow: FC<ToggleRowProps> = ({ labelId, checked, disabled, onChange, isFirst, isLast }) => (
  <div
    className={clsx(
      'flex justify-between items-center px-3 py-3.5 bg-white',
      isFirst && 'rounded-t-8',
      isLast && 'rounded-b-8'
    )}
  >
    <span className="text-font-medium-bold">
      <T id={labelId} />
    </span>

    <ToggleSwitch checked={checked} disabled={disabled} onChange={onChange} />
  </div>
);
