import React, { FC, useEffect, useRef } from 'react';

import '@google/model-viewer';
import ModelViewerElementBase from '@google/model-viewer/lib/model-viewer-base';
import { emptyFn } from '@rnw-community/shared';
import classNames from 'clsx';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.AllHTMLAttributes<Partial<globalThis.HTMLElementTagNameMap['model-viewer']>>,
        Partial<globalThis.HTMLElementTagNameMap['model-viewer']>
      >;
    }
  }
}

interface Props {
  uri: string;
  alt?: string;
  className?: string;
  onError?: EmptyFn;
}

export const ModelViewer: FC<Props> = ({ uri, alt, className, onError = emptyFn }) => {
  const modelViewerRef = useRef<ModelViewerElementBase>(null);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;

    if (modelViewer) {
      modelViewer?.addEventListener('error', onError);

      return () => modelViewer?.removeEventListener('error', onError);
    }

    return undefined;
  }, []);

  return (
    <model-viewer
      ref={modelViewerRef}
      src={uri}
      alt={alt}
      auto-rotate={true}
      camera-controls={true}
      autoPlay
      shadow-intensity="1"
      //@ts-ignore
      class={classNames('w-full h-full', className)}
    ></model-viewer>
  );
};
