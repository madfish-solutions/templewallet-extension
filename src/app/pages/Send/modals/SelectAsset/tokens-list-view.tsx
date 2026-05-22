import { ReactNode, useRef, Ref, FC, useCallback } from 'react';

import { noop } from 'lodash';

import { EmptyState } from 'app/atoms/EmptyState';
import { VisibilityTrackingInfiniteScroll } from 'app/atoms/visibility-tracking-infinite-scroll';
import { TokenListItemElement, getTokenElementIndex, useTokenWillBeRendered } from 'lib/ui/tokens-list';

import { SELECT_ASSET_SCROLLABLE_ID } from './constants';

interface TokensListViewProps {
  slugs: string[];
  children: (slug: string, index: number, ref?: Ref<TokenListItemElement>) => ReactNode;
}

export const TokensListView: FC<TokensListViewProps> = ({ slugs, children }) => {
  const firstListItemRef = useRef<TokenListItemElement>(null);
  const tokenWillBeRendered = useTokenWillBeRendered();
  const localGetTokenElementIndex = useCallback(
    (y: number) => getTokenElementIndex(null, firstListItemRef.current, slugs, tokenWillBeRendered, y, false),
    [slugs, tokenWillBeRendered]
  );

  if (slugs.length === 0) return <EmptyState />;

  return (
    <VisibilityTrackingInfiniteScroll
      getElementsIndexes={localGetTokenElementIndex}
      loadNext={noop}
      scrollableTargetId={SELECT_ASSET_SCROLLABLE_ID}
    >
      {slugs.map((slug, index) => children(slug, index, index === 0 ? firstListItemRef : undefined))}
    </VisibilityTrackingInfiniteScroll>
  );
};
