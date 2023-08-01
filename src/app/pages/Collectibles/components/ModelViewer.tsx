import React, { FC, useEffect, useRef } from 'react';

import '@google/model-viewer';
import { AnimationInterface } from '@google/model-viewer/lib/features/animation';
import { AnnotationInterface } from '@google/model-viewer/lib/features/annotation';
import { ARInterface } from '@google/model-viewer/lib/features/ar';
import { ControlsInterface } from '@google/model-viewer/lib/features/controls';
import { EnvironmentInterface } from '@google/model-viewer/lib/features/environment';
import { LoadingInterface } from '@google/model-viewer/lib/features/loading';
import { SceneGraphInterface } from '@google/model-viewer/lib/features/scene-graph';
import { StagingInterface } from '@google/model-viewer/lib/features/staging';
import ModelViewerElementBase from '@google/model-viewer/lib/model-viewer-base';
import classNames from 'clsx';

import { emptyFn } from 'app/utils/function.utils';

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

type ModelViewerType = AnnotationInterface &
  SceneGraphInterface &
  StagingInterface &
  EnvironmentInterface &
  ControlsInterface &
  ARInterface &
  LoadingInterface &
  AnimationInterface &
  ModelViewerElementBase;

export const ModelViewer: FC<Props> = ({ uri, alt, className, onError = emptyFn }) => {
  const modelViewerRef = useRef<ModelViewerType>(null);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;

    if (modelViewer) {
      modelViewer?.addEventListener('error', onError);

      return () => modelViewer?.removeEventListener('error', onError);
    }

    return undefined;
  }, [modelViewerRef.current]);

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
