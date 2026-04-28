# Room Layout Editor (Static)

Lightweight, static (no backend) **2D room layout editor** that runs fully in the browser.

## Dev

- Install:

```bash
npm install
```

- Run dev server:

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

- This project deploys via GitHub Actions to **GitHub Pages**.
- Vite must be served from a **repo sub-path**:

`https://<user>.github.io/<repo>/`

### Configure base path

- In `vite.config.ts` the default `base` is set to `"/a205_layout/"`.
- In `.github/workflows/deploy.yml` set `VITE_BASE` to `"/<repo>/"`.

## Coordinate system

- World units are **centimeters**.
- World origin is **bottom-left** `(0,0)`.
- +x right, +y up.
- Konva’s native y-axis increases downward; the editor applies a world-to-screen transform so world coordinates remain bottom-left.

## Fixed room configuration

Editable config lives in `src/roomConfig.ts`.

## Catalog items

Static hosting cannot list directories, so the catalog uses an explicit index:

- `public/catalog/index.json` — array of paths to item JSON files.

Each item JSON:

```json
{
  "version": 1,
  "name": "string",
  "color": "#rrggbb",
  "corners": [{"x":0,"y":0}, {"x":100,"y":0}, ...]
}
```

- `corners` are in **cm** in local item coordinates.

## Examples

- `public/examples/index.json` — array of paths to example layouts.
- The UI can load examples; it does not save into `public/examples`.

## Layout format

- JSON, schema `version: 1`.
- Saves room dims, fixed elements (pillar, doors, ramps), placed items, and timestamps.

## Known limitations

- Constraint enforcement is "revert to last valid" on invalid drag/rotate.
- No snapping, no measurement tooling (v1).
