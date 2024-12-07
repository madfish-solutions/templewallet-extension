import React, { memo, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';

import { TOKEN_FALLBACK_ICON_SRC, TOKENS_ICONS_SRC } from 'lib/icons';

interface Props {
  src: string;
  code: string;
  alt?: string;
  className?: string;
}

export const CurrencyIcon = memo<Props>(({ src, code, alt, className }) => {
  const [isFailed, setIsFailed] = useState(false);

  const localSrc = useMemo(() => {
    if (isFailed) return TOKEN_FALLBACK_ICON_SRC;
    if (code === 'XTZ') return TOKENS_ICONS_SRC.TEZ;

    return src;
  }, [code, isFailed, src]);

  const handleError = useCallback(() => setIsFailed(true), []);

  return (
    <div className="flex justify-center items-center w-10 h-10">
      <img src={localSrc} alt={alt} className={clsx('rounded-full w-9 h-9', className)} onError={handleError} />
    </div>
  );
});
