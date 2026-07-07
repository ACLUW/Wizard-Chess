# Piece Model Assets

Place production `.glb` chess piece models in this folder.

Recommended names:

- `white-pawn.glb`
- `white-rook.glb`
- `white-knight.glb`
- `white-bishop.glb`
- `white-queen.glb`
- `white-king.glb`
- `black-pawn.glb`
- `black-rook.glb`
- `black-knight.glb`
- `black-bishop.glb`
- `black-queen.glb`
- `black-king.glb`

After adding files, map them in `src/pieceModelConfig.ts`.

Keep each model centered at the origin, standing on the board at `y = 0`, and scaled to fit inside one chess square.

Each model config supports:

- `path`: URL under `public`, for example `/models/white-king.glb`
- `scale`: single number or `[x, y, z]`
- `offset`: `[x, y, z]` position tweak
- `rotation`: `[x, y, z]` Euler rotation in radians
