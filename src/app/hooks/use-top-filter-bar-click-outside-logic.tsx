import { useRef } from 'react';

import useOnClickOutside from 'use-onclickoutside';

import { useAssetsSegmentControlRef } from 'app/atoms/AssetsSegmentControl';
import { useContentPaperRef } from 'app/layouts/PageLayout/context';

import { useAssetsViewState } from './use-assets-view-state';

export const useTopFilterBarClickOutsideLogic = () => {
  const { manageActive, setManageInactive } = useAssetsViewState();

  const stickyBarRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputContainerRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef(null);

  const contentPaperRef = useContentPaperRef();
  const assetsSegmentControlRef = useAssetsSegmentControlRef();

  useOnClickOutside(
    containerRef,
    manageActive
      ? evt => {
          const evtTarget = evt.target as Node;

          const isManageButtonClick = Boolean(manageButtonRef.current && manageButtonRef.current.contains(evtTarget));
          const isSearchInputClick = Boolean(
            searchInputContainerRef.current && searchInputContainerRef.current.contains(evtTarget)
          );
          const isSegmentControlClick = Boolean(
            assetsSegmentControlRef.current && assetsSegmentControlRef.current.contains(evtTarget)
          );
          const isInsideContentClick = Boolean(contentPaperRef.current && contentPaperRef.current.contains(evtTarget));

          if (!isSearchInputClick && !isManageButtonClick && !isSegmentControlClick && isInsideContentClick) {
            setManageInactive();
          }
        }
      : null
  );

  return {
    stickyBarRef,
    filterButtonRef,
    manageButtonRef,
    searchInputContainerRef,
    containerRef
  };
};
