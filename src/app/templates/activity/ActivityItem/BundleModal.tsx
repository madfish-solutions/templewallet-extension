import React, { FC, useCallback, useMemo, useState } from 'react';

import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/ScrollView';
import { SimpleInfiniteScroll } from 'app/atoms/SimpleInfiniteScroll';
import { StyledButtonAnchor } from 'app/atoms/StyledButton';
import { T, formatDate } from 'lib/i18n';

interface Props {
  addedAt: string;
  blockExplorerUrl?: string;
  children: React.ReactElement[];
}

const CHUNK_SIZE = 20;
const SCROLLABLE_ELEM_ID = 'ACTIVITY_BUNDLE_MODAL_SCROLL';

export const BundleModalContent: FC<Props> = ({ addedAt, blockExplorerUrl, children: items }) => {
  const title = useMemo(() => formatDate(addedAt, 'PP'), [addedAt]);

  const [slicedItems, setSlicedItems] = useState(() => items.slice(0, CHUNK_SIZE));

  const loadNext = useCallback(() => {
    if (slicedItems.length === items.length) return;

    setSlicedItems(items.slice(0, slicedItems.length + CHUNK_SIZE));
  }, [slicedItems.length, items]);

  return (
    <>
      <ScrollView id={SCROLLABLE_ELEM_ID} className="p-4 pb-15">
        <SimpleInfiniteScroll loadNext={loadNext} scrollableTargetId={SCROLLABLE_ELEM_ID}>
          <div className="mb-1 p-1 text-font-description-bold">{title}</div>

          {slicedItems}
        </SimpleInfiniteScroll>
      </ScrollView>

      <ActionsButtonsBox>
        <StyledButtonAnchor href={blockExplorerUrl} size="L" color="primary" disabled={!blockExplorerUrl}>
          <T id="viewOnExplorer" />
        </StyledButtonAnchor>
      </ActionsButtonsBox>
    </>
  );
};
