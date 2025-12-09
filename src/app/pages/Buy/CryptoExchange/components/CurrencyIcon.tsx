import React, { memo, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';

import { TOKEN_FALLBACK_ICON_SRC, TOKENS_ICONS_SRC } from 'lib/icons';

interface Props {
  src: string;
  code: string;
  size?: number;
  alt?: string;
  className?: string;
}

export const CurrencyIcon = memo<Props>(({ src, code, size = 40, alt, className }) => {
  const [isFailed, setIsFailed] = useState(false);

  const localSrc = useMemo(() => {
    if (isFailed) return TOKEN_FALLBACK_ICON_SRC;
    if (code === 'XTZ') return TOKENS_ICONS_SRC.TEZ;

    return src;
  }, [code, isFailed, src]);

  const handleError = useCallback(() => setIsFailed(true), []);

  return (
    <div className="flex justify-center items-center" style={{ width: size, height: size }}>
      <img
        src={localSrc}
        alt={alt}
        className={clsx('rounded-full w-full h-auto p-0.5', className)}
        onError={handleError}
      />
    </div>
  );
});
