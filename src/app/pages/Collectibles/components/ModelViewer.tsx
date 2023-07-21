import React, { FC, Suspense } from 'react';

import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import { emptyFn } from 'app/utils/function.utils';

interface Props {
  uri: string;
  loader?: React.ReactElement;
  onError?: EmptyFn;
}

export const ModelViewer: FC<Props> = ({ uri, loader, onError = emptyFn }) => (
  <Suspense fallback={loader}>
    <Canvas onError={onError}>
      <OrbitControls autoRotate />
      <Stage preset="rembrandt" environment="warehouse">
        <Model uri={uri} />
      </Stage>
    </Canvas>
  </Suspense>
);

interface ModelProps {
  uri: string;
}

const Model: FC<ModelProps> = ({ uri }) => {
  const { scene } = useGLTF(uri);

  return <primitive object={scene} />;
};
