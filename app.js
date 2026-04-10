(() => {
  const canvas = document.getElementById('fractal-canvas');
  const overlay = document.getElementById('overlay-message');

  const stats = {
    fps: document.getElementById('fps-stat'),
    zoom: document.getElementById('zoom-stat'),
    depth: document.getElementById('depth-stat'),
    iterations: document.getElementById('iter-stat'),
    constant: document.getElementById('c-stat'),
    mode: document.getElementById('mode-stat'),
  };

  const ui = {
    paletteSelect: document.getElementById('palette-select'),
    hueShift: document.getElementById('hue-shift'),
    saturation: document.getElementById('saturation'),
    contrast: document.getElementById('contrast'),
    glow: document.getElementById('glow'),
    trapStrength: document.getElementById('trap-strength'),
    constantReal: document.getElementById('constant-real'),
    constantImag: document.getElementById('constant-imag'),
    baseIterations: document.getElementById('base-iterations'),
    detailBoost: document.getElementById('detail-boost'),
    escapeRadius: document.getElementById('escape-radius'),
    rotationDeg: document.getElementById('rotation-deg'),
    zoomSpeed: document.getElementById('zoom-speed'),
    resolutionScale: document.getElementById('resolution-scale'),
    autoSpeed: document.getElementById('auto-speed'),
    autoDrift: document.getElementById('auto-drift'),
    recordFps: document.getElementById('record-fps'),
    pathDuration: document.getElementById('path-duration'),
    resetViewBtn: document.getElementById('reset-view-btn'),
    randomConstantBtn: document.getElementById('random-constant-btn'),
    autoNavBtn: document.getElementById('auto-nav-btn'),
    saveFrameBtn: document.getElementById('save-frame-btn'),
    liveRecordBtn: document.getElementById('live-record-btn'),
    renderPathBtn: document.getElementById('render-path-btn'),
    captureKeyframeBtn: document.getElementById('capture-keyframe-btn'),
    clearKeyframesBtn: document.getElementById('clear-keyframes-btn'),
    keyframeList: document.getElementById('keyframe-list'),
  };

  const formatters = {
    'hue-shift': (v) => Number(v).toFixed(2),
    saturation: (v) => Number(v).toFixed(2),
    contrast: (v) => Number(v).toFixed(2),
    glow: (v) => Number(v).toFixed(2),
    'trap-strength': (v) => Number(v).toFixed(2),
    'constant-real': (v) => Number(v).toFixed(3),
    'constant-imag': (v) => Number(v).toFixed(3),
    'base-iterations': (v) => String(Math.round(v)),
    'detail-boost': (v) => String(Math.round(v)),
    'escape-radius': (v) => Number(v).toFixed(1),
    'rotation-deg': (v) => `${Math.round(v)} deg`,
    'zoom-speed': (v) => Number(v).toFixed(3),
    'resolution-scale': (v) => Number(v).toFixed(2),
    'auto-speed': (v) => Number(v).toFixed(2),
    'auto-drift': (v) => Number(v).toFixed(2),
    'record-fps': (v) => String(Math.round(v)),
    'path-duration': (v) => `${Number(v).toFixed(1)} s`,
  };

  const paletteLibrary = {
    'Solar Tide': { a: [0.5, 0.47, 0.52], b: [0.47, 0.42, 0.34], c: [0.92, 0.76, 0.58], d: [0.14, 0.28, 0.52] },
    'Lagoon Prism': { a: [0.4, 0.48, 0.56], b: [0.4, 0.36, 0.42], c: [0.88, 0.96, 0.72], d: [0.1, 0.18, 0.46] },
    'Ember Cathedral': { a: [0.55, 0.34, 0.22], b: [0.36, 0.28, 0.2], c: [0.94, 0.78, 0.61], d: [0.08, 0.17, 0.28] },
    'Nocturne Bloom': { a: [0.33, 0.3, 0.52], b: [0.42, 0.26, 0.38], c: [1.1, 0.78, 0.66], d: [0.32, 0.18, 0.68] },
    'Aurora Ink': { a: [0.34, 0.46, 0.41], b: [0.38, 0.38, 0.3], c: [0.86, 1.02, 0.7], d: [0.19, 0.28, 0.44] },
  };

  const curatedConstants = [
    { label: 'Classic Spiral', re: -0.78, im: 0.136 },
    { label: 'Dust Cathedral', re: -0.7269, im: 0.1889 },
    { label: 'Seahorse Bloom', re: -0.4, im: 0.6 },
    { label: 'Electric Lace', re: 0.285, im: 0.01 },
    { label: 'Night Garden', re: -0.8, im: 0.156 },
    { label: 'Bone Mirror', re: 0.285, im: 0.013 },
    { label: 'Twin Storm', re: -0.70176, im: -0.3842 },
  ];

  const state = {
    centerX: 0,
    centerY: 0,
    scale: 1.75,
    cRe: -0.78,
    cIm: 0.136,
    baseIterations: 240,
    detailBoost: 14,
    escapeRadius: 8,
    rotationDeg: -12,
    zoomSpeed: 1.08,
    resolutionScale: 1,
    hueShift: 0.02,
    saturation: 1.12,
    contrast: 1.15,
    glow: 0.72,
    trapStrength: 0.95,
    autoSpeed: 0.55,
    autoDrift: 0.32,
    recordFps: 30,
    pathDuration: 12,
    autoNavigate: false,
    paletteName: 'Solar Tide',
    palette: clonePalette(paletteLibrary['Solar Tide']),
    dirty: true,
  };

  const runtime = {
    render: null,
    pointer: { active: false, mode: 'pan', lastX: 0, lastY: 0 },
    keys: new Set(),
    fpsSmoothed: 0,
    lastFrameTime: performance.now(),
    lastHudUpdate: 0,
    messageTimer: 0,
    keyframes: [],
    autoAnchor: null,
    autoStartedAt: 0,
    recorderState: null,
    pathRender: null,
  };

  function clonePalette(palette) {
    return { a: palette.a.slice(), b: palette.b.slice(), c: palette.c.slice(), d: palette.d.slice() };
  }

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothStep(t) {
    return t * t * (3 - 2 * t);
  }

  function wrapDegrees(value) {
    let result = value;
    while (result > 180) result -= 360;
    while (result < -180) result += 360;
    return result;
  }

  function markDirty() {
    state.dirty = true;
  }

  function formatComplex(real, imag) {
    const sign = imag >= 0 ? '+' : '-';
    return `${real.toFixed(3)} ${sign} ${Math.abs(imag).toFixed(3)}i`;
  }

  function formatZoom() {
    const zoom = 1.75 / state.scale;
    return zoom < 1e4 ? `${zoom.toFixed(2)}x` : `${zoom.toExponential(2)}x`;
  }

  function formatDepth() {
    const depth = Math.log10(Math.max(1, 1.75 / state.scale));
    if (depth < 0.8) return 'surface';
    if (depth < 2) return 'inner ring';
    if (depth < 4) return 'deep fold';
    if (depth < 6) return 'echo chamber';
    return 'abyssal weave';
  }

  function getEffectiveIterations() {
    const zoomTerm = Math.max(0, Math.log2(1.75 / state.scale));
    return Math.min(1800, Math.round(state.baseIterations + zoomTerm * state.detailBoost));
  }

  function setMessage(text, duration = 1800) {
    clearTimeout(runtime.messageTimer);
    overlay.textContent = text;
    overlay.classList.add('visible');
    runtime.messageTimer = setTimeout(() => overlay.classList.remove('visible'), duration);
  }

  function populatePaletteOptions() {
    Object.keys(paletteLibrary).forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      ui.paletteSelect.appendChild(option);
    });
    ui.paletteSelect.value = state.paletteName;
  }

  function applyPalettePreset(name) {
    const preset = paletteLibrary[name];
    if (!preset) return;
    state.paletteName = name;
    state.palette = clonePalette(preset);
    ui.paletteSelect.value = name;
    markDirty();
  }

  function updateRangeOutputs() {
    document.querySelectorAll('[data-output]').forEach((node) => {
      const id = node.getAttribute('data-output');
      const input = document.getElementById(id);
      const format = formatters[id] || ((value) => value);
      if (input) node.textContent = format(input.value);
    });
  }

  function syncControlsFromState() {
    ui.paletteSelect.value = state.paletteName;
    ui.hueShift.value = String(state.hueShift);
    ui.saturation.value = String(state.saturation);
    ui.contrast.value = String(state.contrast);
    ui.glow.value = String(state.glow);
    ui.trapStrength.value = String(state.trapStrength);
    ui.constantReal.value = String(state.cRe);
    ui.constantImag.value = String(state.cIm);
    ui.baseIterations.value = String(state.baseIterations);
    ui.detailBoost.value = String(state.detailBoost);
    ui.escapeRadius.value = String(state.escapeRadius);
    ui.rotationDeg.value = String(state.rotationDeg);
    ui.zoomSpeed.value = String(state.zoomSpeed);
    ui.resolutionScale.value = String(state.resolutionScale);
    ui.autoSpeed.value = String(state.autoSpeed);
    ui.autoDrift.value = String(state.autoDrift);
    ui.recordFps.value = String(state.recordFps);
    ui.pathDuration.value = String(state.pathDuration);
    updateRangeOutputs();
    updateButtons();
  }

  function updateButtons() {
    ui.autoNavBtn.textContent = state.autoNavigate ? 'Stop Automated Navigation' : 'Start Automated Navigation';
    ui.autoNavBtn.classList.toggle('active', state.autoNavigate);
    const isLiveRecording = runtime.recorderState && runtime.recorderState.mode === 'live';
    ui.liveRecordBtn.textContent = isLiveRecording ? 'Stop Live Record' : 'Start Live Record';
    ui.liveRecordBtn.classList.toggle('active', Boolean(runtime.recorderState));
    ui.renderPathBtn.disabled = Boolean(runtime.recorderState);
    ui.captureKeyframeBtn.disabled = Boolean(runtime.pathRender);
    ui.clearKeyframesBtn.disabled = runtime.keyframes.length === 0;
  }

  function updateStats() {
    stats.fps.textContent = runtime.fpsSmoothed.toFixed(1);
    stats.zoom.textContent = formatZoom();
    stats.depth.textContent = formatDepth();
    stats.iterations.textContent = String(getEffectiveIterations());
    stats.constant.textContent = formatComplex(state.cRe, state.cIm);
    const modes = [state.autoNavigate ? 'auto' : 'manual'];
    if (runtime.pathRender) modes.push('path');
    if (runtime.recorderState) modes.push('rec');
    stats.mode.textContent = modes.join(' / ');
  }

  function snapshotState(label) {
    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label,
      centerX: state.centerX,
      centerY: state.centerY,
      scale: state.scale,
      cRe: state.cRe,
      cIm: state.cIm,
      baseIterations: state.baseIterations,
      detailBoost: state.detailBoost,
      escapeRadius: state.escapeRadius,
      rotationDeg: state.rotationDeg,
      hueShift: state.hueShift,
      saturation: state.saturation,
      contrast: state.contrast,
      glow: state.glow,
      trapStrength: state.trapStrength,
      paletteName: state.paletteName,
    };
  }

  function applySnapshot(snapshot, sync = true) {
    state.centerX = snapshot.centerX;
    state.centerY = snapshot.centerY;
    state.scale = snapshot.scale;
    state.cRe = snapshot.cRe;
    state.cIm = snapshot.cIm;
    state.baseIterations = snapshot.baseIterations;
    state.detailBoost = snapshot.detailBoost;
    state.escapeRadius = snapshot.escapeRadius;
    state.rotationDeg = snapshot.rotationDeg;
    state.hueShift = snapshot.hueShift;
    state.saturation = snapshot.saturation;
    state.contrast = snapshot.contrast;
    state.glow = snapshot.glow;
    state.trapStrength = snapshot.trapStrength;
    if (snapshot.paletteName && paletteLibrary[snapshot.paletteName]) applyPalettePreset(snapshot.paletteName);
    if (sync) syncControlsFromState();
    markDirty();
  }

  function interpolateSnapshots(a, b, t) {
    const eased = smoothStep(t);
    return {
      centerX: mix(a.centerX, b.centerX, eased),
      centerY: mix(a.centerY, b.centerY, eased),
      scale: Math.exp(mix(Math.log(a.scale), Math.log(b.scale), eased)),
      cRe: mix(a.cRe, b.cRe, eased),
      cIm: mix(a.cIm, b.cIm, eased),
      baseIterations: Math.round(mix(a.baseIterations, b.baseIterations, eased)),
      detailBoost: Math.round(mix(a.detailBoost, b.detailBoost, eased)),
      escapeRadius: mix(a.escapeRadius, b.escapeRadius, eased),
      rotationDeg: mix(a.rotationDeg, b.rotationDeg, eased),
      hueShift: mix(a.hueShift, b.hueShift, eased),
      saturation: mix(a.saturation, b.saturation, eased),
      contrast: mix(a.contrast, b.contrast, eased),
      glow: mix(a.glow, b.glow, eased),
      trapStrength: mix(a.trapStrength, b.trapStrength, eased),
      paletteName: eased < 0.5 ? a.paletteName : b.paletteName,
    };
  }

  function renderKeyframes() {
    ui.keyframeList.innerHTML = '';
    if (!runtime.keyframes.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Capture hand-picked moments, then render a smooth guided dive as a downloadable video.';
      ui.keyframeList.appendChild(empty);
      updateButtons();
      return;
    }

    runtime.keyframes.forEach((keyframe, index) => {
      const item = document.createElement('div');
      item.className = 'keyframe-item';

      const meta = document.createElement('div');
      meta.className = 'keyframe-meta';

      const name = document.createElement('div');
      name.className = 'keyframe-name';
      name.textContent = `${index + 1}. ${keyframe.label}`;

      const detail = document.createElement('div');
      detail.className = 'keyframe-detail';
      detail.textContent = `${formatComplex(keyframe.cRe, keyframe.cIm)} | zoom ${(1.75 / keyframe.scale).toExponential(2)}`;

      const jump = document.createElement('button');
      jump.className = 'mini-button';
      jump.type = 'button';
      jump.textContent = 'Jump';
      jump.addEventListener('click', () => {
        stopAutomatedNavigation(false);
        applySnapshot(keyframe);
        setMessage(`Jumped to ${keyframe.label}.`);
      });

      const remove = document.createElement('button');
      remove.className = 'mini-button';
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        runtime.keyframes = runtime.keyframes.filter((entry) => entry.id !== keyframe.id);
        renderKeyframes();
        setMessage('Keyframe removed.');
      });

      meta.appendChild(name);
      meta.appendChild(detail);
      item.appendChild(meta);
      item.appendChild(jump);
      item.appendChild(remove);
      ui.keyframeList.appendChild(item);
    });

    updateButtons();
  }

  function captureKeyframe() {
    runtime.keyframes.push(snapshotState(`${formatDepth()} ${runtime.keyframes.length + 1}`));
    renderKeyframes();
    setMessage('Keyframe captured.');
  }

  function clearKeyframes() {
    runtime.keyframes = [];
    renderKeyframes();
    setMessage('Keyframes cleared.');
  }

  function chooseRandomConstant() {
    const selection = curatedConstants[Math.floor(Math.random() * curatedConstants.length)];
    state.cRe = selection.re;
    state.cIm = selection.im;
    if (state.autoNavigate && runtime.autoAnchor) {
      runtime.autoAnchor.cRe = selection.re;
      runtime.autoAnchor.cIm = selection.im;
    }
    syncControlsFromState();
    setMessage(`Loaded ${selection.label}.`);
  }

  function resetView() {
    stopAutomatedNavigation(false);
    state.centerX = 0;
    state.centerY = 0;
    state.scale = 1.75;
    state.rotationDeg = -12;
    syncControlsFromState();
    setMessage('View reset.');
  }

  function startAutomatedNavigation() {
    state.autoNavigate = true;
    runtime.autoStartedAt = performance.now();
    runtime.autoAnchor = { cRe: state.cRe, cIm: state.cIm };
    updateButtons();
    setMessage('Automated navigation engaged.');
  }

  function stopAutomatedNavigation(showMessage = true) {
    if (!state.autoNavigate) return;
    state.autoNavigate = false;
    runtime.autoAnchor = null;
    updateButtons();
    if (showMessage) setMessage('Manual control restored.');
  }

  function toggleAutomatedNavigation() {
    if (state.autoNavigate) stopAutomatedNavigation();
    else startAutomatedNavigation();
  }

  function stepAutomatedNavigation(now, dt) {
    if (!state.autoNavigate || runtime.pathRender) return false;
    if (!runtime.autoAnchor) {
      runtime.autoStartedAt = now;
      runtime.autoAnchor = { cRe: state.cRe, cIm: state.cIm };
    }

    const t = (now - runtime.autoStartedAt) * 0.001;
    state.scale *= Math.pow(0.9928, dt * 60 * state.autoSpeed);
    state.scale = clamp(state.scale, 1e-9, 8);

    const drift = state.scale * state.autoDrift;
    state.centerX += Math.cos(t * 0.77) * drift * dt * 0.45;
    state.centerY += Math.sin(t * 0.52) * drift * dt * 0.45;
    state.rotationDeg = wrapDegrees(state.rotationDeg + dt * 16 * state.autoSpeed);

    const swing = 0.12 * state.autoDrift;
    state.cRe = runtime.autoAnchor.cRe + Math.sin(t * 0.38) * swing;
    state.cIm = runtime.autoAnchor.cIm + Math.cos(t * 0.31) * swing;

    syncControlsFromState();
    markDirty();
    return true;
  }

  function savePng() {
    const link = document.createElement('a');
    link.download = `julia-frame-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setMessage('PNG saved.');
  }

  function getRecordingMimeType() {
    if (!window.MediaRecorder) return '';
    const options = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    return options.find((option) => MediaRecorder.isTypeSupported(option)) || '';
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function startRecording(mode) {
    if (runtime.recorderState) {
      setMessage('A recording is already running.');
      return null;
    }
    if (!window.MediaRecorder) {
      setMessage('MediaRecorder is not available in this browser.', 2400);
      return null;
    }

    const mimeType = getRecordingMimeType();
    const stream = canvas.captureStream(state.recordFps);
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks = [];

    let resolveDone;
    const done = new Promise((resolve) => {
      resolveDone = resolve;
    });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => setMessage('Recording failed.', 2400);
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      runtime.recorderState = null;
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      if (blob.size > 0) downloadBlob(blob, `${mode}-julia-${Date.now()}.webm`);
      updateButtons();
      updateStats();
      resolveDone(blob);
      if (!runtime.pathRender) setMessage('Recording saved.');
    };

    recorder.start(250);
    runtime.recorderState = { mode, recorder, done };
    updateButtons();
    updateStats();
    return runtime.recorderState;
  }

  function stopRecording() {
    if (!runtime.recorderState) return Promise.resolve(null);
    const { recorder, done } = runtime.recorderState;
    recorder.stop();
    return done;
  }

  async function toggleLiveRecording() {
    if (runtime.recorderState && runtime.recorderState.mode === 'live') {
      await stopRecording();
      return;
    }
    if (runtime.recorderState) {
      setMessage('Finish the current path render first.', 2200);
      return;
    }
    if (startRecording('live')) setMessage('Live recording started.');
  }

  function interpolatePath(progress) {
    const segmentCount = runtime.keyframes.length - 1;
    const scaled = clamp(progress, 0, 1) * segmentCount;
    const index = Math.min(segmentCount - 1, Math.floor(scaled));
    return interpolateSnapshots(runtime.keyframes[index], runtime.keyframes[index + 1], scaled - index);
  }

  function renderKeyframePath() {
    if (runtime.keyframes.length < 2) {
      setMessage('Capture at least two keyframes first.', 2200);
      return;
    }
    if (runtime.recorderState || runtime.pathRender) {
      setMessage('Finish the current recording first.', 2200);
      return;
    }

    stopAutomatedNavigation(false);
    if (!startRecording('path')) return;
    runtime.pathRender = {
      startedAt: performance.now(),
      durationMs: state.pathDuration * 1000,
      stopQueued: false,
    };
    updateButtons();
    setMessage('Rendering keyframe path. Download will start automatically.', 2600);
  }

  function finishKeyframePath() {
    if (!runtime.pathRender) return;
    runtime.pathRender = null;
    stopRecording().then(() => {
      updateButtons();
      updateStats();
      setMessage('Keyframe path saved.');
    });
  }

  function bindUi() {
    [
      ui.hueShift, ui.saturation, ui.contrast, ui.glow, ui.trapStrength,
      ui.constantReal, ui.constantImag, ui.baseIterations, ui.detailBoost, ui.escapeRadius,
      ui.rotationDeg, ui.zoomSpeed, ui.resolutionScale, ui.autoSpeed, ui.autoDrift,
      ui.recordFps, ui.pathDuration,
    ].forEach((input) => {
      input.addEventListener('input', () => {
        state.hueShift = Number(ui.hueShift.value);
        state.saturation = Number(ui.saturation.value);
        state.contrast = Number(ui.contrast.value);
        state.glow = Number(ui.glow.value);
        state.trapStrength = Number(ui.trapStrength.value);
        state.cRe = Number(ui.constantReal.value);
        state.cIm = Number(ui.constantImag.value);
        state.baseIterations = Number(ui.baseIterations.value);
        state.detailBoost = Number(ui.detailBoost.value);
        state.escapeRadius = Number(ui.escapeRadius.value);
        state.rotationDeg = wrapDegrees(Number(ui.rotationDeg.value));
        state.zoomSpeed = Number(ui.zoomSpeed.value);
        state.resolutionScale = Number(ui.resolutionScale.value);
        state.autoSpeed = Number(ui.autoSpeed.value);
        state.autoDrift = Number(ui.autoDrift.value);
        state.recordFps = Number(ui.recordFps.value);
        state.pathDuration = Number(ui.pathDuration.value);
        updateRangeOutputs();
        markDirty();
      });
    });

    ui.paletteSelect.addEventListener('change', () => {
      applyPalettePreset(ui.paletteSelect.value);
      updateButtons();
    });
    ui.resetViewBtn.addEventListener('click', resetView);
    ui.randomConstantBtn.addEventListener('click', chooseRandomConstant);
    ui.autoNavBtn.addEventListener('click', toggleAutomatedNavigation);
    ui.saveFrameBtn.addEventListener('click', savePng);
    ui.liveRecordBtn.addEventListener('click', toggleLiveRecording);
    ui.renderPathBtn.addEventListener('click', renderKeyframePath);
    ui.captureKeyframeBtn.addEventListener('click', captureKeyframe);
    ui.clearKeyframesBtn.addEventListener('click', clearKeyframes);
  }

  function getCanvasMetrics() {
    const rect = canvas.getBoundingClientRect();
    return { rect, minDim: Math.max(1, Math.min(rect.width, rect.height)) };
  }

  function screenToWorld(clientX, clientY) {
    const { rect, minDim } = getCanvasMetrics();
    const sx = ((clientX - rect.left) * 2 - rect.width) / minDim;
    const sy = ((clientY - rect.top) * 2 - rect.height) / minDim;
    const angle = degToRad(state.rotationDeg);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;
    return { x: state.centerX + rx * state.scale, y: state.centerY + ry * state.scale };
  }

  function panByPixels(deltaX, deltaY) {
    const { minDim } = getCanvasMetrics();
    const sx = (deltaX * 2) / minDim;
    const sy = (deltaY * 2) / minDim;
    const angle = degToRad(state.rotationDeg);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const wx = (sx * cos - sy * sin) * state.scale;
    const wy = (sx * sin + sy * cos) * state.scale;
    state.centerX -= wx;
    state.centerY -= wy;
  }

  function steerConstant(deltaX, deltaY) {
    state.cRe += deltaX * 0.0022;
    state.cIm -= deltaY * 0.0022;
  }

  function zoomAt(clientX, clientY, direction) {
    const before = screenToWorld(clientX, clientY);
    state.scale *= Math.pow(state.zoomSpeed, direction);
    state.scale = clamp(state.scale, 1e-9, 8);
    const after = screenToWorld(clientX, clientY);
    state.centerX += before.x - after.x;
    state.centerY += before.y - after.y;
  }

  function bindPointerControls() {
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    canvas.addEventListener('pointerdown', (event) => {
      runtime.pointer.active = true;
      runtime.pointer.lastX = event.clientX;
      runtime.pointer.lastY = event.clientY;
      runtime.pointer.mode = event.altKey || event.button === 2 ? 'constant' : 'pan';
      canvas.classList.add('dragging');
      canvas.setPointerCapture(event.pointerId);
      stopAutomatedNavigation(false);
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!runtime.pointer.active) return;
      const dx = event.clientX - runtime.pointer.lastX;
      const dy = event.clientY - runtime.pointer.lastY;
      if (runtime.pointer.mode === 'pan') panByPixels(dx, dy);
      else steerConstant(dx, dy);
      runtime.pointer.lastX = event.clientX;
      runtime.pointer.lastY = event.clientY;
      syncControlsFromState();
      markDirty();
    });

    function releasePointer(event) {
      runtime.pointer.active = false;
      canvas.classList.remove('dragging');
      if (event && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    }

    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);
    canvas.addEventListener('pointerleave', () => {
      runtime.pointer.active = false;
      canvas.classList.remove('dragging');
    });

    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      stopAutomatedNavigation(false);
      zoomAt(event.clientX, event.clientY, event.deltaY > 0 ? 1 : -1);
      syncControlsFromState();
      markDirty();
    }, { passive: false });
  }

  function bindKeyboard() {
    window.addEventListener('keydown', (event) => {
      const activeTag = document.activeElement && document.activeElement.tagName;
      if (activeTag === 'INPUT' || activeTag === 'SELECT') return;
      const key = event.key.toLowerCase();
      if (key === ' ') {
        event.preventDefault();
        toggleAutomatedNavigation();
        return;
      }
      runtime.keys.add(key);
    });

    window.addEventListener('keyup', (event) => runtime.keys.delete(event.key.toLowerCase()));
  }

  function stepKeyboard(dt) {
    if (runtime.pathRender) return false;
    let changed = false;
    const pressed = runtime.keys;

    if (pressed.has('w') || pressed.has('arrowup')) { panByPixels(0, 160 * dt); changed = true; }
    if (pressed.has('s') || pressed.has('arrowdown')) { panByPixels(0, -160 * dt); changed = true; }
    if (pressed.has('a') || pressed.has('arrowleft')) { panByPixels(160 * dt, 0); changed = true; }
    if (pressed.has('d') || pressed.has('arrowright')) { panByPixels(-160 * dt, 0); changed = true; }
    if (pressed.has('q')) { state.scale *= Math.pow(state.zoomSpeed, -dt * 40); changed = true; }
    if (pressed.has('e')) { state.scale *= Math.pow(state.zoomSpeed, dt * 40); changed = true; }

    if (changed) {
      stopAutomatedNavigation(false);
      state.scale = clamp(state.scale, 1e-9, 8);
      syncControlsFromState();
      markDirty();
    }
    return changed;
  }

  function resizeCanvas(gl) {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(320, Math.floor(canvas.clientWidth * dpr * state.resolutionScale));
    const height = Math.max(240, Math.floor(canvas.clientHeight * dpr * state.resolutionScale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      markDirty();
    }
  }

  function createRenderer() {
    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) {
      setMessage('WebGL2 is not available in this browser.', 4000);
      return null;
    }

    const vertexSource = `#version 300 es
      precision highp float;
      const vec2 POSITIONS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
      void main() {
        gl_Position = vec4(POSITIONS[gl_VertexID], 0.0, 1.0);
      }
    `;

    const fragmentSource = `#version 300 es
      precision highp float;
      uniform vec2 u_resolution;
      uniform vec2 u_center;
      uniform float u_scale;
      uniform vec2 u_c;
      uniform int u_iterations;
      uniform float u_escapeRadius;
      uniform float u_time;
      uniform float u_rotation;
      uniform vec3 u_paletteA;
      uniform vec3 u_paletteB;
      uniform vec3 u_paletteC;
      uniform vec3 u_paletteD;
      uniform float u_hueShift;
      uniform float u_saturation;
      uniform float u_contrast;
      uniform float u_glow;
      uniform float u_trapStrength;
      out vec4 outColor;
      #define MAX_ITER 2048
      const float TAU = 6.283185307179586;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      vec3 palette(float t) {
        return clamp(
          u_paletteA + u_paletteB * cos(TAU * (u_paletteC * t + u_paletteD + vec3(u_hueShift))),
          0.0,
          1.0
        );
      }

      vec3 saturateColor(vec3 color, float amount) {
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        return mix(vec3(luminance), color, amount);
      }

      vec3 applyContrast(vec3 color, float amount) {
        return clamp((color - 0.5) * amount + 0.5, 0.0, 1.0);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float cs = cos(u_rotation);
        float sn = sin(u_rotation);
        uv = mat2(cs, -sn, sn, cs) * uv;
        vec2 current = u_center + uv * u_scale;
        float escapeSq = u_escapeRadius * u_escapeRadius;
        float trap = 1.0e9;
        float stripe = 0.0;
        float smoothIter = 0.0;
        bool escaped = false;

        for (int iter = 0; iter < MAX_ITER; iter++) {
          if (iter >= u_iterations) break;
          float xx = current.x * current.x - current.y * current.y + u_c.x;
          float yy = 2.0 * current.x * current.y + u_c.y;
          current = vec2(xx, yy);
          float radiusSq = dot(current, current);
          trap = min(trap, min(abs(current.x), abs(current.y)));
          stripe += 0.5 + 0.5 * sin(8.0 * atan(current.y, current.x) + float(iter) * 0.16);
          if (radiusSq > escapeSq) {
            smoothIter = float(iter) + 1.0 - log2(max(1.0, log2(radiusSq)));
            escaped = true;
            break;
          }
        }

        vec3 color;
        if (escaped) {
          float orbit = exp(-10.0 * trap * max(0.15, u_trapStrength));
          float t = smoothIter / float(u_iterations);
          float flow = stripe / max(1.0, smoothIter + 1.0);
          vec3 base = palette(t + orbit * 0.42 + flow * 0.18);
          vec3 rim = palette(t * 0.45 + 0.16 + flow * 0.08);
          color = mix(base, rim, clamp(orbit * 0.72, 0.0, 1.0));
          color += orbit * orbit * u_glow * vec3(1.15, 0.96, 0.72);
          color += 0.10 * flow * vec3(0.84, 0.52, 0.94);
        } else {
          float core = exp(-8.0 * trap);
          color = mix(vec3(0.010, 0.013, 0.030), palette(0.1 + core * 0.25) * 0.30, 0.78);
          color += core * 0.22 * vec3(0.40, 0.64, 1.0);
        }

        float vignette = smoothstep(1.85, 0.12, length(uv));
        color *= 0.82 + 0.18 * vignette;
        color = saturateColor(color, u_saturation);
        color = applyContrast(color, u_contrast);
        float grain = (hash(gl_FragCoord.xy + u_time * 7.13) - 0.5) * 0.022;
        color += grain;
        color = pow(max(color, 0.0), vec3(0.92));
        outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `;

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed.');
      }
      return shader;
    }

    function createProgram() {
      const program = gl.createProgram();
      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Program link failed.');
      }
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return program;
    }

    let program;
    try {
      program = createProgram();
    } catch (error) {
      console.error(error);
      setMessage('Shader compilation failed. See console for details.', 4200);
      return null;
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.useProgram(program);
    gl.clearColor(0.01, 0.02, 0.04, 1);

    const uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      center: gl.getUniformLocation(program, 'u_center'),
      scale: gl.getUniformLocation(program, 'u_scale'),
      c: gl.getUniformLocation(program, 'u_c'),
      iterations: gl.getUniformLocation(program, 'u_iterations'),
      escapeRadius: gl.getUniformLocation(program, 'u_escapeRadius'),
      time: gl.getUniformLocation(program, 'u_time'),
      rotation: gl.getUniformLocation(program, 'u_rotation'),
      paletteA: gl.getUniformLocation(program, 'u_paletteA'),
      paletteB: gl.getUniformLocation(program, 'u_paletteB'),
      paletteC: gl.getUniformLocation(program, 'u_paletteC'),
      paletteD: gl.getUniformLocation(program, 'u_paletteD'),
      hueShift: gl.getUniformLocation(program, 'u_hueShift'),
      saturation: gl.getUniformLocation(program, 'u_saturation'),
      contrast: gl.getUniformLocation(program, 'u_contrast'),
      glow: gl.getUniformLocation(program, 'u_glow'),
      trapStrength: gl.getUniformLocation(program, 'u_trapStrength'),
    };

    return {
      render(time, iterations) {
        resizeCanvas(gl);
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform2f(uniforms.center, state.centerX, state.centerY);
        gl.uniform1f(uniforms.scale, state.scale);
        gl.uniform2f(uniforms.c, state.cRe, state.cIm);
        gl.uniform1i(uniforms.iterations, iterations);
        gl.uniform1f(uniforms.escapeRadius, state.escapeRadius);
        gl.uniform1f(uniforms.time, time);
        gl.uniform1f(uniforms.rotation, degToRad(state.rotationDeg));
        gl.uniform3fv(uniforms.paletteA, state.palette.a);
        gl.uniform3fv(uniforms.paletteB, state.palette.b);
        gl.uniform3fv(uniforms.paletteC, state.palette.c);
        gl.uniform3fv(uniforms.paletteD, state.palette.d);
        gl.uniform1f(uniforms.hueShift, state.hueShift);
        gl.uniform1f(uniforms.saturation, state.saturation);
        gl.uniform1f(uniforms.contrast, state.contrast);
        gl.uniform1f(uniforms.glow, state.glow);
        gl.uniform1f(uniforms.trapStrength, state.trapStrength);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  }

  function stepPathRender(now) {
    if (!runtime.pathRender) return false;
    const progress = clamp((now - runtime.pathRender.startedAt) / runtime.pathRender.durationMs, 0, 1);
    applySnapshot(interpolatePath(progress), false);
    syncControlsFromState();
    markDirty();
    if (progress >= 1 && !runtime.pathRender.stopQueued) {
      runtime.pathRender.stopQueued = true;
      setTimeout(finishKeyframePath, 220);
    }
    return true;
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - runtime.lastFrameTime) * 0.001 || 0.016);
    runtime.lastFrameTime = now;
    const fps = 1 / Math.max(dt, 0.0001);
    runtime.fpsSmoothed = runtime.fpsSmoothed ? mix(runtime.fpsSmoothed, fps, 0.12) : fps;

    const keyboardChanged = stepKeyboard(dt);
    const autoChanged = stepAutomatedNavigation(now, dt);
    const pathChanged = stepPathRender(now);
    if (state.dirty || keyboardChanged || autoChanged || pathChanged || runtime.recorderState) {
      runtime.render.render(now * 0.001, getEffectiveIterations());
      state.dirty = false;
    }

    if (now - runtime.lastHudUpdate > 90) {
      updateStats();
      runtime.lastHudUpdate = now;
    }
    requestAnimationFrame(frame);
  }

  function init() {
    populatePaletteOptions();
    renderKeyframes();
    updateRangeOutputs();
    bindUi();
    bindPointerControls();
    bindKeyboard();

    const renderer = createRenderer();
    if (!renderer) return;
    runtime.render = renderer;

    syncControlsFromState();
    updateStats();
    window.addEventListener('resize', markDirty);
    requestAnimationFrame(frame);
    setMessage('Julia realm ready. Wheel to dive.');
  }

  init();
})();
