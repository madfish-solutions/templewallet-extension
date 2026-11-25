import { FC, ReactNode } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { VirtualList } from 'app/atoms/virtual-list';

import { getTokenListItemHeight } from './token-list-item';

const itemHeight = (_: string, rem: number) => getTokenListItemHeight(rem);
const itemKey = (slug: string) => slug;

interface TokensListViewProps {
  slugs: string[];
  scrollElementId: string;
  tokenWillBeRendered?: SyncFn<string, boolean>;
  children: (slug: string) => ReactNode;
}

export const TokensListView: FC<TokensListViewProps> = ({ slugs, scrollElementId, tokenWillBeRendered, children }) => {
  if (slugs.length === 0) return <EmptyState />;

  return (
    <VirtualList
      items={tokenWillBeRendered ? slugs.filter(tokenWillBeRendered) : slugs}
      itemHeight={itemHeight}
      itemKey={itemKey}
      renderItem={children}
      scrollElementId={scrollElementId}
    />
  );
};
