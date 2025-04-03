import React, { FC, useState } from 'react';

import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { ActionsButtonsBoxProps } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView, ScrollViewProps } from 'app/atoms/PageModal/scroll-view';

interface PageModalScrollViewWithActionsProps
  extends Omit<ScrollViewProps, 'onBottomEdgeVisibilityChange' | 'onTopEdgeVisibilityChange'> {
  actionsBoxProps?: Omit<ActionsButtonsBoxProps, 'shouldCastShadow'>;
  initialBottomEdgeVisible?: boolean;
}

const DEFAULT_ACTIONS_BOX_PROPS: Omit<ActionsButtonsBoxProps, 'shouldCastShadow'> = {};

export const PageModalScrollViewWithActions: FC<PageModalScrollViewWithActionsProps> = ({
  actionsBoxProps = DEFAULT_ACTIONS_BOX_PROPS,
  initialBottomEdgeVisible = true,
  ...restProps
}) => {
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(initialBottomEdgeVisible);

  return (
    <>
      <ScrollView onBottomEdgeVisibilityChange={setBottomEdgeIsVisible} {...restProps} />

      <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible} {...actionsBoxProps} />
    </>
  );
};
