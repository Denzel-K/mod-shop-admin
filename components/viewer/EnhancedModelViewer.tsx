'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, useGLTF, ContactShadows, useProgress, Sky, Environment, Text, useTexture, Html, Lightformer } from '@react-three/drei';
import { Suspense, useMemo, useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer as ThreeEffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { WrapConfiguration, WrapColor, WrapFinish } from '@/types/wrap';
import type { GLTF, OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ENVIRONMENT_PRESETS } from '@/lib/viewer/environment';
import type { EnvPreset } from '@/lib/viewer/environment';
import { useEnvPresets } from '@/lib/viewer/useEnvPresets';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

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
  const finishTextureCache = useRef<Map<string, {
    albedoGray?: THREE.Texture | null;
    normal?: THREE.Texture | null;
    roughness?: THREE.Texture | null;
    metalness?: THREE.Texture | null;
    ao?: THREE.Texture | null;
    orm?: THREE.Texture | null;
  }>>(new Map());

  // Clear material cache when URL changes to prevent cross-model contamination
  useLayoutEffect(() => {
    materialCache.current.clear();
  }, [url]);

  return (
    <CarModelWithTexture
      gltf={gltf as GLTF}
      computedScale={computedScale}
      materialCache={materialCache}
      finishTextureCache={finishTextureCache}
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
  finishTextureCache,
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
  finishTextureCache: React.RefObject<Map<string, {
    albedoGray?: THREE.Texture | null;
    normal?: THREE.Texture | null;
    roughness?: THREE.Texture | null;
    metalness?: THREE.Texture | null;
    ao?: THREE.Texture | null;
    orm?: THREE.Texture | null;
  }>>;
  envMapIntensity: number;
  wrapConfig: WrapConfiguration;
  wrapColors: WrapColor[];
  wrapFinishes: WrapFinish[];
  selectedSurfaces: string[];
  highlightMode: boolean;
  onSurfaceClick?: (surfaceId: string) => void;
}) {
  // No default albedo texture; use per-finish albedoGray when provided
  
  // Helper to load textures with sane defaults
  const loadTexture = (url: string, isColor: boolean) => new Promise<THREE.Texture>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = 8;
        if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      (err) => reject(err)
    );
  });

  const getFinishTextures = useCallback(async (finish: WrapFinish) => {
    const cached = finishTextureCache.current.get(finish.id);
    if (cached) return cached;
    const textures: { albedoGray?: THREE.Texture | null; normal?: THREE.Texture | null; roughness?: THREE.Texture | null; metalness?: THREE.Texture | null; ao?: THREE.Texture | null; orm?: THREE.Texture | null; } = {};
    const urls = finish.textures || {};
    try {
      // Skip albedoGray to avoid introducing patterning; rely on solid base color
      if (urls.normal) textures.normal = await loadTexture(urls.normal, false);
      if (urls.roughness) textures.roughness = await loadTexture(urls.roughness, false);
      if (urls.metalness) textures.metalness = await loadTexture(urls.metalness, false);
      if (urls.ao) textures.ao = await loadTexture(urls.ao, false);
      if (urls.orm) textures.orm = await loadTexture(urls.orm, false);
    } catch {}
    finishTextureCache.current.set(finish.id, textures);
    return textures;
  }, [finishTextureCache]);

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
              // Construct lazily; allow finish-specific map set
              const buildWithMaps = (maps?: { albedoGray?: THREE.Texture | null; normal?: THREE.Texture | null; roughness?: THREE.Texture | null; metalness?: THREE.Texture | null; ao?: THREE.Texture | null; orm?: THREE.Texture | null; }) => {
                const m = new THREE.MeshPhysicalMaterial({
                  color: new THREE.Color(color.hex),
                  roughness: finish.materialProperties.roughness,
                  metalness: finish.materialProperties.metalness,
                  clearcoat: finish.materialProperties.clearcoat ?? 0,
                  clearcoatRoughness: finish.materialProperties.clearcoatRoughness ?? 0.1,
                  ior: finish.materialProperties.ior ?? 1.5,
                  map: maps?.albedoGray ?? undefined,
                  normalMap: undefined,
                  roughnessMap: maps?.roughness ?? maps?.orm ?? undefined,
                  metalnessMap: maps?.metalness ?? maps?.orm ?? undefined,
                  aoMap: maps?.ao ?? maps?.orm ?? undefined,
                });
                if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                if (finish.materialProperties && finish.materialProperties.normalScale && m.normalScale) {
                  m.normalScale.set(finish.materialProperties.normalScale, finish.materialProperties.normalScale);
                }
                (m as EnvMapMat).envMapIntensity = envMapIntensity;
                materialCache.current.set(materialKey, m);
                material = m;
                mesh.material = m;
              };
              const urls = finish.textures;
              if (urls) getFinishTextures(finish).then(buildWithMaps); else buildWithMaps();
            } else {
              mesh.material = material;
            }
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
  }, [gltf.scene, envMapIntensity, wrapConfig, wrapColors, wrapFinishes, selectedSurfaces, highlightMode, materialCache, getFinishTextures]);

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

