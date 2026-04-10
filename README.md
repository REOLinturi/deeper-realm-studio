# Deeper Realm Studio

`Deeper Realm Studio` is a zero-dependency Julia-fractal app that runs directly in a browser and uses `WebGL2` for fast GPU rendering.

## What It Does

- Realtime Julia fractal rendering with adaptive iteration depth
- Artistic color shaping through palette presets, hue shift, glow, contrast, and orbit-trap styling
- Manual navigation with mouse and keyboard
- An automated navigation button for hands-free deeper dives
- Live recording to `webm`
- Keyframe capture plus scripted path rendering to `webm`
- PNG frame export

## Run It

Open [index.html](/C:/Codex_Demot/Fractal_demo/index.html) in a modern browser with `WebGL2` support.

No build step is required.

## Controls

- `Mouse wheel`: zoom toward the cursor
- `Drag`: pan the view
- `Alt + drag` or right drag: steer the Julia constant
- `W A S D` or arrow keys: pan
- `Q / E`: zoom in or out
- `Space`: toggle automated navigation

## Notes

- This environment has an NVIDIA GPU available, but `nvcc` and the Rust toolchain were not installed locally, so the app uses browser GPU acceleration for the fastest no-setup path.
- Video export uses the browser `MediaRecorder` API and downloads `webm` files.
