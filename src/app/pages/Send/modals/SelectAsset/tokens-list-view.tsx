import { ReactNode, memo, useMemo, useRef, Ref } from 'react';

import { noop } from 'lodash';

import { EmptyState } from 'app/atoms/EmptyState';
import { VisibilityTrackingInfiniteScroll } from 'app/atoms/visibility-tracking-infinite-scroll';
import { TokenListItemElement, makeGetTokenElementIndexFunction } from 'lib/ui/tokens-list';

import { SELECT_ASSET_SCROLLABLE_ID } from './constants';

interface TokensListViewProps {
  slugs: string[];
  children: (slug: string, index: number, ref?: Ref<TokenListItemElement>) => ReactNode;
}

export const TokensListView = memo<TokensListViewProps>(({ slugs, children }) => {
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const getTokenElementIndex = useMemo(
    () => makeGetTokenElementIndexFunction(null, firstListItemRef, slugs.length, false),
    [slugs.length]
  );

  if (slugs.length === 0) return <EmptyState />;

  return (
    <VisibilityTrackingInfiniteScroll
      getElementsIndexes={getTokenElementIndex}
      loadNext={noop}
      scrollableTargetId={SELECT_ASSET_SCROLLABLE_ID}
    >
      {slugs.map((slug, index) => children(slug, index, index === 0 ? firstListItemRef : undefined))}
    </VisibilityTrackingInfiniteScroll>
  );
});
