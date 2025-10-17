'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, useGLTF, Html, ContactShadows, Grid, useProgress, MeshReflectorMaterial, Sky, Lightformer, Environment, useTexture } from '@react-three/drei';
import { Suspense, useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer as ThreeEffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { WrapConfiguration, WrapColor, WrapFinish } from '@/types/wrap';
import type { GLTF } from 'three-stdlib';

type EnvMapMat = THREE.Material & { envMapIntensity?: number };

interface CarModelProps {
  url: string;
  scale?: number;
  envMapIntensity?: number;
  wrapConfig: WrapConfiguration;
  wrapColors: WrapColor[];
  wrapFinishes: WrapFinish[];
  selectedSurfaces: string[];
  highlightMode: boolean;
  onSurfaceClick?: (surfaceId: string) => void;
}

// Removed TextureLoader component; loading textures directly inside CarModelWithTexture

function CarModel({ 
  url, 
  scale = 0.01, 
  envMapIntensity = 1.0, 
  wrapConfig, 
  wrapColors, 
  wrapFinishes,
  selectedSurfaces,
  highlightMode,
  onSurfaceClick 
}: CarModelProps) {
  const gltf = useGLTF(url, true, true);
  const computedScale = useMemo(() => scale || 0.01, [scale]);
  const materialCache = useRef<Map<string, THREE.Material>>(new Map());

  // Clear material cache when URL changes to prevent cross-model contamination
  useLayoutEffect(() => {
    materialCache.current.clear();
  }, [url]);

  return (
    <CarModelWithTexture
      gltf={gltf}
      computedScale={computedScale}
      materialCache={materialCache}
      envMapIntensity={envMapIntensity}
      wrapConfig={wrapConfig}
      wrapColors={wrapColors}
      wrapFinishes={wrapFinishes}
      selectedSurfaces={selectedSurfaces}
      highlightMode={highlightMode}
      onSurfaceClick={onSurfaceClick}
    />
  );
}

function CarModelWithTexture({
  gltf,
  computedScale,
  materialCache,
  envMapIntensity,
  wrapConfig,
  wrapColors,
  wrapFinishes,
  selectedSurfaces,
  highlightMode,
  onSurfaceClick
}: {
  gltf: GLTF;
  computedScale: number;
  materialCache: React.RefObject<Map<string, THREE.Material>>;
  envMapIntensity: number;
  wrapConfig: WrapConfiguration;
  wrapColors: WrapColor[];
  wrapFinishes: WrapFinish[];
  selectedSurfaces: string[];
  highlightMode: boolean;
  onSurfaceClick?: (surfaceId: string) => void;
}) {
  // Load vinyl texture here to avoid cross-component state updates during render
  const vinylTexture = useTexture('/textures/vinyl-tablecloth_albedo.png');
  useLayoutEffect(() => {
    if (vinylTexture) {
      vinylTexture.wrapS = vinylTexture.wrapT = THREE.RepeatWrapping;
      vinylTexture.repeat.set(4, 4);
    }
  }, [vinylTexture]);
  // No separate highlight material; use emissive overlay on existing materials
  // Apply wrap materials to surfaces
  useLayoutEffect(() => {
    gltf.scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Set up click handling for surface selection
        mesh.userData.surfaceId = obj.name;
        
        // Check if this surface has a wrap configuration
        // obj.name contains the technical surface identifier
        const surfaceConfig = wrapConfig.surfaces[obj.name];
        
        if (surfaceConfig) {
          const color = wrapColors.find(c => c.id === surfaceConfig.colorId);
          const finish = wrapFinishes.find(f => f.id === surfaceConfig.finishId);
          
          if (color && finish) {
            // Create or get cached material
            const materialKey = `${surfaceConfig.colorId}_${surfaceConfig.finishId}`;
            let material = materialCache.current.get(materialKey);
            
            if (!material) {
              material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color.hex),
                roughness: finish.materialProperties.roughness,
                metalness: finish.materialProperties.metalness,
                envMapIntensity: envMapIntensity,
                map: vinylTexture ? vinylTexture.clone() : undefined,
              });
              
              // Apply clearcoat if specified
              if (finish.materialProperties.clearcoat !== undefined) {
                (material as THREE.MeshPhysicalMaterial).clearcoat = finish.materialProperties.clearcoat;
                (material as THREE.MeshPhysicalMaterial).clearcoatRoughness = finish.materialProperties.clearcoatRoughness || 0.1;
              }
              
              // Apply normal map if texture is specified
              if (finish.textureUrl) {
                // Load normal map texture (would need to be implemented)
                // material.normalMap = normalTexture;
                // material.normalScale = new THREE.Vector2(finish.materialProperties.normalScale || 1, finish.materialProperties.normalScale || 1);
              }
              
              materialCache.current.set(materialKey, material);
            }
            
            mesh.material = material;
          }
        } else {
          // Apply default material properties for non-wrapped surfaces
          const mat = mesh.material as EnvMapMat | EnvMapMat[];
          if (Array.isArray(mat)) {
            mat.forEach((m) => {
              if (typeof m.envMapIntensity === 'number') m.envMapIntensity = envMapIntensity;
            });
          } else if (mat && typeof mat.envMapIntensity === 'number') {
            mat.envMapIntensity = envMapIntensity;
          }
        }
        
        // Apply highlight effect using emissive overlay per mesh.
        // Back up per material (uuid) and restore exactly to avoid sticky highlights.
        const isSelectedForHighlight = highlightMode && selectedSurfaces.includes(obj.name);
        const applyEmissiveToMaterial = (m: THREE.Material, color: THREE.Color, intensity: number) => {
          const mat = m as THREE.MeshStandardMaterial;
          if (!('emissive' in mat)) return;
          if (mat.emissive && typeof (mat.emissive).copy === 'function') {
            (mat.emissive).copy(color);
          } else {
            (mat).emissive = color.clone();
          }
          (mat).emissiveIntensity = intensity;
          (mat).needsUpdate = true;
        };
        if (isSelectedForHighlight) {
          // Ensure per-material backup map exists
          if (!mesh.userData._emissiveBackupMap) {
            mesh.userData._emissiveBackupMap = {} as Record<string, { emissiveHex: number; emissiveIntensity: number }>;
          }
          const hiColor = new THREE.Color(0x00ffff);
          const hiIntensity = 0.6;
          const backupMap: Record<string, { emissiveHex: number; emissiveIntensity: number }> = mesh.userData._emissiveBackupMap;
          const backupAndApply = (m: THREE.Material) => {
            const mat = m as THREE.MeshStandardMaterial & { uuid: string };
            const key = (mat).uuid as string;
            if (key && !backupMap[key]) {
              const baseEmissive = mat?.emissive instanceof THREE.Color ? mat.emissive : new THREE.Color((mat)?.emissive ?? 0x000000);
              backupMap[key] = {
                emissiveHex: baseEmissive.getHex(),
                emissiveIntensity: (mat)?.emissiveIntensity ?? 1,
              };
            }
            applyEmissiveToMaterial(m, hiColor, hiIntensity);
          };
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => backupAndApply(m));
          } else if (mesh.material) {
            backupAndApply(mesh.material);
          }
        } else if (mesh.userData._emissiveBackupMap) {
          // Restore each material from its own backup, then delete the map
          const backupMap: Record<string, { emissiveHex: number; emissiveIntensity: number }> = mesh.userData._emissiveBackupMap;
          const restoreOne = (m: THREE.Material) => {
            const mat = m as THREE.MeshStandardMaterial & { uuid: string };
            const key = (mat).uuid as string;
            const b = key ? backupMap[key] : undefined;
            const restoreColor = new THREE.Color(b?.emissiveHex ?? 0x000000);
            const restoreIntensity = b?.emissiveIntensity ?? 1;
            applyEmissiveToMaterial(m, restoreColor, restoreIntensity);
          };
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => restoreOne(m));
          } else if (mesh.material) {
            restoreOne(mesh.material);
          }
          delete mesh.userData._emissiveBackupMap;
        }
      }
    });
  }, [gltf.scene, envMapIntensity, wrapConfig, wrapColors, wrapFinishes, selectedSurfaces, highlightMode, vinylTexture, materialCache]);

  // Compute vertical offset so the model sits on the floor (y = 0)
  // Include URL in dependencies to recalculate positioning for each model
  const yOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const minY = box.min.y;
    return -minY * (computedScale ?? 1);
  }, [computedScale, gltf]);

  // Handle click events for surface selection
  const handleClick = (event: { stopPropagation: () => void; object: { userData: { surfaceId?: string } } }) => {
    event.stopPropagation();
    const surfaceId = event.object?.userData?.surfaceId;
    if (surfaceId && onSurfaceClick) {
      // surfaceId is the technical identifier from the 3D model
      onSurfaceClick(surfaceId);
    }
  };

  return (
    <group position={[0, yOffset, 0]} onClick={handleClick}>
      <primitive object={gltf.scene} scale={computedScale} />
    </group>
  );
}

