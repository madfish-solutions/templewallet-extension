import React, { ReactNode, memo } from 'react';

import { T } from 'lib/i18n';

interface ShortenedEntityNameActionTitleProps {
  i18nKeyBase:
    | 'removeNetworkModalTitle'
    | 'confirmDeleteRpcTitle'
    | 'confirmDeleteBlockExplorerTitle'
    | 'editSomeRpc'
    | 'editSomeBlockExplorer';
  entityName: ReactNode;
}

export const ShortenedEntityNameActionTitle = memo<ShortenedEntityNameActionTitleProps>(
  ({ i18nKeyBase, entityName }) => (
    <>
      <span className="whitespace-pre">
        <T id={`${i18nKeyBase}LeftPart`} />
      </span>
      <span className="truncate">{entityName}</span>
      <span className="whitespace-pre">
        <T id={`${i18nKeyBase}RightPart`} />
      </span>
    </>
  )
);
