import React, { FC, memo, RefObject, useCallback, useEffect, useMemo, useRef } from 'react';

import { isEqual } from 'lodash';
import useOnClickOutside from 'use-onclickoutside';

import { Divider, IconBase, ToggleSwitch } from 'app/atoms';
import { useAssetsSegmentControlRef } from 'app/atoms/AssetsSegmentControl';
import { NetworkSelectButton } from 'app/atoms/NetworkSelectButton';
import { ReactComponent as CleanIcon } from 'app/icons/base/x_circle_fill.svg';
import { ContentContainer } from 'app/layouts/containers';
import { useContentPaperRef } from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import {
  resetTokensFilterOptions,
  setCollectiblesBlurFilterOption,
  setCollectiblesShowInfoFilterOption,
  setTokensGroupByNetworkFilterOption,
  setTokensHideZeroBalanceFilterOption
} from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptionsInitialState } from 'app/store/assets-filter-options/state';
import { NetworkSelectModal } from 'app/templates/NetworkSelectModal';
import { T, TID } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

interface AssetsFilterOptionsProps {
  filterButtonRef: RefObject<HTMLButtonElement>;
  onRequestClose: EmptyFn;
}

export const AssetsFilterOptions = memo<AssetsFilterOptionsProps>(({ filterButtonRef, onRequestClose }) => {
  const options = useAssetsFilterOptionsSelector();
  const { filterChain, tokensListOptions, collectiblesListOptions } = options;

  const [networksModalOpened, setNetworksModalOpen, setNetworksModalClosed] = useBooleanState(false);

  const isNonDefaultOption = useMemo(() => !isEqual(options, AssetsFilterOptionsInitialState), [options]);

  const containerRef = useRef(null);
  const contentPaperRef = useContentPaperRef();
  const assetsSegmentControlRef = useAssetsSegmentControlRef();

  useOnClickOutside(
    containerRef,
    networksModalOpened
      ? null
      : evt => {
          const evtTarget = evt.target as Node;

          const isFilterButtonClick = Boolean(filterButtonRef.current && filterButtonRef.current.contains(evtTarget));
          const isSegmentControlClick = Boolean(
            assetsSegmentControlRef.current && assetsSegmentControlRef.current.contains(evtTarget)
          );
          const isInsideContentClick = Boolean(contentPaperRef.current && contentPaperRef.current.contains(evtTarget));

          if (!isFilterButtonClick && !isSegmentControlClick && isInsideContentClick) {
            onRequestClose();
          }
        }
  );

  useEffect(() => {
    if (filterChain) dispatch(setTokensGroupByNetworkFilterOption(false));
  }, [filterChain]);

  const handleResetAllClick = useCallback(() => dispatch(resetTokensFilterOptions()), []);

  const handleTokensHideZeroBalanceChange = useCallback(
    (checked: boolean) => dispatch(setTokensHideZeroBalanceFilterOption(checked)),
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
    <ContentContainer ref={containerRef}>
      <div className="flex justify-between items-center pt-1 pb-2 pl-1">
        <p className="text-font-description-bold">
          <T id="filterByNetwork" />
        </p>

        {isNonDefaultOption && (
          <button onClick={handleResetAllClick} className="flex items-center text-secondary text-font-description-bold">
            <T id="resetAll" />
            <IconBase Icon={CleanIcon} size={12} />
          </button>
        )}
      </div>

      <NetworkSelectButton selectedChain={filterChain} onClick={setNetworksModalOpen} />

      <TogglesContainer labelTitle="tokensList">
        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="hideZeroBalance" />
          </span>

          <ToggleSwitch checked={tokensListOptions.hideZeroBalance} onChange={handleTokensHideZeroBalanceChange} />
        </div>

        <Divider thinest />

        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="groupByNetwork" />
          </span>

          <ToggleSwitch
            checked={tokensListOptions.groupByNetwork}
            disabled={Boolean(filterChain)}
            onChange={handleTokensGroupByNetworkChange}
          />
        </div>
      </TogglesContainer>

      <TogglesContainer labelTitle="collectiblesView">
        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="blurSensitiveContent" />
          </span>

          <ToggleSwitch checked={collectiblesListOptions.blur} onChange={handleCollectiblesBlurChange} />
        </div>

        <Divider thinest />

        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="showDetails" />
          </span>

          <ToggleSwitch checked={collectiblesListOptions.showInfo} onChange={handleCollectiblesShowInfoChange} />
        </div>
      </TogglesContainer>

      <NetworkSelectModal
        opened={networksModalOpened}
        selectedNetwork={filterChain}
        onRequestClose={setNetworksModalClosed}
      />
    </ContentContainer>
  );
});

interface TogglesContainerProps extends PropsWithChildren {
  labelTitle: TID;
}

const TogglesContainer: FC<TogglesContainerProps> = ({ labelTitle, children }) => (
  <>
    <p className="text-font-description-bold mt-4 pt-1 pb-2 pl-1">
      <T id={labelTitle} />
    </p>

    <div className="rounded-lg shadow-bottom border-0.5 border-transparent">{children}</div>
  </>
);
