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

  useEffect(() => {
    const root = createRoot(tippyProps.content);
    root.render(content);
  }, [tippyProps.content, content]);

  return useTippy<T>(tippyProps);
};
