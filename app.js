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

  const scenes = [
    {name:'Tidal bronze', real:-0.52, imag:0.43, slice:0.06, yaw:0.56, pitch:0.32, palette:'Solar Tide'},
    {name:'Glacial lace', real:-0.18, imag:0.69, slice:-0.13, yaw:1.92, pitch:0.47, palette:'Lagoon Prism'},
    {name:'Ember coral', real:-0.82, imag:0.18, slice:0.16, yaw:-0.74, pitch:0.18, palette:'Ember Cathedral'},
  ];
  const el = id => document.getElementById(id);
  const state = {
    view:'volume', scene:0, yaw:0.56, pitch:0.32, lens:2.55, aimX:0, aimY:0, slice:0.06,
    centerX: 0,
    centerY: 0,
    scale: 1.75,
    cRe: scenes[0].real,
    cIm: scenes[0].imag,
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
    flightTime: 0, nextProbe: 0, target: null, planeOut: false,
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
    const zoom = state.view === 'volume' ? state.lens / 2.55 : 1.75 / state.scale;
    return zoom < 1e4 ? `${zoom.toFixed(2)}x` : `${zoom.toExponential(2)}x`;
  }

  function formatDepth() {
    if (state.view === 'volume') return state.lens > 4 ? 'close-up' : 'orbit';
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
    const volume = state.view === 'volume';
    el('plane-btn').setAttribute('aria-pressed', String(!volume));
    el('volume-btn').setAttribute('aria-pressed', String(volume));
    el('scene-type').textContent = volume ? 'Quaternion Julia' : 'Complex Julia';
    el('scene-title').textContent = scenes[state.scene].name;
    el('scene-select').selectedIndex = state.scene;
    el('slice-row').hidden = !volume;
    el('slice').value = state.slice;
    el('steer-help').textContent = volume
      ? 'Drag to orbit. Scroll to approach. Find detail frames a folded region of the surface.'
      : 'Drag to pan. Scroll toward a detail. Guided flight follows the boundary.';
    for (const input of [ui.baseIterations,ui.detailBoost,ui.escapeRadius,ui.rotationDeg]) {
      input.closest('.control-row').hidden = volume;
    }
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
    ui.autoNavBtn.textContent = state.autoNavigate ? 'Pause flight' : 'Guided flight';
    ui.autoNavBtn.setAttribute('aria-pressed', String(state.autoNavigate));
    ui.autoNavBtn.classList.toggle('active', state.autoNavigate);
    const isLiveRecording = runtime.recorderState && runtime.recorderState.mode === 'live';
    ui.liveRecordBtn.textContent = isLiveRecording ? 'Stop Live Record' : 'Start Live Record';
    ui.liveRecordBtn.classList.toggle('active', Boolean(runtime.recorderState));
    ui.renderPathBtn.disabled = Boolean(runtime.recorderState) || runtime.keyframes.length < 2;
    ui.autoNavBtn.disabled = Boolean(runtime.pathRender);
    ui.captureKeyframeBtn.disabled = Boolean(runtime.pathRender);
    ui.clearKeyframesBtn.disabled = runtime.keyframes.length === 0;
  }

  function updateStats() {
    stats.fps.textContent = runtime.fpsSmoothed.toFixed(1);
    stats.zoom.textContent = formatZoom();
    stats.depth.textContent = formatDepth();
    stats.iterations.textContent = state.view === 'volume' ? '16' : String(getEffectiveIterations());
    stats.constant.textContent = formatComplex(state.cRe, state.cIm);
    const modes = [state.autoNavigate ? 'auto' : 'manual'];
    if (runtime.pathRender) modes.push('path');
    if (runtime.recorderState) modes.push('rec');
    stats.mode.textContent = modes.join(' / ');
  }

  function snapshotState(label) {
    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label, view:state.view, scene:state.scene, yaw:state.yaw, pitch:state.pitch,
      lens:state.lens, aimX:state.aimX, aimY:state.aimY, slice:state.slice,
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
    state.view = snapshot.view || 'plane';
    for (const key of ['scene','yaw','pitch','lens','aimX','aimY','slice']) {
      if (snapshot[key] !== undefined) state[key] = snapshot[key];
    }
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
    if (snapshot.paletteName && snapshot.paletteName !== state.paletteName) applyPalettePreset(snapshot.paletteName);
    if (sync) syncControlsFromState();
    markDirty();
  }

  function interpolateSnapshots(a, b, t) {
    const eased = smoothStep(t);
    return {
      view: eased < 0.5 ? a.view : b.view, scene: eased < 0.5 ? a.scene : b.scene,
      yaw: a.yaw + Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*eased,
      pitch: mix(a.pitch,b.pitch,eased), lens:mix(a.lens,b.lens,eased),
      aimX:mix(a.aimX,b.aimX,eased), aimY:mix(a.aimY,b.aimY,eased), slice:mix(a.slice,b.slice,eased),
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
      detail.textContent = `${keyframe.view === 'volume' ? '3D' : '2D'} | ${formatComplex(keyframe.cRe, keyframe.cIm)}`;

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
    markDirty();
    syncControlsFromState();
    setMessage(`Loaded ${selection.label}.`);
  }

  function resetView() {
    stopAutomatedNavigation(false);
    state.centerX = 0;
    state.centerY = 0;
    state.scale = 1.75;
    state.rotationDeg = -12;
    state.aimX = state.aimY = 0;
    Object.assign(state,{yaw:scenes[state.scene].yaw,pitch:scenes[state.scene].pitch,lens:2.55});
    markDirty();
    syncControlsFromState();
    setMessage('View reset.');
  }

  function startAutomatedNavigation() {
    if (runtime.pathRender) return;
    state.autoNavigate = true;
    runtime.flightTime = 0;
    runtime.nextProbe = 0;
    runtime.target = null;
    runtime.planeOut = false;
    runtime.autoAnchor = { cRe: state.cRe, cIm: state.cIm, slice:state.slice };
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

  function chooseScene(index) {
    const scene = scenes[index];
    Object.assign(state, {scene:index,cRe:scene.real,cIm:scene.imag,slice:scene.slice});
    applyPalettePreset(scene.palette);
    resetView();
    setMessage(scene.name);
  }

  function planeDetail() {
    const values = new Float32Array(121);
    for (let row=0; row<11; row++) {
      for (let col=0; col<11; col++) {
        let x=state.centerX+(col-5)*0.16*state.scale;
        let y=state.centerY+(row-5)*0.16*state.scale;
        let n=0;
        while (n<96 && x*x+y*y<16) {
          const next=x*x-y*y+state.cRe;
          y=2*x*y+state.cIm;
          x=next;
          n++;
        }
        values[row*11+col]=n;
      }
    }
    let best=2, target=null;
    for (let r=1; r<10; r++) {
      for (let c=1; c<10; c++) {
        const k=r*11+c;
        const neighbors=[values[k],values[k+1],values[k-1],values[k-11],values[k+11]];
        const score=(Math.max(...neighbors)-Math.min(...neighbors))/(1+0.14*Math.hypot(c-5,r-5));
        if (score>best) {
          best=score;
          target={x:state.centerX+(c-5)*0.16*state.scale,y:state.centerY+(r-5)*0.16*state.scale};
        }
      }
    }
    return target;
  }

  function findDetail() {
    const volume = state.view === 'volume';
    let target = volume ? juliaVolume.findSurface(state) : planeDetail();
    if (!target) {
      chooseScene(state.scene);
      target = volume ? juliaVolume.findSurface(state) : planeDetail();
    }
    if (target && volume) Object.assign(state,{aimX:target.x,aimY:target.y,lens:4.7});
    if (target && !volume) Object.assign(state,{centerX:target.x,centerY:target.y,scale:state.scale*0.7});
    markDirty();
    setMessage(target ? 'Detail framed' : 'Overview restored');
  }

  function stepAutomatedNavigation(dt) {
    if (!state.autoNavigate || runtime.pathRender) return false;
    runtime.flightTime += dt * state.autoSpeed;
    const t = runtime.flightTime;
    const ease = 1-Math.exp(-dt*1.55);
    const volume = state.view === 'volume';
    if (volume) {
      state.yaw = (state.yaw + dt*state.autoSpeed*0.20) % (2*Math.PI);
      state.pitch = mix(state.pitch,0.27+0.45*Math.sin(t*0.24),ease);
      state.slice = clamp(runtime.autoAnchor.slice + state.autoDrift*0.20*Math.sin(t*0.33),-0.65,0.65);
      state.cIm = clamp(runtime.autoAnchor.cIm+state.autoDrift*0.06*Math.sin(t*0.49),-1.6,1.6);
    }
    if (t >= runtime.nextProbe) {
      runtime.target = volume ? juliaVolume.findSurface(state) : planeDetail();
      runtime.nextProbe = t + 0.65;
      if (volume && !runtime.target) {
        const scene = scenes[state.scene];
        runtime.autoAnchor.cIm = mix(runtime.autoAnchor.cIm,scene.imag,0.45);
        runtime.autoAnchor.slice = mix(runtime.autoAnchor.slice,scene.slice,0.45);
        state.cRe = mix(state.cRe,scene.real,0.45);
      }
      if (!volume && (!runtime.target || state.scale<0.0004)) runtime.planeOut=true;
      if (!volume && state.scale>=1.7 && runtime.target) runtime.planeOut=false;
    }
    const target = runtime.target;
    if (volume) {
      state.aimX = mix(state.aimX,target?.x ?? 0,ease);
      state.aimY = mix(state.aimY,target?.y ?? 0,ease);
      const close = 0.5-0.5*Math.cos(t*0.24);
      state.lens = mix(state.lens,target ? 2.45+3.5*close : 2.4,ease);
    } else {
      const out=runtime.planeOut;
      state.centerX = mix(state.centerX,out ? 0 : target?.x ?? 0,ease);
      state.centerY = mix(state.centerY,out ? 0 : target?.y ?? 0,ease);
      state.scale = clamp(state.scale*Math.exp((out ? 0.72 : -0.27)*dt*state.autoSpeed),0.00025,1.75);
      state.rotationDeg = wrapDegrees(state.rotationDeg + dt*state.autoSpeed*state.autoDrift*12);
    }
    return true;
  }

  function savePng() {
    runtime.render.render(performance.now()*0.001,getEffectiveIterations());
    const link = document.createElement('a');
    link.download = `julia-frame-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setMessage('PNG saved.');
  }

  function getRecordingMimeType() {
    if (!window.MediaRecorder) return '';
    const options = ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm'];
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
    if (!window.MediaRecorder || !canvas.captureStream || !getRecordingMimeType()) {
      setMessage('WebM capture requires browser video recording support.', 4000);
      return null;
    }

    const mimeType = getRecordingMimeType();
    let stream, recorder;
    try {
      stream = canvas.captureStream(state.recordFps);
      recorder = new MediaRecorder(stream, { mimeType });
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      setMessage('Could not open video encoder: ' + error.message, 5000);
      return null;
    }
    const chunks = [];

    let resolveDone;
    const done = new Promise((resolve) => {
      resolveDone = resolve;
    });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    let failed = false;
    recorder.onerror = () => { failed = true; };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      runtime.recorderState = null;
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      if (!failed && blob.size) downloadBlob(blob, `${mode}-julia-${Date.now()}.webm`);
      runtime.pathRender = null;
      markDirty();
      updateButtons();
      updateStats();
      resolveDone(blob);
      setMessage(!failed && blob.size ? 'Video saved.' : 'Encoder returned no usable video. Try a lower resolution.', 4000);
    };

    try {
      recorder.start(250);
    } catch (error) {
      stream.getTracks().forEach(track => track.stop());
      setMessage('Recording failed: '+error.message,5000);
      return null;
    }
    runtime.recorderState = { mode, recorder, done };
    updateButtons();
    updateStats();
    return runtime.recorderState;
  }

  function stopRecording() {
    if (!runtime.recorderState) return Promise.resolve(null);
    const { recorder, done } = runtime.recorderState;
    if (recorder.state !== 'inactive') recorder.stop();
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
    const keyframes = runtime.pathRender.frames;
    const segmentCount = keyframes.length - 1;
    const scaled = clamp(progress, 0, 1) * segmentCount;
    const index = Math.min(segmentCount - 1, Math.floor(scaled));
    return interpolateSnapshots(keyframes[index], keyframes[index + 1], scaled - index);
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
      frames: runtime.keyframes.slice(),
      stopQueued: false,
    };
    updateButtons();
    setMessage('Rendering keyframe path. Download will start automatically.', 2600);
  }

  function finishKeyframePath() {
    if (!runtime.pathRender) return;
    runtime.pathRender = null;
    stopRecording();
  }

  function bindUi() {
    const bindings = {constantReal:'cRe',constantImag:'cIm'};
    for (const [name,input] of Object.entries(ui)) {
      if (input.type !== 'range') continue;
      input.addEventListener('input', () => {
        if (['constantReal','constantImag','rotationDeg'].includes(name)) stopAutomatedNavigation(false);
        state[bindings[name] || name] = Number(input.value);
        updateRangeOutputs();
        markDirty();
      });
    }
    for (const view of ['volume','plane']) {
      el(view+'-btn').onclick = () => {
        state.view = view;
        if (state.autoNavigate) startAutomatedNavigation();
        syncControlsFromState();
        markDirty();
      };
    }
    el('scene-select').onchange = event => {
      const flying = state.autoNavigate;
      chooseScene(event.target.selectedIndex);
      if (flying) startAutomatedNavigation();
    };
    el('slice').oninput = event => {
      stopAutomatedNavigation(false);
      state.slice = Number(event.target.value);
      updateRangeOutputs();
      markDirty();
    };
    el('refocus-btn').onclick = findDetail;
    for (const [id,direction] of [['zoom-in',-2],['zoom-out',2]]) {
      el(id).onclick = () => {
        stopAutomatedNavigation(false);
        const {rect} = getCanvasMetrics();
        zoomAt(rect.left+rect.width/2,rect.top+rect.height/2,direction);
        markDirty();
      };
    }

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
    const sy = (rect.height - (clientY - rect.top) * 2) / minDim;
    const angle = degToRad(state.rotationDeg);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;
    return { x: state.centerX + rx * state.scale, y: state.centerY + ry * state.scale };
  }

  function panByPixels(deltaX, deltaY) {
    if (state.view === 'volume') {
      state.yaw -= deltaX*0.007;
      state.pitch = clamp(state.pitch+deltaY*0.007,-1.44,1.44);
      return;
    }
    const { minDim } = getCanvasMetrics();
    const sx = (deltaX * 2) / minDim;
    const sy = (-deltaY * 2) / minDim;
    const angle = degToRad(state.rotationDeg);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const wx = (sx * cos - sy * sin) * state.scale;
    const wy = (sx * sin + sy * cos) * state.scale;
    state.centerX -= wx;
    state.centerY -= wy;
  }

  function steerConstant(deltaX, deltaY) {
    state.cRe = clamp(state.cRe+deltaX*0.0022,-1.6,1.6);
    state.cIm = clamp(state.cIm-deltaY*0.0022,-1.6,1.6);
  }

  function zoomAt(clientX, clientY, direction) {
    if (state.view === 'volume') {
      state.lens = clamp(state.lens*Math.pow(state.zoomSpeed,-direction),1.4,18);
      return;
    }
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
      if (key === ' ' && !event.repeat && activeTag !== 'BUTTON' && activeTag !== 'SUMMARY') {
        event.preventDefault();
        toggleAutomatedNavigation();
        return;
      }
      runtime.keys.add(key);
    });

    window.addEventListener('keyup', (event) => runtime.keys.delete(event.key.toLowerCase()));
    window.addEventListener('blur', () => runtime.keys.clear());
  }

  function stepKeyboard(dt) {
    if (runtime.pathRender) return false;
    let changed = false;
    const pressed = runtime.keys;

    if (pressed.has('w') || pressed.has('arrowup')) { panByPixels(0, 160 * dt); changed = true; }
    if (pressed.has('s') || pressed.has('arrowdown')) { panByPixels(0, -160 * dt); changed = true; }
    if (pressed.has('a') || pressed.has('arrowleft')) { panByPixels(160 * dt, 0); changed = true; }
    if (pressed.has('d') || pressed.has('arrowright')) { panByPixels(-160 * dt, 0); changed = true; }
    if (pressed.has('q') || pressed.has('e')) {
      const factor = Math.pow(state.zoomSpeed,(pressed.has('q') ? -1 : 1)*dt*40);
      if (state.view === 'volume') state.lens = clamp(state.lens/factor,1.4,18);
      else state.scale *= factor;
      changed = true;
    }

    if (changed) {
      stopAutomatedNavigation(false);
      state.scale = clamp(state.scale, 1e-9, 8);
      syncControlsFromState();
      markDirty();
    }
    return changed;
  }

  function resizeCanvas(gl) {
    if (runtime.recorderState) return;
    const dpr = state.view === 'volume'
      ? Math.min(window.devicePixelRatio || 1, Math.sqrt(600000/Math.max(1,canvas.clientWidth*canvas.clientHeight)))
      : window.devicePixelRatio || 1;
    const width = Math.max(2, 2*Math.round(canvas.clientWidth * dpr * state.resolutionScale/2));
    const height = Math.max(2, 2*Math.round(canvas.clientHeight * dpr * state.resolutionScale/2));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      markDirty();
    }
  }

  function createRenderer() {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      powerPreference: 'high-performance',
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

      uniform bool u_volume;
      ${juliaVolume.shader}

      vec3 saturateColor(vec3 color, float amount) {
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        return mix(vec3(luminance), color, amount);
      }

      vec3 applyContrast(vec3 color, float amount) {
        return clamp((color - 0.5) * amount + 0.5, 0.0, 1.0);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        if (u_volume) {
          outColor = vec4(applyContrast(saturateColor(volume(uv),u_saturation),u_contrast),1.0);
          return;
        }
        float cs = cos(u_rotation);
        float sn = sin(u_rotation);
        uv = mat2(cs, sn, -sn, cs) * uv;
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

        float vignette = 1.0-smoothstep(0.12,1.85,length(uv));
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
      ...Object.fromEntries(['volume','eye','right','up','aim','lens','slice'].map(name =>
        [name,gl.getUniformLocation(program,'u_'+name)])),
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
        gl.uniform1i(uniforms.volume,state.view === 'volume' ? 1 : 0);
        if (state.view === 'volume') {
          const camera = juliaVolume.basis(state.yaw,state.pitch);
          for (const key of ['eye','right','up']) gl.uniform3fv(uniforms[key],camera[key]);
          gl.uniform2f(uniforms.aim,state.aimX,state.aimY);
          gl.uniform1f(uniforms.lens,state.lens);
          gl.uniform1f(uniforms.slice,state.slice);
        }
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
    markDirty();
    if (progress >= 1 && !runtime.pathRender.stopQueued) {
      runtime.pathRender.stopQueued = true;
      setTimeout(finishKeyframePath, 220);
    }
    return true;
  }

  function frame(now) {
    const elapsed = Math.max(0.001, (now-runtime.lastFrameTime)*0.001);
    const dt = Math.min(0.15,elapsed);
    runtime.lastFrameTime = now;
    const fps = 1/elapsed;
    runtime.fpsSmoothed = runtime.fpsSmoothed ? mix(runtime.fpsSmoothed, fps, 0.12) : fps;

    const keyboardChanged = stepKeyboard(dt);
    const autoChanged = stepAutomatedNavigation(dt);
    const pathChanged = stepPathRender(now);
    if (state.dirty || keyboardChanged || autoChanged || pathChanged || runtime.recorderState) {
      runtime.render.render(now * 0.001, getEffectiveIterations());
      state.dirty = false;
    }

    if (now - runtime.lastHudUpdate > 180) {
      if (autoChanged || pathChanged) syncControlsFromState();
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
    if (!renderer) {
      clearTimeout(runtime.messageTimer);
      document.querySelectorAll('button,input,select').forEach(control => control.disabled = true);
      return;
    }
    runtime.render = renderer;

    syncControlsFromState();
    updateStats();
    window.addEventListener('resize', markDirty);
    requestAnimationFrame(frame);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) startAutomatedNavigation();
  }

  init();
})();
