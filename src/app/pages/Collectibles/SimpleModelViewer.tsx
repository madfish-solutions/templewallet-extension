import React, { FC } from 'react';

import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
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
    <Canvas camera={{ position: [-10, 0, 15], fov: 18 }} onLoad={onLoad} onError={onError}>
      <OrbitControls autoRotate />
      <primitive object={scene} />
      <Environment preset="warehouse" />
    </Canvas>
  );
};
