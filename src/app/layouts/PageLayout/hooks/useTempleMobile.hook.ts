import { useStorage } from '../../../../lib/temple/front';

export const useTempleMobile = () => {
  const [showTempleMobileOverlay, setShowTempleMobileOverlay] = useStorage('show_temple_mobile_overlay', true);
  const [isTempleMobileOverlaySkipped, setIsTempleMobileOverlaySkipped] = useStorage(
    'is_temple_mobile_overlay_skipped',
    true
  );

  return {
    showTempleMobileOverlay,
    setShowTempleMobileOverlay,
    isTempleMobileOverlaySkipped,
    setIsTempleMobileOverlaySkipped
  };
};
