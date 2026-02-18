

# Fix PWA Icon Cutoff in Manifest

## Problem
The "GoldenPips" text on the home screen icon is cut off because icons are declared with `"purpose": "maskable any"`, which triggers Android's safe zone crop (inner 80%).

## Solution
Update `public/manifest.json` to change all icon `purpose` values from `"maskable any"` to `"any"`. This prevents the OS from cropping the icon edges.

## Technical Details

**File:** `public/manifest.json`

All 8 icon entries will be updated:
```json
// Before
"purpose": "maskable any"

// After
"purpose": "any"
```

This is a single-file change with no code dependencies. After installing the updated PWA, the full icon design will be visible on the home screen.

