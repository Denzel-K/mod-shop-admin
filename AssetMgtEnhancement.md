# Asset Management Enhancement Plan

This plan enhances `mod-shop-admin` to support:

- Creator credits (required for Sketchfab and other sources)
- Asset source categorization (`assetSource`)
- Make/Model categorization (Toyota, Nissan, Suzuki, …; all global car models)
- Robust model mapping utility for make/model search
- Rich, standardized model metadata for car-part selectors (wrappable surfaces, rims, windows, doors, tyres, …)
- Upload/Edit UI that is intuitive for asset curators, with flexible metadata input (chips, comma-separated, JSON)

The plan is phased, with explicit review checkpoints and iteration loops.

---

## Phase 0 — Discovery (DONE)

- Audit current schema, API, and UI.
  - Schema: `mod-shop-admin/models/Asset.ts`
  - API: `app/api/assets/route.ts`, `app/api/assets/[id]/route.ts`
  - UI: `app/dashboard/page.tsx` (Upload form + listing), `app/assets/[id]/page.tsx` (viewer), `components/asset/AssetViewerPanel.tsx` (scale editor)

Checkpoint: Confirmed current fields: name, description, modelUrl, modelPublicId, thumbnailUrl, thumbnailPublicId, format, sizeBytes, scale, timestamps.

---

## Phase 1 — Data Model Extensions (Schema)

Add the following to `models/Asset.ts`:

- `assetSource`: enum: `sketchfab | turbosquid | internal | other` (string, required: false)
- `creatorCredits`: object with fields
  - `text` (string) — required if `assetSource` is `sketchfab` or if curators provide it
  - `creatorName` (string)
  - `profileUrl` (string)
  - `sourcePageUrl` (string)
  - `license` (string)
- `make` (string, index)
- `model` (string, index)
- `year` (number, optional)
- `variant` (string, optional) — e.g., trim/edition
- `tags` (string[]; index)
- `metadata` (object) structured for configurator needs:
  - `wrappableSurfaces: string[]`
  - `rims: string[]`
  - `windows: string[]`
  - `doors: string[]`
  - `tyres: string[]`
  - `interior?: string[]`
  - `lights?: string[]`
  - `other?: Record<string, string[]>` — extensible bucket

Indexes:

- `createdAt: -1` (exists)
- `name: 1` (exists)
- `make: 1, model: 1, year: 1`
- `tags: 1` (sparse)

Backward compatibility:

- All new fields optional except validation rules in APIs depending on `assetSource`.

Checkpoint after Phase 1:

- Mongoose schema compiles.
- TypeScript interface `IAsset` updated and used by API routes without errors.

---

## Phase 2 — API Extensions

Update `POST /api/assets` (multipart):

- Accept new fields (strings unless noted):
  - `assetSource` (enum)
  - `creatorCredits` — accept as JSON string OR individual fields: `creatorCredits.text`, `creatorCredits.creatorName`, `creatorCredits.profileUrl`, `creatorCredits.sourcePageUrl`, `creatorCredits.license`
  - `make`, `model`, `year` (number), `variant`
  - `tags` — comma-separated OR JSON array
  - `metadata` — JSON object; alternatively, accept categorized comma-separated: `metadata.wrappableSurfaces`, `metadata.rims`, `metadata.windows`, `metadata.doors`, `metadata.tyres`, `metadata.interior`, `metadata.lights`
- Validation:
  - If `assetSource === 'sketchfab'`, require `creatorCredits.text` at minimum.
  - Normalize/trim strings; parse arrays and JSON.
- Persist all fields to new schema.

Update `PATCH /api/assets/:id` (JSON):

- Allow updating any of the new fields: `assetSource`, `creatorCredits`, `make`, `model`, `year`, `variant`, `tags`, `metadata`, plus existing `name`, `description`, `scale`.
- Validate same as POST; merge or replace for nested objects (`metadata` replaces entirely by default; extend later if needed).

Update `GET /api/assets` (query filters, non-breaking):

