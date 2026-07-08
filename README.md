# React + TypeScript + Vite

## Wizard Chess Models

The app supports production `.glb` chess piece models with procedural marble pieces as a fallback.

1. Add models to `public/models`.
2. Keep each model centered at the origin and scaled to fit within one chess square.
3. Map model URLs in `src/pieceModelConfig.ts`, for example:

```ts
const pieceModelConfigs = {
  "white-k": {
    path: "/models/white-king.glb",
    scale: 0.82,
    offset: [0, 0, 0],
    rotation: [0, Math.PI, 0],
  },
};
```

If a model path is not configured, the app renders the built-in procedural marble piece.

Procedural marble/onyx textures are generated in `src/materials/stoneTextures.ts` and are applied to the fallback pieces and board.

## Arena Features

- Full legal chess movement powered by `chess.js`, including castling, en passant, promotion, check, checkmate, and draws.
- Animated 3D pieces, legal-move highlighting, capture trails, tiered fireball effects, camera impact, and role-specific taunts.
- Beginner guide covering controls and every piece's movement style.
- Synchronized Undo Move and New Game controls that rewind the board, move log, captures, and arena overlays.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
