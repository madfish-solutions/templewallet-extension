import { useCallback, useRef } from 'react';

import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';

export const useActivateAnimatedChevron = () => {
  const animatedChevronRef = useRef<AnimatedMenuChevron>(null);
  const handleHover = useCallback(() => void animatedChevronRef.current?.handleHover(), []);
  const handleUnhover = useCallback(() => void animatedChevronRef.current?.handleUnhover(), []);

  return { animatedChevronRef, handleHover, handleUnhover };
};
