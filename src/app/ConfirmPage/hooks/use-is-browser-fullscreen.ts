import { useEffect, useState } from 'react';

const getIsFullscreen = () => window.innerWidth === screen.width;

export const useIsBrowserFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(getIsFullscreen);

  useEffect(() => {
    const handleResize = () => {
      setIsFullscreen(getIsFullscreen());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isFullscreen;
};