- Add optional query parameters for filtering/search:
  - `q` (text search on `name`, `make`, `model`, `tags`)
  - `make`, `model`, `year`, `assetSource`, `tag`
- Sorting and pagination parameters (future-friendly; default to existing behavior of recent first).

Checkpoint after Phase 2:

- Creating and editing assets with the new fields works via API.
- Basic filter queries work (manual tests via curl or the UI list page fetch adjustments later if needed).

---

## Phase 3 — Model Mapping Utility

Create `lib/model-mapping.ts` and `lib/data/car-models.json`:

- `car-models.json` structure:
  ```json
  {
    "Toyota": ["Corolla", "Camry", "Supra"],
    "Nissan": ["GTR", "Skyline", "Leaf"],
    "Suzuki": ["Swift", "Jimny"]
  }
  ```
  (Initial seed; easily extendable. In production we can import a comprehensive dataset.)

- Utility API:
  - `listMakes(): string[]`
  - `listModels(make?: string): string[]`
  - `search(query: string): { make: string; model: string }[]` (simple case-insensitive includes)
  - `normalizeName(s: string): string` (folding for robust matching)

- Potential future: fuzzy matching, synonyms, year ranges per model.

Checkpoint after Phase 3:

- Utility functions export and unit usage validated.

---

## Phase 4 — UI Enhancements (Upload/Edit)

Extend `app/dashboard/page.tsx` `UploadForm`:

- New inputs:
  - `Asset Source` — select: Sketchfab, TurboSquid, Internal, Other
  - `Creator Credits` —
    - Textarea for `text`
    - Inputs: `creatorName`, `profileUrl`, `sourcePageUrl`, `license`
    - Validation hint: required text if Source is Sketchfab
  - `Make` — combobox powered by `model-mapping.ts` (`listMakes`)
  - `Model` — combobox filtered by selected make (`listModels(make)`) with free-text fallback
  - `Year` — number
  - `Variant` — text
  - `Tags` — chips input supporting Enter-to-add and comma-separated paste (stores array)
  - `Metadata` — tabbed input with three modes:
    - Chips per known category (wrappableSurfaces, rims, windows, doors, tyres, interior, lights)
    - Comma-separated multiline helper (one category per line; optional)
    - Raw JSON editor (textarea) with live validation

- Submission:
  - For `POST` multipart, serialize:
    - `assetSource`
    - `creatorCredits` as JSON string
    - `make`, `model`, `year`, `variant`
    - `tags` as JSON string
    - `metadata` as JSON string
  - For `PATCH` JSON, send same fields as nested JSON body.

- Viewer Page `app/assets/[id]/page.tsx`:
  - Display badges for make/model/year/source; show credits block when present.

Checkpoint after Phase 4:

- Curators can upload and edit all new fields.
- JSON mode accepts copy/paste from Godot node inspector.
- Chips mode is intuitive with Enter-to-add.

---

## Phase 5 — Search and Library UX (Optional for now)

- Add filter controls to dashboard list (make/model/source/tag/q) and pass as query to `/api/assets`.
- Empty states and badges reflect new metadata.

Checkpoint after Phase 5:

- Filters work and results match expectations.

---

## Phase 6 — QA, Data Backfill, and Docs

- Write a short curator guide in `docs/curation-guide.md` explaining metadata patterns with examples from Godot.
- Add seed script or import helper for car models data.
- Backfill existing assets with minimal `assetSource` and credits where applicable.

Checkpoint after Phase 6:

- Docs published; team alignment on metadata patterns.

---

## Implementation Notes

- Validation helpers in `lib/` for parsing arrays and JSON safely.
- Keep server-side robust: always trim, lowercase where applicable, dedupe arrays.
- Avoid breaking existing clients; default to optional fields and additive changes.
- Ensure indices support common queries (make/model, tags).

---

## Execution Order

1) Phase 1: Schema changes
2) Phase 2: API changes
3) Phase 3: Model mapping utility
4) Phase 4: UI changes
5) Phase 6: Docs (initial)
6) Phase 5: Optional search filters (if time permits)

Each phase ends with a checkpoint review and fixes before moving on.
