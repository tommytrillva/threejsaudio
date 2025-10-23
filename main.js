import * as THREE from 'three';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x05060a, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a, 0.002); // Adds depth to the particle field.

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 30, 220);

const lookTarget = new THREE.Vector3(0, 0, 0);
const clock = new THREE.Clock();

const params = {
  speed: 1.25,
  velocity: 1.6,
  scale: 1.4,
  colorSensitivity: 1.5,
  audioSensitivity: 3.0,
  particleCount: 8000,
};

const audioUpload = document.getElementById('audio-upload');
const audioElement = document.getElementById('audio-player');
const statusMessage = document.getElementById('status-message');
const youtubeUrlInput = document.getElementById('youtube-url');
const youtubeLoadBtn = document.getElementById('youtube-load');

audioElement.controls = true;
audioElement.preload = 'auto';
audioElement.crossOrigin = 'anonymous';

audioUpload.addEventListener('change', handleAudioUpload);
youtubeLoadBtn.addEventListener('click', handleYouTubeLoad);

audioElement.addEventListener('play', () => {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  const fileName = lastUploadedFileName || 'Custom Audio';
  setStatus(`Playing: ${fileName}`);
});

audioElement.addEventListener('pause', () => {
  const fileName = lastUploadedFileName || 'Custom Audio';
  setStatus(`Audio paused: ${fileName}. Adjust the controls or resume playback.`);
});

audioElement.addEventListener('ended', () => {
  setStatus('Playback ended. Upload another MP3 or press play to listen again.');
});

audioElement.addEventListener('error', () => {
  setStatus('Unable to play the selected file. Please choose another MP3.');
});

let audioContext;
let analyser;
let mediaElementSource;
let frequencyData;
let currentObjectUrl;
let lastUploadedFileName = '';

let particleSystem;
let particleGeometry;
let particleMaterial;
let particleDirections;
let currentParticleCount = 0;

createParticleSystem(params.particleCount);

window.addEventListener('resize', onWindowResize);

animate();

function createParticleSystem(count) {
  if (particleSystem) {
    scene.remove(particleSystem);
    particleGeometry?.dispose();
    particleMaterial?.dispose();
  }

  currentParticleCount = count;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  particleDirections = new Float32Array(count * 3);
  const radius = 180;

  for (let i = 0; i < count; i += 1) {
    const idx = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    const r = radius * Math.cbrt(Math.random());

    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);

    const dir = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
    ).normalize();

    particleDirections[idx] = dir.x;
    particleDirections[idx + 1] = dir.y;
    particleDirections[idx + 2] = dir.z;

    const color = new THREE.Color().setHSL(0.58 + Math.random() * 0.1, 0.6, 0.55);
    colors[idx] = color.r;
    colors[idx + 1] = color.g;
    colors[idx + 2] = color.b;
  }

  particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  particleMaterial = new THREE.PointsMaterial({
    size: params.scale,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
}

function handleAudioUpload(event) {
  const [file] = event.target.files;

  if (!file) {
    setStatus('No file selected.');
    return;
  }

  if (!file.type || !file.type.startsWith('audio/')) {
    setStatus('Unsupported file type. Please upload an MP3 audio file.');
    return;
  }

  const isMp3 = /mp3|mpeg/i.test(file.type) || file.name.toLowerCase().endsWith('.mp3');
  if (!isMp3) {
    setStatus('This demo currently supports MP3 files.');
    return;
  }

  try {
    initialiseAudioGraph();
  } catch (error) {
    console.error('Audio initialisation failed', error);
    setStatus('Unable to initialise audio. Please try a different browser or reload the page.');
    return;
  }

  if (audioContext?.state === 'suspended') {
    audioContext.resume().catch(() => {
      /* Ignore resume errors; user interaction will be required. */
    });
  }

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }

  currentObjectUrl = URL.createObjectURL(file);
  audioElement.src = currentObjectUrl;
  audioElement.load();
  lastUploadedFileName = file.name;
  setStatus('Loading audio…');

  audioElement
    .play()
    .then(() => {
      setStatus(`Playing: ${file.name}`);
    })
    .catch(() => {
      setStatus('Press play on the audio controls to begin the simulation.');
    });

  audioUpload.value = '';
}

