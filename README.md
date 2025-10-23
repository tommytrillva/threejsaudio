# Three.js Audio Reactive Particles

This project showcases a browser-based particle art experience powered by [Three.js](https://threejs.org/), the Web Audio API, and [dat.GUI](https://github.com/dataarts/dat.gui). Upload any MP3 file and watch a volumetric particle cloud respond in real time to the music's spectrum and amplitude. Tweak simulation parameters on the fly to craft your own generative visuals.

## Features

- **MP3 uploader** driven by the Web Audio API for real-time FFT analysis.
- **High-performance particle field** rendered with `THREE.Points` and buffer geometries.
- **Dynamic color mapping** that blends low, mid, and high frequencies into vibrant gradients.
- **Configurable controls** (speed, velocity, scale, color sensitivity, audio sensitivity, and particle count) exposed through dat.GUI.
- **Responsive layout** with status messaging, playback controls, and graceful error handling.

## Getting Started

### Quick Preview

1. Install dependencies (installs a lightweight static file server).
   ```bash
   npm install
   ```
2. Launch the development server.
   ```bash
   npm start
   ```
3. Open the app at <http://localhost:5173> to interact with the particle field.
4. Upload an MP3 file using the control panel and adjust the sliders to tune the simulation.

### Alternative

If you already have a favorite static server, you can serve the root directory however you like (for example `python -m http.server` or `npx serve .`). Just open the reported URL in a modern browser with WebGL support.

> **Tip:** Higher particle counts are visually rich but require more GPU power. Reduce the particle count if you notice performance issues.

## Project Structure

- `index.html` – Markup for the canvas, controls, and module loader.
- `style.css` – Presentation layer for the overlay UI and background.
- `main.js` – Three.js scene setup, audio analysis, dat.GUI integration, and animation loop.

Feel free to extend the simulation with additional visual effects, post-processing, or alternate control panels.
