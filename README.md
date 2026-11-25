# CODEX Galaxy

**Build worlds. Bend orbits. Rewrite the sky.**

An experimental, browser-based orbital sandbox with an original space-construction interface inspired by Kerbal Space Program 2's part picker. No backend, account, engine install, assets from KSP, or external dependencies.

## Run

Open `index.html` in a modern desktop browser. For a normal HTTP origin (recommended for predictable local storage), run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. Alternatively, publish the repository root using GitHub Pages (Settings → Pages → Deploy from a branch → main → / (root)).

## Prototype features

- Start from a simplified Solar System (Sun and eight planets), empty space, or a JSON save.
- Searchable, categorized library of 14 celestial body templates: stars, planets, moons, asteroids, comets and compact objects.
- Choose a body, then click the orbital plane to place it. Select circular orbital velocity around the locally dominant gravitational body, stationary, or the primary's velocity.
- Inspect and edit mass, radius, name and the complete 3D state vector. Editing a state vector pauses the simulation.
- Orbit, pan, zoom, track an object, show reference rings, show recorded trails, and toggle enhanced vs physical radii.
- Pause or play; time warp from 1× to 1000×, with an accuracy-budget warning and throttling during difficult encounters.
- Save a system locally or export/import a portable JSON file. The snapshot preserves positions, velocities and simulated time, not trail history or camera state.

## Controls

| Action | Control |
|---|---|
| Orbit camera | Drag with left mouse button |
| Pan camera | Shift + drag or right mouse button drag |
| Zoom | Mouse wheel |
| Select | Click a body or its name in the object list |
| Track / zoom in | FOCUS in inspector or double-click a list item |
| Fit system | Home icon or F |
| Place | Click a library tile, then click in the viewport |
| Cancel placement | Esc or × |
| Play / pause | Space or play button |
| Time warp | 1×, 10×, 50×, 100×, 250×, 500×, 1000× |

On smaller screens, category and inspector panels can be collapsed; desktop mouse/keyboard controls are the primary experience.

## Architecture

- `index.html` — interface and game shell
- `style.css` — responsive, dark space-construction visual system
- `physics.js` — pure Newtonian N-body engine; AU, solar masses and days; velocity Verlet with adaptive step selection and momentum-preserving simplified collisions
- `app.js` — interactive perspective projection of the 3D scene with Canvas 2D sphere impostors, orbital camera, object editor, save/import and game loop
- `test-physics.js` — dependency-free tests

```bash
node test-physics.js
```

### Model limitations

This is an educational/gameplay prototype, not a research simulator. Starting orbits are approximate circular coplanar orbits, not date-specific ephemerides. Reference rings show those approximate initial orbital distances, while trails show actual simulated history. Gravity is Newtonian, with small-scale softening; collisions merge mass and momentum but do not model fragmentation, atmospheres or thermodynamics. Compact objects do not model relativistic gravity, lensing, accretion or event horizons. Rendered radii are enhanced by default and can be switched to true physical radii. The renderer uses 3D coordinates and a perspective camera but not a WebGL mesh engine. The simulation is O(N²) with a 100-body cap. 1× corresponds to 0.2 simulated days per wall-clock second; 1000× requests 200 simulated days per second. The integrator may throttle during close encounters and on slower machines. The default scene is a planetary system rather than a full galaxy with billions of stars.

## Possible next steps

- WebGL renderer with procedural surface textures, atmosphere shaders, HDR glow and realistic rings
- More scenarios: binary stars, planetary collisions, moons, and asteroid belts
- Orbit prediction and orbit-element editor, time rewind, timeline and energy diagnostics
- GPU/worker-based gravity and larger systems