// EnvPreset is sourced from the centralized environment mapping

interface SceneProps {
  url: string;
  scale?: number;
  envMapIntensity: number;
  envPreset: EnvPreset;
  hdriBackground: boolean;
  envIntensity: number;
  envBlur: number;
  autoRotateEnabled: boolean;
  autoRotateSpeed: number;
  wrapConfig: WrapConfiguration;
  wrapColors: WrapColor[];
  wrapFinishes: WrapFinish[];
  selectedSurfaces: string[];
  highlightMode: boolean;
  onSurfaceClick?: (surfaceId: string) => void;
  environmentMode: 'indoors' | 'outdoors';
}

function Scene({
  url,
  scale,
  envMapIntensity,
  envPreset,
  hdriBackground: _hdriBackground,
  envIntensity,
  envBlur,
  autoRotateEnabled,
  autoRotateSpeed,
  wrapConfig,
  wrapColors,
  wrapFinishes,
  selectedSurfaces,
  highlightMode,
  onSurfaceClick,
  environmentMode,
}: SceneProps) {
  const platformRef = useRef<THREE.Group>(null);
  // OrbitControls ref to reliably sync autorotate settings at runtime
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { presets: presetMap } = useEnvPresets();
  const groundTexturePath = useMemo(() => (presetMap[envPreset]?.groundTexture ?? ENVIRONMENT_PRESETS[envPreset]?.groundTexture) || '/ground-textures/gravel/gravel_albedo.png', [presetMap, envPreset]);

  const [groundTex, setGroundTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      groundTexturePath,
      (tex) => {
        if (cancelled) return;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(3, 3);
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        setGroundTex(tex);
      },
      undefined,
      () => {
        if (cancelled) return;
        setGroundTex(null);
      }
    );
    return () => { cancelled = true; };
  }, [groundTexturePath]);

  const ambientIntensity = useMemo(() => {
    return Math.min(0.2 + 0.4 * envIntensity, 1.0);
  }, [envIntensity]);

  // reference to avoid unused warning; value is intentionally ignored in favor of mode logic
  void _hdriBackground;

  // Initialize RectAreaLight shader uniforms once
  useEffect(() => {
    RectAreaLightUniformsLib.init();
  }, []);

  // Ensure autorotate settings apply even if drei memoizes internal state
  useEffect(() => {
    const ctrls = controlsRef.current;
    if (!ctrls) return;
    ctrls.autoRotate = !!autoRotateEnabled;
    if (typeof autoRotateSpeed === 'number') ctrls.autoRotateSpeed = autoRotateSpeed;
    if (typeof ctrls.update === 'function') ctrls.update();
  }, [autoRotateEnabled, autoRotateSpeed]);

  // Recessed rectangular panel light with optional visible diffuser and frame
  const RectPanelLight: React.FC<{
    position: [number, number, number];
    rotation?: [number, number, number];
    size: [number, number]; // [width, height]
    intensity?: number;
    color?: string | number;
    showDiffuser?: boolean;
  }> = ({ position, rotation = [0, 0, 0], size, intensity = 20, color = '#ffffff', showDiffuser = true }) => {
    const [w, h] = size;
    return (
      <group position={position} rotation={rotation}>
        {/* Frame (slight border around light) */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[w + 0.3, h + 0.3]} />
          <meshStandardMaterial color={'#cbd5e1'} roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Diffuser panel */}
        {showDiffuser && (
          <mesh>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial color={'#ffffff'} emissive={new THREE.Color('#ffffff')} emissiveIntensity={0.15} roughness={0.2} />
          </mesh>
        )}
        {/* Invisible area light providing actual illumination */}
        <rectAreaLight args={[color, intensity, w, h]} position={[0, 0, 0.06]} />
      </group>
    );
  };

  // Branding panel component loads texture within Suspense boundary
  const BrandingPanel = () => {
    const logoTexture = useTexture('/mod-shop-logo3.png');
    if (logoTexture) logoTexture.colorSpace = THREE.SRGBColorSpace;
    return (
      <group position={[0, 3.8, -13.7]}>
        {/* Panel */}
        <mesh>
          <planeGeometry args={[22, 7.2]} />
          <meshPhysicalMaterial color={'#f8fafc'} roughness={0.55} metalness={0.06} clearcoat={0.2} clearcoatRoughness={0.3} />
        </mesh>
        {/* Large centered logo (prominent) */}
        <mesh position={[0, 2.0, 0.028]} scale={[1.2, 1.2, 1]}> 
          <planeGeometry args={[2.4, 2.4]} />
          <meshStandardMaterial map={logoTexture ?? undefined} transparent={true} toneMapped={true} />
        </mesh>

        {/* Title: mod-shop */}
        <Text position={[0, 0.25, 0.03]} fontSize={0.74} color="#0f172a" anchorX="center" anchorY="middle" maxWidth={16}>
          Mod Shop
        </Text>
        {/* Tagline */}
        <Text position={[0, -0.45, 0.03]} fontSize={0.34} color="#334155" anchorX="center" anchorY="middle" maxWidth={18} lineHeight={1.05}>
          The ultimate dynamic 3D car configurator.
        </Text>
        {/* Services */}
        <Text position={[0, -1.05, 0.03]} fontSize={0.36} color="#0b1220" anchorX="center" anchorY="middle" maxWidth={18} letterSpacing={0.02}>
          Wraps | Tints | Rims | Tyres | Lights
        </Text>
        {/* Decorative shapes as emissive pucks (subtle, not overlapping center) */}
        <mesh position={[-8.5, -0.2, 0.015]}>
          <circleGeometry args={[0.55, 48]} />
          <meshStandardMaterial color={'#e2e8f0'} emissive={'#e2e8f0'} emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[9.2, -0.4, 0.015]}>
          <circleGeometry args={[0.42, 48]} />
          <meshStandardMaterial color={'#cbd5e1'} emissive={'#cbd5e1'} emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[10.8, -0.9, 0.015]}>
          <circleGeometry args={[0.36, 48]} />
          <meshStandardMaterial color={'#94a3b8'} emissive={'#94a3b8'} emissiveIntensity={0.1} />
        </mesh>
      </group>
    );
  };

  return (
    <>
      {environmentMode === 'indoors' ? (
        <>
          <color attach="background" args={[ '#f3f4f6' ]} />
          <fog attach="fog" args={[ '#e5e7eb', 120, 260 ]} />

          <ambientLight intensity={Math.min(0.6 + 0.4 * envIntensity, 0.95)} />
          <hemisphereLight intensity={0.6} groundColor={0x9aa6b2} color={0xffffff} />

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

            {/* Garage room */}
            <group position={[0, 0, 0]}>
              {/* Floor - smooth, uninterrupted (slightly grayer than walls) */}
              <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]} receiveShadow>
                <circleGeometry args={[11, 128]} />
                <meshStandardMaterial color={'#d1d5db'} roughness={0.88} metalness={0.06} />
              </mesh>
              {/* Walls (simple large box with inward normals) */}
              <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[28, 9, 28]} />
                <meshStandardMaterial color={'#ffffff'} side={THREE.BackSide} roughness={0.65} metalness={0.05} />
              </mesh>
              {/* Branded feature wall panel (branding wall, no lights on this wall) */}
              <BrandingPanel />
              {/* Wall detailing: vertical paneling and baseboard */}
              <group>
                {/* Baseboard around room */}
                <mesh position={[0, 0.25, -13.95]}>
                  <boxGeometry args={[28, 0.5, 0.1]} />
                  <meshStandardMaterial color={'#cfd4dc'} roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.25, 13.95]}>
                  <boxGeometry args={[28, 0.5, 0.1]} />
                  <meshStandardMaterial color={'#cfd4dc'} roughness={0.6} />
                </mesh>
                <mesh position={[13.95, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[28, 0.5, 0.1]} />
                  <meshStandardMaterial color={'#cfd4dc'} roughness={0.6} />
                </mesh>
                <mesh position={[-13.95, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[28, 0.5, 0.1]} />
                  <meshStandardMaterial color={'#cfd4dc'} roughness={0.6} />
                </mesh>
                {/* Vertical paneling on side walls */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <mesh key={`panel-left-${i}`} position={[-13.6, 4.0, -10 + i * 4]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[8.4, 0.12, 0.12]} />
                    <meshStandardMaterial color={'#e5e7eb'} roughness={0.7} />
                  </mesh>
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <mesh key={`panel-right-${i}`} position={[13.6, 4.0, -10 + i * 4]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[8.4, 0.12, 0.12]} />
                    <meshStandardMaterial color={'#e5e7eb'} roughness={0.7} />
                  </mesh>
                ))}
              </group>
              {/* Ceiling recessed panel lights (3x3 grid) */}
              <group position={[0, 8.7, 0]} rotation={[Math.PI, 0, 0]}>
                {[-6, 0, 6].map((x, xi) => (
                  <group key={`ceil-col-${xi}`} position={[x, 0, 0]}>
                    {[-6, 0, 6].map((z, zi) => (
                      <RectPanelLight key={`ceil-${xi}-${zi}`} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} size={[3.5, 1.4]} intensity={18 * envIntensity} />
                    ))}
                  </group>
                ))}
              </group>
              {/* Side-wall lighting: two opposite walls (x = ±13.6), two rows, three rects per row */}
              <group position={[-13.6, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                {[7.8, 6.2].map((yRow, rIdx) => (
                  <group key={`left-row-${rIdx}`} position={[0, yRow, 0]}>
                    {[-7, 0, 7].map((z, i) => (
                      <RectPanelLight key={`left-${rIdx}-${i}`} position={[0, 0, z]} size={[3.0, 0.9]} intensity={8 * envIntensity} />
                    ))}
                  </group>
                ))}
              </group>
              <group position={[13.6, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                {[7.8, 6.2].map((yRow, rIdx) => (
                  <group key={`right-row-${rIdx}`} position={[0, yRow, 0]}>
                    {[-7, 0, 7].map((z, i) => (
                      <RectPanelLight key={`right-${rIdx}-${i}`} position={[0, 0, z]} size={[3.0, 0.9]} intensity={8 * envIntensity} />
                    ))}
                  </group>
                ))}
              </group>

              {/* Window/Garage door on wall opposite branding (z = +13.7) */}
              <group position={[0, 3.6, 13.7]} rotation={[0, Math.PI, 0]}>
                {/* Glass panel */}
                <mesh>
                  <planeGeometry args={[18, 6]} />
                  <meshPhysicalMaterial color={'#ffffff'} transparent transmission={0.7} thickness={0.4} roughness={0.1} metalness={0} reflectivity={0.2} ior={1.2} />
                </mesh>
                {/* Frame grid */}
                {[-8, 0, 8].map((x) => (
                  <mesh key={`vframe-${x}`} position={[x, 0, 0.02]}>
                    <boxGeometry args={[0.18, 6.2, 0.08]} />
                    <meshStandardMaterial color={'#cbd5e1'} />
                  </mesh>
                ))}
                {[-2, 2].map((y) => (
                  <mesh key={`hframe-${y}`} position={[0, y, 0.02]}>
                    <boxGeometry args={[18.2, 0.18, 0.08]} />
                    <meshStandardMaterial color={'#cbd5e1'} />
                  </mesh>
                ))}
              </group>
            </group>
            <ContactShadows position={[0, -0.001, 0]} opacity={0.25} scale={24} blur={2.8} far={26} resolution={1024} frames={1} />
          </Suspense>
        </>
      ) : (
        <>
          <color attach="background" args={[ '#ffffff' ]} />
          <fog attach="fog" args={[ '#e5e7eb', 30, 90 ]} />

          <ambientLight intensity={ambientIntensity} />
          <hemisphereLight intensity={0.25} groundColor={0x222222} color={0xffffff} />
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
            {/* Outdoors always uses HDRI with background on */}
            <SafeEnvironment preset={envPreset} background={true} intensity={envIntensity} rotate blur={envBlur} />
            <group ref={platformRef} position={[0, 0, 0]}>
              <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]} receiveShadow>
                <circleGeometry args={[10, 128]} />
                <meshStandardMaterial map={groundTex ?? undefined} roughness={0.92} metalness={0.06} color={'#cfd4dc'} />
              </mesh>
            </group>
            <ContactShadows position={[0, 0.001, 0]} opacity={0.65} scale={22} blur={2.8} far={22} resolution={1024} frames={1} />
          </Suspense>
        </>
      )}
      <OrbitControls
        ref={controlsRef}
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
  envPreset?: EnvPreset;
  hdriBackground?: boolean;
  envIntensity?: number;
  envBlur?: number;
  envMapIntensity?: number;
  autoRotateEnabled?: boolean;
  autoRotateSpeed?: number;
  wrapConfig: WrapConfiguration;
  wrapColors: WrapColor[];
  wrapFinishes: WrapFinish[];
  selectedSurfaces: string[];
  highlightMode: boolean;
  onSurfaceClick?: (surfaceId: string) => void;
  environmentMode?: 'indoors' | 'outdoors';
}