function Loader() {
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

interface SceneProps {
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
  wrapConfig: WrapConfiguration;
  wrapColors: WrapColor[];
  wrapFinishes: WrapFinish[];
  selectedSurfaces: string[];
  highlightMode: boolean;
  onSurfaceClick?: (surfaceId: string) => void;
}

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
  wrapConfig,
  wrapColors,
  wrapFinishes,
  selectedSurfaces,
  highlightMode,
  onSurfaceClick,
}: SceneProps) {
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
      <color attach="background" args={[hdriBackground ? '#05070d' : '#05070d']} />
      <fog attach="fog" args={[ '#0b1220', 30, 90 ]} />

      <ambientLight intensity={ambientIntensity} />
      <pointLight position={[6, 6, 6]} intensity={0.9} castShadow distance={30} decay={2} />
      <pointLight position={[-6, 3, -4]} intensity={0.6} distance={25} decay={2} />
      <directionalLight position={[-5, 8, 2]} intensity={0.7} castShadow />

      <Suspense fallback={<Loader />}>
        <Bounds fit clip observe margin={1.2}>
          <CarModel 
            url={url} 
            scale={scale} 
            envMapIntensity={envMapIntensity}
            wrapConfig={wrapConfig}
            wrapColors={wrapColors}
            wrapFinishes={wrapFinishes}
            selectedSurfaces={selectedSurfaces}
            highlightMode={highlightMode}
            onSurfaceClick={onSurfaceClick}
          />
        </Bounds>
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
        <ContactShadows position={[0, 0.001, 0]} opacity={0.65} scale={22} blur={2.8} far={22} resolution={1024} frames={1} />
      </Suspense>
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={20}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={autoRotateEnabled}
        autoRotateSpeed={autoRotateSpeed}
      />
    </>
  );
}

