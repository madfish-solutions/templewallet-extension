import React, { FC } from 'react';

import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import { emptyFn } from 'app/utils/function.utils';

interface Props {
  uri: string;
  onLoad?: EmptyFn;
  onError?: EmptyFn;
}

export const SimpleModelViewer: FC<Props> = ({ uri, onLoad = emptyFn, onError = emptyFn }) => {
  const { scene } = useGLTF(uri);

  return (
    <Canvas onLoad={onLoad} onError={onError}>
      <OrbitControls autoRotate />
      <Stage preset="rembrandt" environment="warehouse">
        <primitive object={scene} />
      </Stage>
    </Canvas>
  );
};
