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

- Start from a simplified Solar System (Sun and eight planets), empty space, a scenario library of nine additional experiments, or a JSON save. Each experiment is deterministic; Reset restores its initial conditions, including after saving and loading.
- Searchable, categorized library of 14 celestial body templates: stars, planets, moons, asteroids, comets and compact objects.
- Choose a body, then click the orbital plane to place it. Select circular orbital velocity around the locally dominant gravitational body, stationary, or the primary's velocity.
- Inspect and edit mass, radius, name and the complete 3D state vector. Editing a state vector pauses the simulation.
- Orbit, pan, zoom, track an object, show reference rings, show recorded trails, and toggle enhanced vs physical radii.
- Pause or play; time warp from 1× to 1000×, with an accuracy-budget warning and throttling during difficult encounters.
- Save a system locally or export/import a portable JSON file. The snapshot preserves positions, velocities and simulated time, not trail history or camera state.

## Scenario library

Open **Scenario Library** from the main menu. Each scene starts paused and has a suggested time warp; all are editable.

| Scenario | Experiment |
|---|---|
| Three-body Figure Eight | Equal-mass stars initialized in the classic figure-eight choreography |
| Broken Figure Eight | The same initial positions with an 8% velocity perturbation applied to one star before recentering |
| Chaotic Three-body | Unequal stars with non-hierarchical initial conditions |
| Binary Star System | A circular stellar pair with two approximate circumbinary planets |
| Planetary Collision | Two Earth-mass bodies on a head-on collision course |
| Kingdom of Moons | A gas giant with four coplanar moons and one polar moon |
| Asteroid Belt | 36 asteroids between an inner planet and an outer gas giant |
| Crossed Orbits | Coplanar, inclined, polar and retrograde planets |
| Stellar Flyby | A passing star perturbs a small planetary system |

The figure-eight uses a standard equal-mass Newtonian initial condition scaled to AU, solar masses and days. Softening, finite step sizes and perturbations mean exact periodicity is not guaranteed. Other scenarios are stylized experiments, not measured systems or guaranteed long-term stable configurations.

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
- `presets.js` — deterministic initial conditions, metadata and suggested time warp
- `app.js` — interactive perspective projection of the 3D scene with Canvas 2D sphere impostors, orbital camera, object editor, save/import and game loop
- `test-physics.js` — dependency-free tests

```bash
node test-physics.js
```

### Model limitations

This is an educational/gameplay prototype, not a research simulator. Starting orbits are approximate circular coplanar orbits, not date-specific ephemerides. Reference rings show those approximate initial orbital distances, while trails show actual simulated history. Gravity is Newtonian, with small-scale softening; collisions merge mass and momentum but do not model fragmentation, atmospheres or thermodynamics. Compact objects do not model relativistic gravity, lensing, accretion or event horizons. Rendered radii are enhanced by default and can be switched to true physical radii. The renderer uses 3D coordinates and a perspective camera but not a WebGL mesh engine. The simulation is O(N²) with a 100-body cap. 1× corresponds to 0.2 simulated days per wall-clock second; 1000× requests 200 simulated days per second. The integrator may throttle during close encounters and on slower machines. The default scene is a planetary system rather than a full galaxy with billions of stars.

## Possible next steps

- WebGL renderer with procedural surface textures, atmosphere shaders, HDR glow and realistic rings
- Additional scenario types and user-defined preset library
- Orbit prediction and orbit-element editor, time rewind, timeline and energy diagnostics
- GPU/worker-based gravity and larger systems
