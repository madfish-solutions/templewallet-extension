import React, { FC, useMemo } from 'react';

import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/ScrollView';
import { StyledButtonAnchor } from 'app/atoms/StyledButton';
import { T, formatDate } from 'lib/i18n';

interface Props extends PropsWithChildren {
  addedAt: string;
  blockExplorerUrl?: string;
}

export const BundleModalContent: FC<Props> = ({ addedAt, blockExplorerUrl, children }) => {
  const title = useMemo(() => formatDate(addedAt, 'PP'), [addedAt]);

  return (
    <>
      <ScrollView className="p-4 pb-15">
        <div className="mb-1 p-1 text-font-description-bold">{title}</div>

        {children}
      </ScrollView>

      <ActionsButtonsBox>
        <StyledButtonAnchor href={blockExplorerUrl} size="L" color="primary" disabled={!blockExplorerUrl}>
          <T id="viewOnExplorer" />
        </StyledButtonAnchor>
      </ActionsButtonsBox>
    </>
  );
};