interface EnhancedModelViewerProps {
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
  wrapConfig: WrapConfiguration;
  wrapColors: WrapColor[];
  wrapFinishes: WrapFinish[];
  selectedSurfaces: string[];
  highlightMode: boolean;
  onSurfaceClick?: (surfaceId: string) => void;
}

export default function EnhancedModelViewer({
  url,
  scale,
  platformStyle = 'circle',
  groundVariant = 'plain',
  envPreset = 'city',
  hdriBackground = false,
  envIntensity = 1.25,
  envMapIntensity = 1.6,
  autoRotateEnabled = true,
  autoRotateSpeed = 0.72,
  wrapConfig,
  wrapColors,
  wrapFinishes,
  selectedSurfaces,
  highlightMode,
  onSurfaceClick,
}: EnhancedModelViewerProps) {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [2.5, 1.6, 4.0], fov: 50 }}
        dpr={[1, 1.5]}
        shadows
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }}
      >
        <GLContextGuard />
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
          wrapConfig={wrapConfig}
          wrapColors={wrapColors}
          wrapFinishes={wrapFinishes}
          selectedSurfaces={selectedSurfaces}
          highlightMode={highlightMode}
          onSurfaceClick={onSurfaceClick}
        />
        {/* Post-processing antialiasing: prefer SMAA, fallback to FXAA */}
        <PostAA />
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
    if (groupRef.current) groupRef.current.rotation.y += 0.002;
  });

  // Stricter HDR/PMREM capability detection to avoid shader validation failures on some Chromium/ANGLE paths
  const isWebGL2 = gl.capabilities.isWebGL2;
  const ctx = gl.getContext();
  const extFloat = !!ctx.getExtension('OES_texture_float');
  const extFloatLinear = !!ctx.getExtension('OES_texture_float_linear');
  const extColorBufFloat = !!ctx.getExtension('EXT_color_buffer_float') || !!ctx.getExtension('WEBGL_color_buffer_float');
  const extColorBufHalfFloat = !!ctx.getExtension('EXT_color_buffer_half_float');
  const hdrWebGL1 = extFloat && extFloatLinear && (extColorBufFloat || extColorBufHalfFloat);
  const hdrWebGL2 = isWebGL2 && (extColorBufFloat || extColorBufHalfFloat);
  // Additional hardening: Chromium-based browsers (Brave/Chrome/Edge) can still fail PMREM shader validation.
  // Prefer safe fallback on Chromium to avoid context loss and VALIDATE_STATUS errors.
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isChromiumFamily = /Chrome|Chromium|Edg|Brave/i.test(ua) && !/Firefox/i.test(ua);
  const supportsHDR = (hdrWebGL1 || hdrWebGL2) && !isChromiumFamily;

  if (!supportsHDR) {
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

// Attach WebGL context lost/restored handlers to make behavior predictable on Chromium when memory limits are hit
function GLContextGuard() {
  const { gl } = useThree();
  useLayoutEffect(() => {
    const el = gl.domElement as HTMLCanvasElement;
    const onLost = (e: Event) => {
      // Prevent default to allow manual restore
      e.preventDefault();
      // Could pause animations or show UI notice here
    };
    const onRestored = () => {
      // Could re-init resources if needed
    };
    el.addEventListener('webglcontextlost', onLost as EventListener, false);
    el.addEventListener('webglcontextrestored', onRestored as EventListener, false);
    return () => {
      el.removeEventListener('webglcontextlost', onLost as EventListener, false);
      el.removeEventListener('webglcontextrestored', onRestored as EventListener, false);
    };
  }, [gl]);
  return null;
}

// Choose SMAA when WebGL2 is available, otherwise fallback to FXAA
function PostAA() {
  const { gl, size, scene, camera } = useThree();
  const composerRef = useRef<ThreeEffectComposer | null>(null);
  const fxaaRef = useRef<ShaderPass | null>(null);
  const smaaRef = useRef<SMAAPass | null>(null);

  // Initialize composer and passes (rebuild on size changes)
  useLayoutEffect(() => {
    const composer = new ThreeEffectComposer(gl);
    composerRef.current = composer;
    // First pass renders the scene
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const isWebGL2 = gl.capabilities.isWebGL2;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.floor(size.width * pixelRatio);
    const height = Math.floor(size.height * pixelRatio);

    if (isWebGL2) {
      const smaa = new SMAAPass();
      // Set target size for SMAA after construction
      smaa.setSize(width, height);
      smaaRef.current = smaa;
      composer.addPass(smaa);
    } else {
      const fxaa = new ShaderPass(FXAAShader);
      fxaaRef.current = fxaa;
      fxaa.material.uniforms['resolution'].value.set(1 / width, 1 / height);
      composer.addPass(fxaa);
    }

    return () => {
      composer.dispose();
      composerRef.current = null;
      smaaRef.current = null;
      fxaaRef.current = null;
    };
  }, [gl, scene, camera, size.width, size.height]);

  // Render composer each frame (after the default render)
  useFrame(() => {
    const composer = composerRef.current;
    if (composer) composer.render();
  }, 1);

  return null;
}
