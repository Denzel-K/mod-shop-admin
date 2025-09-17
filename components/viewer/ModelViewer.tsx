'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, useGLTF, Environment, Html, ContactShadows, Grid, useProgress, MeshReflectorMaterial } from '@react-three/drei';
import { Suspense, useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

type EnvMapMat = THREE.Material & { envMapIntensity?: number };

function CarModel({ url, scale = 0.01, envMapIntensity = 1.0 }: { url: string; scale?: number; envMapIntensity?: number }) {
  const gltf = useGLTF(url, true, true);
  const computedScale = useMemo(() => scale || 0.01, [scale]);

  // Ensure meshes cast/receive shadows
  useLayoutEffect(() => {
    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material as EnvMapMat | EnvMapMat[];
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            if (typeof m.envMapIntensity === 'number') m.envMapIntensity = envMapIntensity;
          });
        } else if (mat && typeof mat.envMapIntensity === 'number') {
          mat.envMapIntensity = envMapIntensity;
        }
      }
    });
  }, [gltf.scene, envMapIntensity]);

  // Compute vertical offset so the model sits on the floor (y = 0)
  const yOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const minY = box.min.y;
    // After scaling, the offset must be scaled too
    return -minY * (computedScale ?? 1);
  }, [gltf.scene, computedScale]);

  return (
    <group position-y={yOffset}>
      <primitive object={gltf.scene} scale={computedScale} />
    </group>
  );
}

function Loader() {
  // Enhanced loading overlay with progress from drei's useProgress
  const { progress, active, item } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 text-slate-200">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg className="w-6 h-6 animate-spin [animation-duration:2s] text-cyan-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.64 5.64l-1.41-1.41M19.78 19.78l-1.41-1.41M5.64 18.36l-1.41 1.41M19.78 4.22l-1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="w-56 h-2 bg-slate-800 rounded overflow-hidden">
          <div className="h-full bg-cyan-500 transition-[width] duration-300" style={{ width: `${Math.round(progress)}%` }} />
        </div>
        <div className="text-xs text-slate-400">{Math.round(progress)}% {active ? 'Loading…' : 'Preparing scene…'}</div>
        {item ? <div className="text-[10px] text-slate-500 max-w-64 truncate">{String(item)}</div> : null}
      </div>
    </Html>
  );
}

type EnvPreset = 'city' | 'studio' | 'sunset' | 'dawn' | 'warehouse' | 'apartment' | 'night' | 'forest' | 'park' | 'lobby';
type PlatformStyle = 'circle' | 'rounded' | 'grid';
type GroundVariant = 'plain' | 'concrete' | 'asphalt' | 'carpet' | 'studio';

