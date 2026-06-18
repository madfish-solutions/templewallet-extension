import { FC, useRef } from 'react';

import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { ActionsButtonsBoxProps } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView, ScrollViewProps } from 'app/atoms/PageModal/scroll-view';

interface PageModalScrollViewWithActionsProps extends Omit<ScrollViewProps, 'onBottomEdgeVisibilityChange'> {
  actionsBoxProps?: ActionsButtonsBoxProps;
}

export const PageModalScrollViewWithActions: FC<PageModalScrollViewWithActionsProps> = ({
  actionsBoxProps = {},
  ...restProps
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <ScrollView ref={scrollContainerRef} {...restProps} />

      <ActionsButtonsBox scrollContainerRef={scrollContainerRef} {...actionsBoxProps} />
    </>
  );
};
