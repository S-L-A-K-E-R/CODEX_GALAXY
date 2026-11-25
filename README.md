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

- Start from a simplified Solar System (Sun and eight planets), a date-specific Solar System using **NOW**, empty space, a scenario library of nine additional experiments, or a JSON save. Each experiment is deterministic; Reset restores its initial conditions, including after saving and loading.
- Searchable, categorized library of 14 celestial body templates: stars, planets, moons, asteroids, comets and compact objects.
- Choose a body and click the orbital plane. Set a custom launch vector (default) by dragging from the preview and confirming; or choose circular orbital, stationary, or primary velocity for immediate insertion.
- Inspect and edit mass, radius, name and the complete 3D state vector. Editing a state vector pauses the simulation.
- Orbit, pan, zoom, track an object, show reference rings, show recorded trails, and toggle enhanced vs physical radii.
- Pause or play; time warp from 1× to 1000×, with an accuracy-budget warning and throttling during difficult encounters.
- Save a system locally or export/import a portable JSON file. The snapshot preserves positions, velocities and simulated time, not trail history or camera state.

## Custom launch velocity

1. Pick a body from the library; leave Velocity on **Custom vector**.
2. Click the orbital plane to lock its position. The simulation pauses and a ghost appears; the body has not been inserted yet.
3. Drag outward from the ghost to aim the green velocity arrow. Longer drags set higher speeds; the sensitivity menu gives km/s per screen pixel (0.005 to 5). Drag again to revise the direction.
4. Optionally type an exact speed (0–10,000 km/s), azimuth (+X toward +Z), or elevation (+Y) for a fully 3D launch. The readout shows XYZ velocity components in km/s. The arrow is a screen-space preview, not a predicted trajectory, and extreme lengths are capped visually.
5. Click **Insert object** or press Enter when the viewport is focused. Press Play to simulate. Reposition returns to the first step; Esc or × cancels without adding a body.

Dragging aims in the XZ orbital plane; enter elevation for an inclined launch. Velocity is absolute in the simulation frame, not added to the primary's velocity. While aiming, shift/right drag pans and scrolling zooms; reposition or tilt the camera before aiming if the orbital plane is edge-on. Invalid positions, overlaps and non-finite or out-of-range launch inputs are rejected. Circular orbit, stationary and primary velocity remain selectable for one-click insertion.

## Force analysis

Select any body to inspect its gravitational interactions. Amber dashed arrows show each other body's pull; the thicker cyan arrow is the vector sum. The viewport's **↗** button hides or restores the overlay. The inspector reports net force in newtons, XYZ force components, net acceleration in m/s², and all source magnitudes ranked by their share of the sum of individual magnitudes (not the net force). Hover a source row for its XYZ components. These values update during play, while paused, and after edits.

Arrows are camera-projected 3D directions with relative screen lengths. Logarithmic scaling is the default so weak forces remain visible; choose Linear to compare magnitudes proportionally before projection. End-on or very small arrows may be invisible; only the strongest few sources get viewport labels, but every source remains in the list. Zero net force has no resultant arrow. Diagnostics share the integrator's softened Newtonian gravity formula; no other physical forces are modeled.

## Solar System Now

Select **NOW** next to Solar System to initialize the Sun and eight planets at the current device-clock instant. The scene starts paused; the UTC simulation date advances with the existing time warp when you press Play. Reset recreates the original launch epoch, and local/JSON saves preserve it. Choose NOW again for a fresh snapshot.

The calculation is entirely offline, using [NASA/JPL's approximate planetary elements, Table 1](https://ssd.jpl.nasa.gov/planets/approx_pos.html), valid for 1800–2050. Positions are elliptical and inclined; velocities are derived from the same position model. Earth represents the Earth–Moon barycenter with combined mass; moons and other small bodies are not separately modeled. UTC is used as an approximation to ephemeris time. This is not a live Horizons feed or a precision ephemeris, and subsequent evolution follows the sandbox's physics, not continuous ephemeris corrections.

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
| Aim custom launch | Left drag outward from the preview; use numeric fields for exact 3D velocity |
| Confirm launch | Insert object button or Enter with viewport focus |
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

This is an educational/gameplay prototype, not a research simulator. Classic starting orbits are approximate circular coplanar orbits; NOW uses approximate date-specific orbital elements. Reference rings show those approximate initial orbital distances, while trails show actual simulated history. Gravity is Newtonian, with small-scale softening; collisions merge mass and momentum but do not model fragmentation, atmospheres or thermodynamics. Compact objects do not model relativistic gravity, lensing, accretion or event horizons. Rendered radii are enhanced by default and can be switched to true physical radii. The renderer uses 3D coordinates and a perspective camera but not a WebGL mesh engine. The simulation is O(N²) with a 100-body cap. 1× corresponds to 0.2 simulated days per wall-clock second; 1000× requests 200 simulated days per second. The integrator may throttle during close encounters and on slower machines. The default scene is a planetary system rather than a full galaxy with billions of stars.

## Possible next steps

- WebGL renderer with procedural surface textures, atmosphere shaders, HDR glow and realistic rings
- Additional scenario types and user-defined preset library
- Orbit prediction and orbit-element editor, time rewind, timeline and energy diagnostics
- GPU/worker-based gravity and larger systems
