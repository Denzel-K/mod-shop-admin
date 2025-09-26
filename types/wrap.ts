export interface WrapFinish {
  id: string;
  name: string;
  category: 'gloss' | 'satin' | 'matte' | 'metallic' | 'chrome' | 'textured' | 'pearlescent';
  description: string;
  materialProperties: {
    roughness: number;
    metalness: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    normalScale?: number;
  };
  characteristics: string[];
  textureUrl?: string;
}

export interface WrapColor {
  id: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
  category: string;
  compatibleFinishes: string[];
  popularity: number;
  colorShift?: {
    primary: string;
    secondary: string;
    tertiary?: string;
    angle: number;
  };
}

export interface WrapCategory {
  id: string;
  name: string;
  description: string;
}

export interface WrapConfiguration {
  surfaces: Record<string, {
    colorId: string;
    finishId: string;
    textureScale?: number;
    rotation?: number;
  }>;
  environment: {
    preset: string;
    intensity: number;
    background: boolean;
  };
}

export interface WrapData {
  categories: WrapCategory[];
  colors: WrapColor[];
}

export interface WrapFinishData {
  finishes: WrapFinish[];
}
