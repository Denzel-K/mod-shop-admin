'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, useGLTF, Html, ContactShadows, Grid, useProgress, MeshReflectorMaterial, Sky, Lightformer, Environment } from '@react-three/drei';
import { Suspense, useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';

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
    <group position={[0, yOffset, 0]}>
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
  platformStyle,
  groundVariant,
  envMapIntensity,
  envPreset,
  hdriBackground,
  envIntensity,
  autoRotateEnabled,
  autoRotateSpeed,
}: {
  url: string;
  scale?: number;
  platformStyle: PlatformStyle;
  groundVariant: GroundVariant;
  envMapIntensity: number;
  envPreset: EnvPreset;
  hdriBackground: boolean;
  envIntensity: number;
  autoRotateEnabled: boolean;
  autoRotateSpeed: number;
}) {
  const platformRef = useRef<THREE.Group>(null);

  const materialProps = useMemo(() => {
    switch (groundVariant) {
      case 'concrete':
        return { color: '#2a2f36', roughness: 0.9, metalness: 0.05 } as THREE.MeshStandardMaterialParameters;
      case 'asphalt':
        return { color: '#24282e', roughness: 0.94, metalness: 0.03 };
      case 'carpet':
        return { color: '#2b2f36', roughness: 0.96, metalness: 0.02 };
      case 'studio':
        return { color: '#1a1f24', roughness: 0.55, metalness: 0.22 };
      default:
        return { color: '#1f2937', roughness: 0.88, metalness: 0.18 };
    }
  }, [groundVariant]);

  const ambientIntensity = useMemo(() => {
    // Drive overall scene brightness from envIntensity without relying on Environment.intensity
    // Keeps values within a sensible range
    return Math.min(0.2 + 0.4 * envIntensity, 1.0);
  }, [envIntensity]);

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
      {/* Background and subtle depth fog */}
      <color attach="background" args={[hdriBackground ? '#05070d' : '#05070d']} />
      <fog attach="fog" args={[ '#0b1220', 30, 90 ]} />

      {/* Lighting: ambient + a couple of point lights */}
      <ambientLight intensity={ambientIntensity} />
      <pointLight position={[6, 6, 6]} intensity={0.9} castShadow distance={30} decay={2} />
      <pointLight position={[-6, 3, -4]} intensity={0.6} distance={25} decay={2} />
      {/* Gentle rim light with shadows */}
      <directionalLight position={[-5, 8, 2]} intensity={0.7} castShadow />

      <Suspense fallback={<Loader />}>
        <Bounds fit clip observe margin={1.2}>
          <CarModel url={url} scale={scale} envMapIntensity={envMapIntensity} />
        </Bounds>
        {/* Capability-checked environment: HDRI preset when supported, fallback otherwise, with slow rotation */}
        <SafeEnvironment preset={envPreset} background={hdriBackground} intensity={envIntensity} rotate />
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
                roughness={0.35}
                depthScale={0.5}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#1a1f24"
                metalness={0.35}
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
  platformStyle = 'circle',
  groundVariant = 'plain',
  envPreset = 'city',
  hdriBackground = false,
  envIntensity = 1.25,
  envMapIntensity = 1.6,
  autoRotateEnabled = true,
  autoRotateSpeed = 0.52,
}: {
  url: string;
  scale?: number;
  platformStyle?: PlatformStyle;
  groundVariant?: GroundVariant;
  envPreset?: EnvPreset;
  hdriBackground?: boolean;
  envIntensity?: number;
  envMapIntensity?: number;
  autoRotateEnabled?: boolean;
  autoRotateSpeed?: number;
}) {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [2.5, 1.6, 4.0], fov: 50 }}
        dpr={[1, 2]}
        shadows
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: false,
        }}
      >
        <Scene
          url={url}
          scale={scale}
          platformStyle={platformStyle}
          groundVariant={groundVariant}
          envPreset={envPreset}
          hdriBackground={hdriBackground}
          envIntensity={envIntensity}
          envMapIntensity={envMapIntensity}
          autoRotateEnabled={autoRotateEnabled}
          autoRotateSpeed={autoRotateSpeed}
        />
      </Canvas>
    </div>
  );
}

// Capability-checked environment: HDRI presets when supported, fallback otherwise
function SafeEnvironment({ preset, background, intensity, rotate }: { preset: EnvPreset; background: boolean; intensity: number; rotate?: boolean }) {
  const { gl, scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!rotate) return;
    if (groupRef.current) groupRef.current.rotation.y += 0.002; // gentle, subtle rotation
  });

  const isWebGL2 = gl.capabilities.isWebGL2;
  const ctx = gl.getContext();
  const supportsFloat = !!ctx.getExtension('OES_texture_float');
  const supportsFloatLinear = !!ctx.getExtension('OES_texture_float_linear');
  const supportsHDR = isWebGL2 || (supportsFloat && supportsFloatLinear);

  if (!supportsHDR) {
    // Fallback: physically-correct sky + studio lightformers
    scene.background = background ? new THREE.Color('#000000') : scene.background;
    return (
      <group ref={groupRef}>
        <Sky distance={450000} sunPosition={[2, 2, 1]} inclination={0.52} azimuth={0.18} mieCoefficient={0.01} mieDirectionalG={0.9} rayleigh={1.0} turbidity={2} />
        <ambientLight intensity={0.45 * intensity} />
        <group position={[0, 5, 0]}>
          <Lightformer intensity={1.6 * intensity} color={0xffffff} form="rect" position={[0, 2, 10]} scale={[10, 5, 1]} />
          <Lightformer intensity={1.0 * intensity} color={0xffffff} form="rect" position={[5, 3, -8]} rotation={[0, Math.PI / 4, 0]} scale={[6, 3, 1]} />
          <Lightformer intensity={1.0 * intensity} color={0xffffff} form="rect" position={[-5, 3, -8]} rotation={[0, -Math.PI / 4, 0]} scale={[6, 3, 1]} />
        </group>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <Environment preset={preset} background={background} blur={background ? 0 : 0.2} />
    </group>
  );
}