export default function EnhancedModelViewer({
  url,
  scale,
  envPreset = 'city',
  hdriBackground = false,
  envIntensity = 1.25,
  envBlur = 0.02,
  envMapIntensity = 1.6,
  autoRotateEnabled = true,
  autoRotateSpeed = 0.72,
  wrapConfig,
  wrapColors,
  wrapFinishes,
  selectedSurfaces,
  highlightMode,
  onSurfaceClick,
  environmentMode = 'indoors',
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
          envPreset={envPreset}
          hdriBackground={hdriBackground}
          envIntensity={envIntensity}
          envBlur={envBlur}
          envMapIntensity={envMapIntensity}
          autoRotateEnabled={autoRotateEnabled}
          autoRotateSpeed={autoRotateSpeed}
          wrapConfig={wrapConfig}
          wrapColors={wrapColors}
          wrapFinishes={wrapFinishes}
          selectedSurfaces={selectedSurfaces}
          highlightMode={highlightMode}
          onSurfaceClick={onSurfaceClick}
          environmentMode={environmentMode}
        />
        {/* Post-processing antialiasing: prefer SMAA, fallback to FXAA */}
        <PostAA />
      </Canvas>
    </div>
  );
}

// Capability-checked environment: HDRI presets when supported, fallback otherwise
function SafeEnvironment({ preset, background, intensity, rotate, blur = 0.02 }: { preset: EnvPreset; background: boolean; intensity: number; rotate?: boolean; blur?: number }) {
  const { gl, scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const { presets: presetMap } = useEnvPresets();

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

  const cfg = presetMap[preset] ?? ENVIRONMENT_PRESETS[preset];
  return (
    <group ref={groupRef}>
      {cfg?.files ? (
        <Environment files={cfg.files} background={background} blur={blur} />
      ) : (
        <Environment preset={cfg?.dreiPreset ?? 'city'} background={background} blur={blur} />
      )}
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
