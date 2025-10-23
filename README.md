# Three.js Audio Reactive Particles

This project showcases a browser-based particle art experience powered by [Three.js](https://threejs.org/), the Web Audio API, and [dat.GUI](https://github.com/dataarts/dat.gui). Upload any MP3 file and watch a volumetric particle cloud respond in real time to the music's spectrum and amplitude. Tweak simulation parameters on the fly to craft your own generative visuals.

## Features

- **MP3 uploader** driven by the Web Audio API for real-time FFT analysis.
- **High-performance particle field** rendered with `THREE.Points` and buffer geometries.
- **Dynamic color mapping** that blends low, mid, and high frequencies into vibrant gradients.
- **Configurable controls** (speed, velocity, scale, color sensitivity, audio sensitivity, and particle count) exposed through dat.GUI.
- **Responsive layout** with status messaging, playback controls, and graceful error handling.

## Getting Started

### View the app right away

You have a few options depending on whether you want to preview locally or host a public link:

#### Option A – open the files directly (fastest)

1. Download or clone this repository.
2. Double-click `index.html` (or drag it into a browser tab). Because the JavaScript modules are served from a CDN you do **not** need a build step or local server.
3. Upload an MP3 using the sidebar and start tweaking the sliders.

#### Option B – lightweight local server

1. Install dependencies (installs a lightweight static file server).
   ```bash
   npm install
   ```
2. Launch the development server.
   ```bash
   npm start
   ```
3. Open the app at <http://localhost:5173>.
4. Upload an MP3 file using the control panel and adjust the sliders to tune the simulation.

#### Option C – publish a shareable GitHub Pages link

1. Push the project to a GitHub repository (or fork this one).
2. Ensure GitHub Pages is enabled: open **Settings → Pages**, choose **GitHub Actions** as the source, and keep the default branch.
3. The included workflow [`deploy.yml`](.github/workflows/deploy.yml) will build and publish automatically on every push to `main`.
4. When the workflow completes, GitHub posts a green checkmark with a "View deployment" link—click it to open your hosted simulation at `https://<your-username>.github.io/<repo-name>/`.

### Cloud-based previews

You do not need to install anything locally—these options run entirely in the browser.

#### Gitpod one-click workspace

1. Push the project to your own GitHub account or fork the repository.
2. Replace `YOUR_GITHUB_USERNAME` in the button URL below with your GitHub handle.
3. Click the button. Gitpod will create a temporary VS Code-like workspace and expose a web preview automatically.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/YOUR_GITHUB_USERNAME/threejsaudio)

The included [`gitpod.yml`](./gitpod.yml) file automatically starts a Python static server and publishes it on port **4173**. When the workspace loads, Gitpod opens the preview in a new tab so you can interact with the simulation immediately.

#### StackBlitz instant preview

StackBlitz can also host the project straight from GitHub:

1. Ensure the repository is available on GitHub.
2. Visit `https://stackblitz.com/github/YOUR_GITHUB_USERNAME/threejsaudio?file=index.html` (swap in your GitHub handle).
3. StackBlitz spins up a WebContainer session and serves the app without any local tooling.

#### GitHub Pages permanent link

If you want a sharable link that stays live, enable GitHub Pages:

1. Push the project to GitHub.
2. Go to **Settings → Pages** and choose **GitHub Actions** as the source. The included workflow (`.github/workflows/deploy.yml`) handles the rest.
3. GitHub will publish your site at `https://<your-username>.github.io/threejsaudio/` after the action finishes.

#### Drag-and-drop hosting (Netlify Drop)

For a quick throwaway deployment without creating accounts:

1. Download this repository as a ZIP archive.
2. Visit <https://app.netlify.com/drop> and drag the ZIP file onto the page.
3. Netlify will upload the static files and give you a unique URL you can open or share.

### Alternative local servers

If you already have a favorite static server, you can serve the root directory however you like (for example `python -m http.server` or `npx serve .`). Just open the reported URL in a modern browser with WebGL support.
1. Serve the project with any static file server. For example:
   ```bash
   npx serve .
   ```
2. Open the served URL (typically <http://localhost:3000>) in a modern browser with WebGL support.
3. Upload an MP3 file using the control panel and adjust the sliders to tune the simulation.

> **Tip:** Higher particle counts are visually rich but require more GPU power. Reduce the particle count if you notice performance issues.

## Project Structure

- `index.html` – Markup for the canvas, controls, and module loader.
- `style.css` – Presentation layer for the overlay UI and background.
- `main.js` – Three.js scene setup, audio analysis, dat.GUI integration, and animation loop.

Feel free to extend the simulation with additional visual effects, post-processing, or alternate control panels.
