'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, useGLTF, Center, Environment, Html } from '@react-three/drei';
import { Suspense, useMemo } from 'react';

function CarModel({ url, scale = 0.01 }: { url: string; scale?: number }) {
  const gltf = useGLTF(url, true, true);
  const computedScale = useMemo(() => scale || 0.01, [scale]);
  return (
    <Center>
      <primitive object={gltf.scene} scale={computedScale} />
    </Center>
  );
}

export default function ModelViewer({ url, scale }: { url: string; scale?: number }) {
  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ position: [2.5, 1.5, 4.0], fov: 50 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
        <Suspense fallback={<Html center className="text-slate-300">Loading model…</Html>}>
          <Bounds fit clip observe margin={1.2}>
            <CarModel url={url} scale={scale} />
          </Bounds>
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enableDamping dampingFactor={0.1} minDistance={1} maxDistance={20} />
      </Canvas>
    </div>
  );
}

// Preload hook for GLTF
useGLTF.preload as unknown;
