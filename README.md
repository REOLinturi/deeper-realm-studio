# Deeper Realm Studio

`Deeper Realm Studio` is a browser instrument for exploring Julia fractals and filming a flight through them. It opens on a lit 3D sculpture. Select **2D plane** to explore the complex Julia set, or choose a specimen to load its shape, camera and palette.

## What It Does

- Realtime Julia fractal rendering with adaptive iteration depth
- Artistic color shaping through palette presets, hue shift, glow, contrast, and orbit-trap styling
- Manual navigation with mouse and keyboard
- Guided flight with surface tracking in 3D and boundary tracking in 2D
- Live recording to `webm`
- Keyframe capture plus scripted path rendering to `webm`
- PNG frame export

## The Sculpture

The GPU iterates the quadratic quaternion map `q -> q*q + c`. Three components of the starting point are spatial coordinates. **Cross section** sets the fourth. Rays from a perspective camera approach the fractal using a distance estimate. Surface normals, shadows and orbit-trap colors reveal folds and cavities as the camera moves.

**Guided flight** samples a small grid ahead of the camera, seeks neighboring surface hits at different depths, and eases between wide shots and close-ups. **Find detail** reframes the current specimen on demand. On the plane, flight seeks changes in escape time and pulls back to regain a wider view. Drag to take over, or pause to compose a still. Flight starts paused when the browser requests reduced motion.

## Run It

Open `index.html` locally in a modern browser with `WebGL2` support, or use the published GitHub Pages site:

https://reolinturi.github.io/deeper-realm-studio/

No build step is required.

## Controls

- `Mouse wheel` or the on-screen zoom buttons: change magnification. On the plane the wheel zooms toward the cursor.
- `Drag`: orbit the sculpture or pan the plane
- `Alt + drag` or right drag: steer the Julia constant
- `W A S D` or arrow keys: orbit or pan
- `Q / E`: zoom in or out
- `Space`: toggle automated navigation

## Notes

- Open **Navigation** and lower **Resolution Scale** to reduce GPU load. The 3D renderer limits its default pixel budget.
- Capture keyframes to store the active view, camera, cross section and color settings. A path between 2D and 3D cuts to the other projection halfway between its keyframes.
- Video export uses the browser `MediaRecorder` API and downloads `webm` files.
