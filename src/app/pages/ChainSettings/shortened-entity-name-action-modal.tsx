import React, { ReactNode, memo } from 'react';

import { ActionModal, ActionModalProps } from 'app/atoms/action-modal';

import { ShortenedEntityNameActionTitle } from './shortened-entity-name-action-title';

interface ShortenedEntityNameActionModalProps extends Omit<ActionModalProps, 'headerClassName' | 'title'> {
  titleI18nKeyBase: 'removeNetworkModalTitle' | 'confirmDeleteRpcTitle' | 'confirmDeleteBlockExplorerTitle';
  entityName: ReactNode;
}

export const ShortenedEntityNameActionModal = memo<ShortenedEntityNameActionModalProps>(
  ({ titleI18nKeyBase, entityName, ...restProps }) => (
    <ActionModal
      headerClassName="flex justify-center"
      title={<ShortenedEntityNameActionTitle i18nKeyBase={titleI18nKeyBase} entityName={entityName} />}
      {...restProps}
    />
  )
);
