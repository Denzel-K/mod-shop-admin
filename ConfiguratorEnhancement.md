# Car Configurator Enhancement Plan

## Overview
Transform the existing AssetViewerPanel and ModelViewer components into a comprehensive car configurator with wrap customization capabilities. The enhancement will introduce dual sidebars, advanced material controls, and a sophisticated wrap selection system.

## Current State Analysis

### Existing Components
- **AssetViewerPanel**: Single right sidebar with environment controls
- **ModelViewer**: Three.js canvas with basic lighting and environment presets
- **Asset Schema**: Contains metadata for wrappable surfaces, rims, windows, etc.
- **Base Texture**: `vinyl-tablecloth_albedo.png` available for wrap base

### Key Findings
1. Current layout uses single right sidebar (320px width)
2. Environment controls include HDRI presets, lighting, platform styles
3. Asset metadata schema supports wrappable surface identification
4. Three.js setup with proper material handling and shadows
5. Responsive design with mobile overlay support

## Enhancement Phases

### Phase 1: Data Structure & Mapping
**Priority: High**

#### 1.1 Wrap Color Chart Analysis
- Extract color categories and finishes from PDF
- Create comprehensive JSON mapping structure
- Define material property mappings for Three.js

#### 1.2 Wrap Data Schema
```typescript
interface WrapFinish {
  id: string;
  name: string;
  category: 'matte' | 'gloss' | 'satin' | 'metallic' | 'chrome' | 'carbon' | 'textured';
  materialProperties: {
    roughness: number;
    metalness: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    normalScale?: number;
  };
}

interface WrapColor {
  id: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
  category: string;
  finish: WrapFinish;
  textureUrl?: string;
}
```

#### 1.3 Create JSON Data Files
- `wrap-finishes.json`: Material finish definitions
- `wrap-colors.json`: Color palette with finish combinations
- `wrap-categories.json`: Organizational structure

### Phase 2: UI Layout Restructure
**Priority: High**

#### 2.1 Dual Sidebar Architecture
- **Left Sidebar (280px)**: Car Controls
  - Wrap customization panel
  - Surface selection tools
  - Color/finish picker
  - Material preview
- **Center Canvas**: Three.js viewer (responsive)
- **Right Sidebar (300px)**: Environment Controls
  - Existing environment settings
  - Lighting controls
  - Camera presets

#### 2.2 Responsive Breakpoints
- **Desktop (≥1200px)**: Dual sidebars visible
- **Tablet (768px-1199px)**: Single sidebar toggle
- **Mobile (<768px)**: Overlay panels

#### 2.3 Component Structure
```
AssetViewerPanel/
├── LeftSidebar/
│   ├── WrapCustomizer/
│   ├── SurfaceSelector/
│   └── MaterialPreview/
├── CenterCanvas/
│   └── EnhancedModelViewer/
└── RightSidebar/
    └── EnvironmentControls/
```

### Phase 3: Wrap Customization System
**Priority: Medium**

#### 3.1 Surface Selection Interface
- Interactive 3D surface highlighting
- Metadata-driven surface identification
- Multi-surface selection support
- Visual feedback for selected surfaces

#### 3.2 Wrap Selector Component
- **Search Bar**: Real-time filtering
- **Category Filters**: Finish type, color family
- **Color Grid**: Visual color picker
- **Finish Selector**: Material property preview
- **Favorites System**: User preferences

#### 3.3 Material Preview System
- Real-time material updates
- Before/after comparison
- Texture mapping preview
- Lighting interaction demo

### Phase 4: Three.js Integration
**Priority: Medium**

#### 4.1 Enhanced Material System
- Dynamic material property updates
- Texture loading and caching
- Normal map integration
- Environment map reflection control

#### 4.2 Surface Targeting
- Mesh identification via metadata
- Material instance management
- Undo/redo functionality
- Configuration persistence

#### 4.3 Performance Optimization
- Texture atlas optimization
- Material instance pooling
- LOD system for complex wraps
- Progressive loading

### Phase 5: Advanced Features
**Priority: Low**

#### 5.1 Preset Management
- Save/load configurations
- Share configurations
- Template system
- Export capabilities

#### 5.2 Advanced Interactions
- Drag-and-drop color application
- Multi-surface batch operations
- Color harmony suggestions
- Real-world lighting simulation

## Technical Implementation Details

### Component Architecture
```typescript
// Enhanced AssetViewerPanel
interface ConfiguratorProps {
  asset: Asset;
  initialConfig?: WrapConfiguration;
  onConfigChange?: (config: WrapConfiguration) => void;
}

// Wrap configuration state
interface WrapConfiguration {
  surfaces: Record<string, {
    colorId: string;
    finishId: string;
    textureScale?: number;
    rotation?: number;
  }>;
  environment: EnvironmentSettings;
}
```

### State Management
- React Context for wrap configuration
- Local storage persistence
- Optimistic updates for UI responsiveness
- Debounced Three.js material updates

### Performance Considerations
- Lazy loading of texture assets
- Virtual scrolling for large color lists
- WebGL texture compression
- Memory management for material instances

## Development Checkpoints

### Checkpoint 1: Foundation (After Phase 1)
- [ ] Wrap data structures defined
- [ ] JSON mapping files created
- [ ] Basic component structure outlined
- **Review**: Data completeness and structure validation

### Checkpoint 2: Layout (After Phase 2)
- [ ] Dual sidebar layout implemented
- [ ] Responsive behavior working
- [ ] Component communication established
- **Review**: UI/UX flow and responsiveness testing

### Checkpoint 3: Core Functionality (After Phase 3)
- [ ] Wrap selection working
- [ ] Surface targeting functional
- [ ] Material updates in real-time
- **Review**: Core feature completeness and performance

### Checkpoint 4: Integration (After Phase 4)
- [ ] Three.js material system integrated
- [ ] Performance optimizations applied
- [ ] Error handling implemented
- **Review**: Technical robustness and edge cases

### Checkpoint 5: Polish (After Phase 5)
- [ ] Advanced features implemented
- [ ] User experience refined
- [ ] Documentation completed
- **Review**: Final quality assurance and deployment readiness

## Success Metrics
- **Functionality**: All wrap customization features working
- **Performance**: <100ms material update response time
- **Responsiveness**: Smooth operation on all target devices
- **Usability**: Intuitive interface requiring minimal learning
- **Scalability**: Support for 100+ wrap options without performance degradation

## Risk Mitigation
- **Texture Loading**: Implement progressive loading and fallbacks
- **Performance**: Monitor WebGL memory usage and implement cleanup
- **Browser Compatibility**: Test across target browsers and devices
- **User Experience**: Conduct usability testing at each checkpoint

## Next Steps
1. Begin Phase 1 with wrap color chart analysis
2. Create foundational data structures
3. Implement dual sidebar layout
4. Develop wrap customization components
5. Integrate Three.js material system
6. Test and refine user experience
