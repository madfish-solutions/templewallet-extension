import { ReactNode, useEffect, useMemo } from 'react';

import { createRoot } from 'react-dom/client';

import useTippy, { UseTippyOptions } from 'lib/ui/useTippy';

export const useRichFormatTooltip = <T extends HTMLElement>(
  props: Omit<UseTippyOptions, 'content'>,
  wrapperFactory: () => HTMLElement,
  content: ReactNode
) => {
  const tippyProps = useMemo(
    () => ({
      ...props,
      content: wrapperFactory()
    }),
    [props, wrapperFactory]
  );
  const root = useMemo(() => createRoot(tippyProps.content), [tippyProps.content]);

  useEffect(() => root.render(content), [root, content]);

  return useTippy<T>(tippyProps);
};
