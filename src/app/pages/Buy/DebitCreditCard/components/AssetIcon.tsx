import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';

import { Flag } from 'app/atoms/Flag';
import { TOKEN_FALLBACK_ICON_SRC, TOKENS_ICONS_SRC } from 'lib/icons';

interface Props {
  src: string;
  code: string;
  useFlagIcon?: boolean;
  rounded?: boolean;
  alt?: string;
}

export const AssetIcon = memo<Props>(({ src, code, useFlagIcon, alt, rounded = true }) => {
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    setIsFailed(false);
  }, [src, code, useFlagIcon]);

  const localSrc = useMemo(() => {
    if (isFailed) return TOKEN_FALLBACK_ICON_SRC;
    if (code === 'XTZ') return TOKENS_ICONS_SRC.TEZ;

    return src;
  }, [code, isFailed, src]);

  const handleError = useCallback(() => setIsFailed(true), []);

  return (
    <div className="flex justify-center items-center w-10 h-10">
      <div
        className={clsx(
          'flex justify-center items-center w-9 h-9',
          rounded && 'rounded-circle',
          useFlagIcon ? ' bg-grey-4' : 'overflow-hidden'
        )}
      >
        {useFlagIcon ? (
          <Flag alt={code} countryCode={getLocaleFromCurrencyCode(code)} />
        ) : (
          <img
            src={localSrc}
            alt={alt}
            className={clsx(rounded ? 'w-10 h-10 object-cover' : 'w-9 h-9')}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
});

const currencyToLocaleMap: Record<string, string> = {
  ANG: 'aw',
  XAF: 'cf',
  XCD: 'ag',
  XOF: 'bj',
  XPF: 'pf'
};

const getLocaleFromCurrencyCode = (code: string) => currencyToLocaleMap[code] ?? code.toLowerCase().slice(0, 2);
