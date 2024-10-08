import React, { FC } from 'react';

import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/ScrollView';
import { StyledButtonAnchor } from 'app/atoms/StyledButton';
import { T } from 'lib/i18n';

interface Props extends PropsWithChildren {
  blockExplorerUrl?: string;
}

export const BundleModalContent: FC<Props> = ({ blockExplorerUrl, children }) => {
  return (
    <>
      <ScrollView className="p-4 pb-15">{children}</ScrollView>

      <ActionsButtonsBox>
        <StyledButtonAnchor href={blockExplorerUrl} size="L" color="primary" disabled={!blockExplorerUrl}>
          <T id="viewOnExplorer" />
        </StyledButtonAnchor>
      </ActionsButtonsBox>
    </>
  );
};
