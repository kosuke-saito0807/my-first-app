# Copilot instructions

## Project overview

This is a dependency-free browser game called **Star Runner**, implemented with plain HTML, CSS, and JavaScript. `index.html` is the only page and wires the HUD, game-over overlay, canvas, stylesheet, and script together. `script.js` owns the complete game: it creates the level data, updates player/enemy physics and collisions, collects coins, tracks score, persists the best score, and renders every frame on the 960x540 canvas. `style.css` provides the responsive game-shell layout and the pixel-arcade visual treatment.

The game uses a fixed world wider than the viewport (`world.width`), while `camera.x` follows the player and constrains scrolling. `reset()` is the authoritative place for a new game and initializes world entities plus transient state. `requestAnimationFrame(loop)` drives the update/draw cycle; `update(dt)` changes state and `draw()` renders the current state. The DOM is used only for the score and game-over UI; gameplay visuals are canvas primitives.

## Running locally

There is no `package.json`, dependency installation, build, test, or lint configuration in this repository.

Serve the repository root with any static HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. Because the game uses `localStorage`, test it over the served origin rather than relying on `file://`.

There is no automated test suite or single-test command. For changes to gameplay, manually exercise keyboard movement (`ArrowLeft`/`ArrowRight` or `a`/`d`), jumping (`Space`, `ArrowUp`, or `w`), coin collection, enemy stomping, enemy collision, falling, restart, and best-score persistence in a browser.

## Conventions and implementation notes

- Keep the implementation framework-free and dependency-free unless the project is intentionally being migrated; use browser APIs and the existing DOM/canvas structure.
- Keep gameplay state in the module-level variables initialized by `reset()`. Add level entities to the `world` object and update them in `update(dt)` before rendering them in `draw()`.
- Treat `dt` as seconds and preserve the existing frame-step cap (`Math.min(.033, ...)`) so physics remains stable when a frame is delayed.
- Use the existing collision helpers and platform landing rules rather than introducing a separate physics abstraction. Enemy stomps bounce the player and award 2 points; coins award 1 point.
- Keep score and best-score display synchronized through `updateScore()` and `bestScore`, and preserve the `star-runner-best` `localStorage` key when changing persistence behavior.
- Keyboard handlers prevent browser scrolling for the supported control keys. Extend the `keydown`/`keyup` mappings consistently if adding controls.
- Preserve the existing DOM IDs (`game-canvas`, `coin-count`, `best-score`, `message`, `message-title`, `restart-button`) unless all corresponding selectors and markup are updated together.
- Canvas coordinates are based on the internal 960x540 resolution; CSS scales the canvas responsively and uses `image-rendering: pixelated`. Draw gameplay in world coordinates between `ctx.save()`/`ctx.translate(-camera.x, 0)` and `ctx.restore()`.
- The game uses 2D physics with a pseudo-3D rendering style: platforms are rendered as extruded blocks and entities use highlights, side faces, shadows, and neon contrast. Preserve this depth treatment when adding new drawable entities.
- Match the existing compact arcade aesthetic: dark indigo backgrounds, cyan player, pink enemies, gold coins, green platform tops, pixel-style headings, and Japanese user-facing text. Display all user-facing descriptions, labels, messages, and help text in Japanese. Keep accessibility attributes and the live score region intact when changing UI.
- The stylesheet imports Google Fonts externally; changes should retain responsive behavior at the existing mobile breakpoint unless the layout requirements change.
