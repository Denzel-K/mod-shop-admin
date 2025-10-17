# Asset Viewer & Controls Enhancement (Analyze → Plan → Execute)

## Findings (Current Implementation)
- **`components/asset/AssetViewerPanel.tsx`**
  - Manages scene/env state and UI panels.
  - Loads wrap data from `lib/data/wrap_colors.json` and `lib/data/wrap_finishes.json`.
  - Tracks `selectedSurfaces`, `highlightMode`, `wrapConfig`, `selectedColor`, `selectedFinish`.
  - Applies color/finish to `wrapConfig.surfaces[surfaceId]` on selection.
  - Renders `EnhancedModelViewer` with `wrapConfig`, `selectedSurfaces`, `highlightMode`.
  - Renders left controls: `SurfaceSelector` then `WrapCustomizer`.

- **`components/configurator/SurfaceSelector.tsx`**
  - Displays wrappable and other surface groups using human-friendly names from `IAssetMetadata`.
  - Toggle/Select handlers: `onSurfaceToggle()` and `onSurfaceSelect()`.
  - `highlightMode` toggle available.

- **`components/configurator/WrapCustomizer.tsx`** (before changes)
  - Independent color category filter and finish list.
  - Colors did not consider compatibility with selected finish.

- **`components/viewer/EnhancedModelViewer.tsx`**
  - Traverses GLTF meshes, applies materials based on `wrapConfig`.
  - Highlight mode replaced mesh material with a single cyan material; restoring occurred only when turning off highlight.
  - Side-effect: when highlight was on, wrap changes weren’t visible.

- **Data**
  - `wrap_colors.json` colors include `compatibleFinishes: string[]`.
  - `wrap_finishes.json` finishes define `id`, `category` and PBR `materialProperties`.

## Problems Identified
- **[P1] Wrap Customizer visibility**: Always shown even without wrappable surfaces.
- **[P2] Color/Finish UX**: Colors were filtered by category, not by compatibility with chosen finish.
- **[P3] Highlight behavior bug**: Replacing material in highlight mode hid wrap updates.
- **[P4] Default finish id**: Default was `gloss` (category) instead of an actual finish `id` like `gloss_series`.

## Layered Plan

### Phase 1: UX/Data Model Alignment (Immediate Value)
- **Hide Wrap Customizer** when asset lacks `wrappableSurfaces` in `IAssetMetadata`.
- **Use valid finish id** defaults and resets (`gloss_series`).
- **Remove color category filter** from UI, derive colors solely by finish compatibility.

### Phase 2: Robust Wrap Selection Logic
- **Dynamic colors by finish**: Show only `colors` where `compatibleFinishes` contains currently selected finish.
- **Search** retained to quickly find colors.
- **Guard incompatibility**: When finish changes, clear `selectedColor` if incompatible; update applied surfaces when selection changes.

### Phase 3: Reliable Highlight Mode
- **Do not replace materials** in highlight mode.
- **Overlay highlight** by temporarily adjusting emissive color/intensity on existing materials; backup and restore values when highlight toggles.
- Ensure highlight still makes the selected parts obvious while preserving material updates.

### Phase 4: QA & UX Polish
- Validate behavior with different assets:
  - No metadata.
  - Partial metadata with `wrappableSurfaces`.
  - Multiple selections and batch apply.
  - Highlight on/off while changing wraps.
- Empty states: when no finish selected show helper hint.
- Performance: reuse material cache; avoid re-creating textures.

## Execution Summary (Code Changes)

- **`AssetViewerPanel.tsx`**
  - Default finish: `selectedFinish = "gloss_series"` and reset likewise.
  - Show `WrapCustomizer` only if `assetMetadata?.wrappableSurfaces` has keys.
  - Remove `categories` prop and unused category handling.
  - On `handleFinishSelect(finishId)`: clear `selectedColor` if incompatible with new finish; propagate change to selected surfaces.
  - Minor typing fix for `WrapColorsData` local type.

- **`WrapCustomizer.tsx`**
  - Removed category filter UI and `categories` prop.
  - Colors list is computed as `colors.filter(c => c.compatibleFinishes?.includes(selectedFinish))`.
  - Search still available; color grid displays only compatible colors.
  - Empty state prompt when no finish selected.

- **`EnhancedModelViewer.tsx`**
  - Replaced material swapping highlight with emissive overlay.
  - For selected meshes in highlight mode: backup `emissive` and `emissiveIntensity`, set cyan emissive with intensity 0.6; restore when not highlighted.
  - Leaves `wrapConfig` material application intact so updates reflect immediately.

## Testing Matrix
- **Highlight interactions**
  - Toggle highlight on; select surfaces; change finish then color; confirm immediate visual updates.
  - Toggle highlight off; verify emissive restore.
- **Compatibility**
  - Pick finish with narrow compatibility; verify only valid colors appear.
  - Change finish to one incompatible with current color; color selection clears and preview updates.
- **No metadata**
  - `SurfaceSelector` shows informative empty state; `WrapCustomizer` not rendered.
- **Batch apply**
  - Multiple selections; apply finish and colors; all update.
- **Mobile/Tablet**
  - Overlays render and dismiss properly; lists scroll within containers.

## Follow-ups / Future Enhancements
- **Finish-first guided flow**: optionally preselect most popular color compatible with selected finish.
- **Per-surface presets**: quick-apply popular combos for body panels, rims, etc.
- **Material previews**: small swatches showing approximate roughness/metalness before selection.
- **Persist wrapConfig**: allow saving and recalling curated configurations.

## Files Touched
- `components/asset/AssetViewerPanel.tsx`
- `components/configurator/WrapCustomizer.tsx`
- `components/viewer/EnhancedModelViewer.tsx`

## Status
- Phase 1–3 implemented in code; Phase 4 testing pending.
