import React, { FC, memo, useCallback, useRef } from 'react';

import clsx from 'clsx';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Divider, ToggleSwitch } from 'app/atoms';
import { NetworkSelectButton } from 'app/atoms/NetworkSelectButton';
import { ContentContainer } from 'app/layouts/containers';
import { dispatch } from 'app/store';
import {
  setCollectiblesBlurFilterOption,
  setCollectiblesShowInfoFilterOption,
  setTokensGroupByNetworkFilterOption,
  setTokensHideSmallBalanceFilterOption
} from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { NetworkSelectModal } from 'app/templates/NetworkSelectModal';
import { T, TID } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

export const AssetsFilterOptions = memo(() => {
  const options = useAssetsFilterOptionsSelector();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const { filterChain, tokensListOptions, collectiblesListOptions } = options;

  const [networksModalOpened, setNetworksModalOpen, setNetworksModalClosed] = useBooleanState(false);

  const containerRef = useRef(null);

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
      <ContentContainer ref={containerRef} withShadow={false}>
        <div className="flex flex-col gap-1">
          <p className="text-font-description-bold p-1">
            <T id="filterByNetwork" />
          </p>

          <NetworkSelectButton selectedChain={filterChain} onClick={setNetworksModalOpen} />
        </div>

        <TogglesContainer labelTitle="tokensList">
          {!testnetModeEnabled && (
            <>
              <ToggleRow
                labelId="hideSmallBalance"
                checked={tokensListOptions.hideSmallBalance}
                onChange={handleTokensHideSmallBalanceChange}
                isFirst
              />
              <Divider thinest />
            </>
          )}

          <ToggleRow
            labelId="groupByNetwork"
            checked={tokensListOptions.groupByNetwork}
            disabled={Boolean(filterChain)}
            onChange={handleTokensGroupByNetworkChange}
            isFirst={testnetModeEnabled}
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

        <NetworkSelectModal
          opened={networksModalOpened}
          selectedNetwork={filterChain}
          onRequestClose={setNetworksModalClosed}
        />
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
