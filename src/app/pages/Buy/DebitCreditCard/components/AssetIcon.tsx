import React, { memo, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';

import { Flag } from 'app/atoms/Flag';
import { TOKEN_FALLBACK_ICON_SRC, TOKENS_ICONS_SRC } from 'lib/icons';

interface Props {
  src: string;
  code: string;
  useFlagIcon?: boolean;
  alt?: string;
}

export const AssetIcon = memo<Props>(({ src, code, useFlagIcon, alt }) => {
  const [isFailed, setIsFailed] = useState(false);

  const localSrc = useMemo(() => {
    if (isFailed) return TOKEN_FALLBACK_ICON_SRC;
    if (code === 'XTZ') return TOKENS_ICONS_SRC.TEZ;

    return src;
  }, [code, isFailed, src]);

  const handleError = useCallback(() => setIsFailed(true), []);

  return (
    <div className="flex justify-center items-center w-10 h-10">
      <div
        className={classNames(
          'flex justify-center items-center rounded-circle w-9 h-9',
          useFlagIcon ? ' bg-grey-4' : 'overflow-hidden'
        )}
      >
        {useFlagIcon ? (
          <Flag alt={code} countryCode={getLocaleFromCurrencyCode(code)} />
        ) : (
          <img src={localSrc} alt={alt} className="w-10 h-10 object-cover" onError={handleError} />
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