function initialiseAudioGraph() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Provides 1024 frequency bins.
    analyser.smoothingTimeConstant = 0.7;
  }

  if (!mediaElementSource) {
    mediaElementSource = audioContext.createMediaElementSource(audioElement);
    mediaElementSource.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  if (!frequencyData || frequencyData.length !== analyser.frequencyBinCount) {
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;
  const spectral = getSpectralData();

  updateParticles(delta, elapsed, spectral);
  updateCamera(elapsed, spectral);

  renderer.render(scene, camera);
}

function getSpectralData() {
  if (!analyser || !frequencyData) {
    return { low: 0, mid: 0, high: 0, overall: 0 };
  }

  analyser.getByteFrequencyData(frequencyData);

  const length = frequencyData.length;
  if (length === 0) {
    return { low: 0, mid: 0, high: 0, overall: 0 };
  }

  let low = 0;
  let mid = 0;
  let high = 0;
  let total = 0;

  const lowEnd = Math.floor(length * 0.33);
  const midEnd = Math.floor(length * 0.66);
  const lowScale = lowEnd || 1;
  const midScale = midEnd - lowEnd || 1;
  const highScale = length - midEnd || 1;

  for (let i = 0; i < length; i += 1) {
    const value = frequencyData[i] / 255;
    total += value;

    if (i < lowEnd) {
      low += value;
    } else if (i < midEnd) {
      mid += value;
    } else {
      high += value;
    }
  }

  return {
    low: THREE.MathUtils.clamp(low / lowScale, 0, 1),
    mid: THREE.MathUtils.clamp(mid / midScale, 0, 1),
    high: THREE.MathUtils.clamp(high / highScale, 0, 1),
    overall: THREE.MathUtils.clamp(total / length, 0, 1),
  };
}

function updateParticles(delta, elapsed, spectral) {
  if (!particleGeometry || !particleMaterial) {
    return;
  }

  const positions = particleGeometry.attributes.position.array;
  const colors = particleGeometry.attributes.color.array;
  const count = currentParticleCount;
  const limit = 260;

  const audioBoost = 1 + spectral.overall * params.audioSensitivity;
  const baseMove = params.speed * delta * 60;
  const driftStrength = spectral.high * params.velocity * 0.4;

  for (let i = 0; i < count; i += 1) {
    const idx = i * 3;

    let dirX = particleDirections[idx];
    let dirY = particleDirections[idx + 1];
    let dirZ = particleDirections[idx + 2];

    dirX += (Math.sin(elapsed * 0.6 + idx) * 0.5 - 0.25) * driftStrength * delta;
    dirY += (Math.cos(elapsed * 0.4 + idx) * 0.5 - 0.25) * driftStrength * delta;
    dirZ += (Math.sin(elapsed * 0.7 + idx) * 0.5 - 0.25) * driftStrength * delta;

    const dirLength = Math.hypot(dirX, dirY, dirZ) || 1;
    dirX /= dirLength;
    dirY /= dirLength;
    dirZ /= dirLength;

    particleDirections[idx] = dirX;
    particleDirections[idx + 1] = dirY;
    particleDirections[idx + 2] = dirZ;

    const movement = params.velocity * baseMove * audioBoost;
    positions[idx] += dirX * movement;
    positions[idx + 1] += dirY * movement;
    positions[idx + 2] += dirZ * movement;

    positions[idx] += Math.sin(elapsed * 0.5 + i * 0.002) * spectral.mid * 8 * delta;
    positions[idx + 1] += Math.cos(elapsed * 0.3 + i * 0.0025) * spectral.low * 9 * delta;
    positions[idx + 2] += Math.sin(elapsed * 0.4 + i * 0.0015) * spectral.high * 10 * delta;

    if (positions[idx] > limit) positions[idx] = -limit;
    else if (positions[idx] < -limit) positions[idx] = limit;
    if (positions[idx + 1] > limit) positions[idx + 1] = -limit;
    else if (positions[idx + 1] < -limit) positions[idx + 1] = limit;
    if (positions[idx + 2] > limit) positions[idx + 2] = -limit;
    else if (positions[idx + 2] < -limit) positions[idx + 2] = limit;

    const noise = (Math.sin(elapsed + i * 0.01) + 1) * 0.5;
    const red = THREE.MathUtils.clamp(0.15 + spectral.low * params.colorSensitivity * (0.5 + noise), 0, 1);
    const green = THREE.MathUtils.clamp(0.18 + spectral.mid * params.colorSensitivity * (1 - noise * 0.5), 0, 1);
    const blue = THREE.MathUtils.clamp(0.25 + spectral.high * params.colorSensitivity * (0.3 + noise), 0, 1);

    colors[idx] = red;
    colors[idx + 1] = green;
    colors[idx + 2] = blue;
  }

  particleGeometry.attributes.position.needsUpdate = true;
  particleGeometry.attributes.color.needsUpdate = true;

  const pixelRatioScalar = window.devicePixelRatio > 1 ? 1.5 : 1;
  const targetSize = params.scale * pixelRatioScalar * (1 + spectral.low * 0.6 + spectral.overall * 0.4);
  particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, targetSize, 0.18);
  particleMaterial.opacity = THREE.MathUtils.clamp(
    0.4 + spectral.overall * params.audioSensitivity * 0.08,
    0.35,
    1,
  );
}