function Scene({
  url,
  scale,
  envPreset,
  platformStyle,
  groundVariant,
  hdriBackground,
  envMapIntensity,
  autoRotateEnabled,
  autoRotateSpeed,
}: {
  url: string;
  scale?: number;
  envPreset: EnvPreset;
  platformStyle: PlatformStyle;
  groundVariant: GroundVariant;
  hdriBackground: boolean;
  envMapIntensity: number;
  autoRotateEnabled: boolean;
  autoRotateSpeed: number;
}) {
  const platformRef = useRef<THREE.Group>(null);

  const materialProps = useMemo(() => {
    switch (groundVariant) {
      case 'concrete':
        return { color: '#1a1a1a', roughness: 0.95, metalness: 0.0 } as THREE.MeshStandardMaterialParameters;
      case 'asphalt':
        return { color: '#0f0f0f', roughness: 0.98, metalness: 0.0 };
      case 'carpet':
        return { color: '#121212', roughness: 1.0, metalness: 0.0 };
      case 'studio':
        return { color: '#101010', roughness: 0.6, metalness: 0.2 };
      default:
        return { color: '#111111', roughness: 0.9, metalness: 0.2 };
    }
  }, [groundVariant]);

  function RoundedRect({ width = 16, height = 10, radius = 1 }: { width?: number; height?: number; radius?: number }) {
    const shape = useMemo(() => {
      const s = new THREE.Shape();
      const w = width, h = height, r = radius;
      s.moveTo(-w / 2 + r, -h / 2);
      s.lineTo(w / 2 - r, -h / 2);
      s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      s.lineTo(w / 2, h / 2 - r);
      s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      s.lineTo(-w / 2 + r, h / 2);
      s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      s.lineTo(-w / 2, -h / 2 + r);
      s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      s.closePath();
      return s;
    }, [width, height, radius]);
    return (
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <shapeGeometry args={[shape, 64]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    );
  }

  return (
    <>
      {/* Black background */}
      <color attach="background" args={["#000000"]} />

      {/* Lighting: soft ambient + a couple of point lights */}
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 6, 6]} intensity={1.2} castShadow distance={30} decay={2} />
      <pointLight position={[-6, 3, -4]} intensity={0.6} distance={25} decay={2} />
      {/* Gentle rim light */}
      <directionalLight position={[-5, 8, 2]} intensity={0.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      <Suspense fallback={<Loader />}>
        <Bounds fit clip observe margin={1.2}>
          <CarModel url={url} scale={scale} envMapIntensity={envMapIntensity} />
        </Bounds>
        {/* Reflections without affecting background */}
        <Environment preset={envPreset} background={hdriBackground} blur={hdriBackground ? 0 : 0.25} />
        {/* Floor / platform variants */}
        <group ref={platformRef}>
          {platformStyle === 'circle' && (
            <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
              <circleGeometry args={[10, 64]} />
              <meshStandardMaterial {...materialProps} />
            </mesh>
          )}
          {platformStyle === 'rounded' && <RoundedRect />}
          {platformStyle === 'grid' && (
            <group>
              <mesh rotation-x={-Math.PI / 2} position={[0, -0.0005, 0]} receiveShadow>
                <planeGeometry args={[40, 40, 1, 1]} />
                <meshStandardMaterial {...materialProps} />
              </mesh>
              <Grid cellSize={0.5} cellThickness={0.5} sectionSize={4} sectionThickness={1} infiniteGrid fadeDistance={30} fadeStrength={1} position={[0, 0.002, 0]} />
            </group>
          )}
          {groundVariant === 'studio' && (
            <mesh rotation-x={-Math.PI / 2} position={[0, -0.0001, 0]} receiveShadow>
              <planeGeometry args={[40, 40]} />
              <MeshReflectorMaterial
                blur={[300, 30]}
                resolution={1024}
                mixBlur={1}
                mixStrength={6}
                roughness={0.4}
                depthScale={0.5}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#0f0f10"
                metalness={0.4}
              />
            </mesh>
          )}
        </group>
        {/* Soft contact shadows under the car */}
        <ContactShadows position={[0, 0.001, 0]} opacity={0.65} scale={22} blur={2.8} far={22} resolution={1024} frames={1} />
      </Suspense>
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={20}
        // Prevent viewing the underside
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.1}
        // Auto-rotation (toggleable)
        autoRotate={autoRotateEnabled}
        autoRotateSpeed={autoRotateSpeed}
      />
    </>
  );
}

export default function ModelViewer({
  url,
  scale,
  envPreset = 'city',
  platformStyle = 'circle',
  groundVariant = 'plain',
  hdriBackground = false,
  envMapIntensity = 1.6,
  autoRotateEnabled = true,
  autoRotateSpeed = 0.52,
}: {
  url: string;
  scale?: number;
  envPreset?: EnvPreset;
  platformStyle?: PlatformStyle;
  groundVariant?: GroundVariant;
  hdriBackground?: boolean;
  envMapIntensity?: number;
  autoRotateEnabled?: boolean;
  autoRotateSpeed?: number;
}) {
  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ position: [2.5, 1.6, 4.0], fov: 50 }} shadows>
        <Scene
          url={url}
          scale={scale}
          envPreset={envPreset}
          platformStyle={platformStyle}
          groundVariant={groundVariant}
          hdriBackground={hdriBackground}
          envMapIntensity={envMapIntensity}
          autoRotateEnabled={autoRotateEnabled}
          autoRotateSpeed={autoRotateSpeed}
        />
      </Canvas>
    </div>
  );
}

//

