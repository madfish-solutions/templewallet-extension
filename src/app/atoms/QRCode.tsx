import React, { memo, useEffect, useMemo, useRef } from 'react';

import QRCodeStyling from 'qr-code-styling-2';

interface QRCodeProps {
  size: number;
  data: string;
  imageUri?: string;
}

export const QRCode = memo<QRCodeProps>(({ size, data, imageUri }) => {
  const internalSize = size * window.devicePixelRatio;

  const fullProps = useMemo(
    () => ({
      width: internalSize,
      height: internalSize,
      data,
      qrOptions: {
        typeNumber: 0 as const,
        mode: 'Byte' as const,
        errorCorrectionLevel: 'Q' as const
      },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 2 },
      dotsOptions: { type: 'dots' as const, color: '#000000' },
      backgroundOptions: { color: '#ffffff' },
      image: imageUri,
      dotsOptionsHelper: {
        colorType: { single: true, gradient: false },
        gradient: {
          linear: true,
          radial: false,
          color1: '#000000',
          color2: '#000000',
          rotation: '0'
        }
      },
      cornersSquareOptions: { type: 'dot' as const, color: '#000000' },
      cornersSquareOptionsHelper: {
        colorType: { single: true, gradient: false },
        gradient: {
          linear: true,
          radial: false,
          color1: '#000000',
          color2: '#000000',
          rotation: '0'
        }
      },
      cornersDotOptions: { type: 'dot' as const, color: '#000000' },
      cornersDotOptionsHelper: {
        colorType: { single: true, gradient: false },
        gradient: {
          linear: true,
          radial: false,
          color1: '#000000',
          color2: '#000000',
          rotation: '0'
        }
      },
      backgroundOptionsHelper: {
        colorType: { single: true, gradient: false },
        gradient: {
          linear: true,
          radial: false,
          color1: '#ffffff',
          color2: '#ffffff',
          rotation: '0'
        }
      }
    }),
    [data, imageUri, internalSize]
  );
  const styling = useMemo(() => new QRCodeStyling(fullProps), [fullProps]);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      styling.append(canvasRef.current);
    }
  }, [styling]);

  useEffect(() => {
    styling.update(fullProps);
  }, [fullProps, styling]);

  return (
    <div ref={canvasRef} style={{ width: internalSize, height: internalSize, zoom: String(1 / devicePixelRatio) }} />
  );
});