function updateCamera(elapsed, spectral) {
  const sway = spectral.mid * 12;
  camera.position.x = Math.sin(elapsed * 0.2) * (30 + sway * 0.8);
  camera.position.y = 20 + Math.cos(elapsed * 0.15) * (10 + spectral.low * 15);
  camera.lookAt(lookTarget);
}

function onWindowResize() {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function setStatus(message) {
  statusMessage.textContent = message;
}

async function handleYouTubeLoad() {
  const url = youtubeUrlInput.value.trim();

  if (!url) {
    setStatus('Please enter a YouTube URL.');
    return;
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    setStatus('Invalid YouTube URL. Please check and try again.');
    return;
  }

  youtubeLoadBtn.disabled = true;
  setStatus('Fetching audio from YouTube...');

  try {
    const apiUrl = `https://yt-dlp-api.fly.dev/api/info?url=https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch video information');
    }

    const data = await response.json();

    const audioFormat = data.formats?.find(
      (f) => f.acodec !== 'none' && f.vcodec === 'none'
    ) || data.formats?.find((f) => f.acodec !== 'none');

    if (!audioFormat || !audioFormat.url) {
      throw new Error('No audio stream found for this video');
    }

    try {
      initialiseAudioGraph();
    } catch (error) {
      console.error('Audio initialisation failed', error);
      setStatus('Unable to initialise audio. Please try a different browser or reload the page.');
      youtubeLoadBtn.disabled = false;
      return;
    }

    if (audioContext?.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }

    audioElement.src = audioFormat.url;
    audioElement.load();
    lastUploadedFileName = data.title || 'YouTube Audio';
    setStatus('Loading audio from YouTube...');

    audioElement
      .play()
      .then(() => {
        setStatus(`Playing: ${lastUploadedFileName}`);
        youtubeUrlInput.value = '';
      })
      .catch(() => {
        setStatus('Press play on the audio controls to begin the simulation.');
      })
      .finally(() => {
        youtubeLoadBtn.disabled = false;
      });

  } catch (error) {
    console.error('YouTube load error:', error);
    setStatus(`Error: ${error.message || 'Unable to load YouTube audio. Please try another video.'}`);
    youtubeLoadBtn.disabled = false;
  }
}

function extractYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
