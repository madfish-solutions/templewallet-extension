import { getAssetSymbol as getAssetSymbolFromMeta } from 'lib/metadata';

import { ActivityOperKindEnum } from './types';

export function isTransferActivityOperKind(kind: ActivityOperKindEnum) {
  return (
    kind === ActivityOperKindEnum.transferTo_FromAccount ||
    kind === ActivityOperKindEnum.transferFrom_ToAccount ||
    kind === ActivityOperKindEnum.transferFrom ||
    kind === ActivityOperKindEnum.transferTo
  );
}

export const getAssetSymbol: typeof getAssetSymbolFromMeta = metadata => getAssetSymbolFromMeta(metadata, false, null);
