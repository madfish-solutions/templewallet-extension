import { createContext, RefObject, useContext } from 'react';

export const ContentPaperRefContext = createContext<RefObject<HTMLDivElement>>({
  current: null
});

export const useContentPaperRef = () => useContext(ContentPaperRefContext);
