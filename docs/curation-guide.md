# Mod Shop Asset Curation Guide

This guide explains how to curate and upload 3D car models so the configurator can reliably drive wraps, tints, paint, and more.

## What to capture during curation

- Make, Model, Year, Variant
- Asset Source and Creator Credits (e.g., Sketchfab)
- Tags (keywords that aid discoverability)
- Structured Metadata for part targeting

## Provenance and Credits

- Set `Asset Source` to one of: Sketchfab, TurboSquid, Internal, Other
- When `Sketchfab` is selected, you must provide at least a `Creator Credits Text`, e.g.: “Model by Jane Doe on Sketchfab”. Optionally add:
  - Creator Name
  - Creator Profile URL
  - Source Page URL
  - License (e.g., CC BY 4.0)

## Model Mapping (Make/Model)

- Use the make and model fields to categorize. Start typing to select from suggestions.
- If a model is missing from the suggestions, type it freely (we can expand the database later).

## Tags

- Enter comma-separated tags, e.g. `coupe, sports, 2-door, jdm, widebody`.
- Prefer lower-case single words; avoid duplicates.

## Metadata for Configurator

Metadata maps in-engine nodes (from Godot) to categories the configurator understands. Curators will open models in Godot, inspect node names, then paste identifiers here.

Two entry methods are supported:

1. Category inputs (comma-separated values)
2. Raw JSON (overrides category inputs if provided)

### Categories

- `wrappableSurfaces`: surfaces that can receive vinyl wraps or paint (e.g., `Body`, `Hood`, `Roof`, `Bumper_Front`)
- `rims`: wheel meshes (front-left, front-right, rear-left, rear-right), e.g. `FL_Rim, FR_Rim, RL_Rim, RR_Rim`
- `windows`: glass meshes, e.g. `Front_Windshield, Rear_Windshield, Left_Window, Right_Window`
- `doors`: door meshes or groups, e.g. `FL_Door, FR_Door, RL_Door, RR_Door`
- `tyres`: tyre meshes, e.g. `FL_Tyre, FR_Tyre, RL_Tyre, RR_Tyre`
- `interior` (optional): interior submeshes, e.g. `Seats, Dashboard, Steering_Wheel`
- `lights` (optional): e.g. `Headlights, Taillights, Indicators`
- `other` (optional): object with custom arrays for special parts

### Good naming patterns

- Keep names stable and descriptive. Example: `Body_Main`, `Hood`, `Roof`, `Door_FL`, `Door_FR`, `Window_L`, `Window_R`.
- Be consistent across models so services apply uniformly.
- Avoid spaces if your DCC pipeline struggles with them; use `_` or `-`.

### Example JSON

```json
{
  "wrappableSurfaces": ["Body", "Hood", "Roof", "Bumper_Front", "Bumper_Rear"],
  "windows": ["Front_Windshield", "Rear_Windshield", "Left_Window", "Right_Window"],
  "rims": ["FL_Rim", "FR_Rim", "RL_Rim", "RR_Rim"],
  "doors": ["FL_Door", "FR_Door", "RL_Door", "RR_Door"],
  "tyres": ["FL_Tyre", "FR_Tyre", "RL_Tyre", "RR_Tyre"],
  "interior": ["Seats", "Dashboard"],
  "lights": ["Headlights", "Taillights"],
  "other": {
    "mirrors": ["Mirror_L", "Mirror_R"],
    "calipers": ["Caliper_FL", "Caliper_FR", "Caliper_RL", "Caliper_RR"]
  }
}
```

## Quality checks

- Verify the model loads, is centered, and scaled properly in the viewer.
- Ensure wrappable surfaces are not combined with glass/tyres to avoid unwanted effects.
- Confirm node names match what you pasted.
- Provide a clear thumbnail.

## Updating and Iterating

- You can edit metadata later via the dashboard. For Sketchfab assets, credits must remain present.
- If a make/model is missing from suggestions, let the team know; we’ll expand the mapping.

## Notes

- All new fields are optional unless `Sketchfab` is selected, in which case `Creator Credits Text` is required.
- The system deduplicates comma-separated lists and normalizes strings on the server.
