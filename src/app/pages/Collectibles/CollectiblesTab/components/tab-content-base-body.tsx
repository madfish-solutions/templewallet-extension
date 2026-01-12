import React, { ReactNode, RefObject, memo, useMemo, useRef } from 'react';

import { CollectiblesListItemElement, makeGetCollectiblesElementsIndexesFunction } from 'lib/ui/collectibles-list';

import { CollectiblesTabBase, CollectiblesTabBaseProps } from './CollectiblesTabBase';

interface TabContentBaseBodyProps
  extends Omit<CollectiblesTabBaseProps, 'children' | 'collectiblesCount' | 'getElementsIndexes'> {
  manageActive: boolean;
  slugs: string[];
  showInfo: boolean;
  renderItem: (slug: string, index: number, ref?: RefObject<CollectiblesListItemElement | null>) => ReactNode;
}

export const TabContentBaseBody = memo<TabContentBaseBodyProps>(
  ({ manageActive, slugs, showInfo, renderItem, ...restProps }) => {
    const firstItemRef = useRef<CollectiblesListItemElement>(null);
    const contentElement = useMemo(
      () => (
        <div className={manageActive ? undefined : 'grid grid-cols-3 gap-2'}>
          {slugs.map((chainSlug, index) => renderItem(chainSlug, index, index === 0 ? firstItemRef : undefined))}
        </div>
      ),
      [manageActive, slugs, renderItem]
    );
    const getElementsIndexes = useMemo(
      () => makeGetCollectiblesElementsIndexesFunction(firstItemRef, slugs.length, showInfo, manageActive),
      [slugs.length, manageActive, showInfo]
    );

    return (
      <CollectiblesTabBase collectiblesCount={slugs.length} getElementsIndexes={getElementsIndexes} {...restProps}>
        {contentElement}
      </CollectiblesTabBase>
    );
  }
);
