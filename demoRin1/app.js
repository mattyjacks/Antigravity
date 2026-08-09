/**
 * ==========================================================================
 * RIN 2.0 - FOCUS WORKSPACE ARCHITECTURE
 * Procedural Synthesizers, Canvas Visualizer, and Focus Dashboard Controller
 * ==========================================================================
 */

// Application State Store
const state = {
  // Audio Context Core
  audioCtx: null,
  masterGain: null,
  analyser: null,
  isMuted: false,
  
  // Procedural Sound Elements
  sounds: {
    rain: { active: false, volume: 0.5, intensity: 1.0, nodes: null },
    waves: { active: false, volume: 0.5, period: 10, nodes: null },
    drone: { active: false, volume: 0.5, pitch: 73, nodes: null },
    binaural: { active: false, volume: 0.3, frequency: 6.0, nodes: null },
    campfire: { active: false, volume: 0.4, crackle: 1.0, nodes: null },
    cafe: { active: false, volume: 0.3, chatter: 1.0, nodes: null }
  },
  
  // Custom Mechanical Clicks Synth Preference
  keyboardClicks: false,
  
  // Focus Timer Subsystem
  timer: {
    duration: 1500, // standard 25 mins
    timeLeft: 1500,
    intervalId: null,
    isRunning: false,
    label: 'FOCUS SESSION',
    autostart: false,
    alertSound: 'major'
  },
  
  // Mindful Breathing Subsystem
  breath: {
    isRunning: false,
    mode: 'box', // box, relax, coherence
    cycles: 0,
    intervalId: null,
    step: 0 // 0=inhale, 1=hold, 2=exhale, 3=hold
  },
  
  // Focus Tasks State
  tasks: [],
  taskFilter: 'all',
  
  // Analytics
  stats: {
    totalMinutes: 0,
    completedSessions: 0,
    tasksFinished: 0,
    historyLog: []
  },
  
  // Themes & UI Layout
  activeTheme: 'space',
  visualizerStyle: 'particles',
  canvasActive: true
};

// Canvas Visualizer Variables
let canvas, ctx, animationFrameId;
const particleArray = [];

// --- DYNAMIC MIXER PRESET STORE (LOCALSTORAGE) ---
let customPresets = {};

// ==========================================================================
// DOM ELEMENT SELECTION
// ==========================================================================
const timerTimeEl = document.getElementById('timer-time');
const timerLabelEl = document.getElementById('timer-label');
const timerPlayBtn = document.getElementById('timer-play-btn');
const timerResetBtn = document.getElementById('timer-reset-btn');
const timerProgressRing = document.getElementById('timer-progress');
const presetBtns = document.querySelectorAll('.preset-btn');
const sessionTopBadge = document.getElementById('session-count-top');
const customMinInput = document.getElementById('custom-min-input');
const applyCustomTimerBtn = document.getElementById('apply-custom-timer-btn');

// Tabs & Navigation
const navTabs = document.querySelectorAll('.nav-tab');
const tabPanels = document.querySelectorAll('.tab-panel');

// Global control selectors
const masterMuteBtn = document.getElementById('master-mute-btn');
const themeBtn = document.getElementById('theme-btn');
const themeSelectorPanel = document.getElementById('theme-selector-panel');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const keyboardShortcutsBtn = document.getElementById('keyboard-shortcuts-btn');
const shortcutsModal = document.getElementById('shortcuts-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// Task Manager Selectors
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoPriority = document.getElementById('todo-priority');
const todoList = document.getElementById('todo-list');
const taskCompletedRatio = document.getElementById('task-completed-ratio');
const clearCompletedBtn = document.getElementById('clear-completed-tasks');
const taskFilters = document.querySelectorAll('.filter-tab');

// Breathing Selectors
const breathCircle = document.getElementById('breath-circle');
const breathInstruction = document.getElementById('breath-instruction');
const breathStartBtn = document.getElementById('breath-start-btn');
const breathCycleCounter = document.getElementById('breath-cycles');
const breathModeBtns = document.querySelectorAll('.breath-mode-btn');

// Analytics Selectors
const statMinutesEl = document.getElementById('stat-total-minutes');
const statSessionsEl = document.getElementById('stat-sessions-count');
const statTasksEl = document.getElementById('stat-tasks-count');
const statsLogTbody = document.getElementById('stats-log-tbody');
const resetStatsBtn = document.getElementById('reset-stats-btn');

// Preset Saver Drawer
const savePresetTrigger = document.getElementById('save-preset-trigger');
const presetDrawer = document.getElementById('preset-drawer');
const newPresetNameInput = document.getElementById('new-preset-name');
const savePresetConfirmBtn = document.getElementById('save-preset-confirm-btn');
const savedPresetsList = document.getElementById('saved-presets-list');

// Settings Selectors
const visualizerStyleSelect = document.getElementById('visualizer-style-select');
const keyboardClickToggle = document.getElementById('keyboard-click-toggle');
const timerSoundSelect = document.getElementById('timer-sound-select');
const autostartToggle = document.getElementById('autostart-toggle');
const activeSoundsTag = document.getElementById('active-sounds-tag');

// ==========================================================================
// CORE AUDIOPHASE & SYNTHESIZERS DEFINITION
// ==========================================================================

/**
 * Initialize Web Audio API Environment
 */
function initAudio() {
  if (state.audioCtx) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  state.audioCtx = new AudioContextClass();

  // Master Gain Stage
  state.masterGain = state.audioCtx.createGain();
  state.masterGain.gain.setValueAtTime(1.0, state.audioCtx.currentTime);

  // Analyser node for Canvas graphics
  state.analyser = state.audioCtx.createAnalyser();
  state.analyser.fftSize = 256;
  
  // Connections
  state.masterGain.connect(state.analyser);
  state.analyser.connect(state.audioCtx.destination);
  
  setupKeyboardClicks();
}

/**
 * Resumes context if suspended by browser security guidelines
 */
async function ensureAudioStarted() {
  initAudio();
  if (state.audioCtx.state === 'suspended') {
    await state.audioCtx.resume();
  }
}

/**
 * Procedural Pink Noise Synthesizer (Ideal for Rain and Water elements)
 */
function createPinkNoiseNode() {
  const bufferSize = 4 * state.audioCtx.sampleRate;
  const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Voss-McCartney algorithm for pink noise approximation
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // normalizes gain level
    b6 = white * 0.115926;
  }

  const source = state.audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

/**
 * Procedural Brown Noise Node (Deeper frequency bias, ideal for drones & fires)
 */
function createBrownNoiseNode() {
  const bufferSize = 2 * state.audioCtx.sampleRate;
  const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Gain correction factor
  }

  const source = state.audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

// --------------------------------------------------------------------------
// INDIVIDUAL INSTRUMENT SYNTH GENERATORS
// --------------------------------------------------------------------------

/**
 * Rain Synthesizer: Pink Noise + Bandpass Filter + Wind Gust LFO Modulator
 */
function synthRain(vol, intensity) {
  const source = createPinkNoiseNode();
  
  const filter = state.audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000 - (150 * intensity), state.audioCtx.currentTime);
  filter.Q.setValueAtTime(0.8, state.audioCtx.currentTime);

  const lfo = state.audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.06, state.audioCtx.currentTime); // slow wave oscillation

  const lfoGain = state.audioCtx.createGain();
  lfoGain.gain.setValueAtTime(200 * intensity, state.audioCtx.currentTime);

  const gainNode = state.audioCtx.createGain();
  gainNode.gain.setValueAtTime(vol * 0.7, state.audioCtx.currentTime);

  // Connection Matrix
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(state.masterGain);

  lfo.start();
  source.start();

  return { source, filter, lfo, gain: gainNode, lfoGain };
}

/**
 * Ocean Waves Synthesizer: Pink Noise + Lowpass Sweeper Filter + Periodic Gain Modulator
 */
function synthWaves(vol, period) {
  const source = createPinkNoiseNode();

  const filter = state.audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, state.audioCtx.currentTime);

  const lfo = state.audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(1 / period, state.audioCtx.currentTime);

  // Depth modulations
  const lfoFilterGain = state.audioCtx.createGain();
  lfoFilterGain.gain.setValueAtTime(380, state.audioCtx.currentTime); // Filter sweep depth

  const lfoVolGain = state.audioCtx.createGain();
  lfoVolGain.gain.setValueAtTime(vol * 0.8, state.audioCtx.currentTime); // Volume cycle depth

  const amplitudeNode = state.audioCtx.createGain();
  amplitudeNode.gain.setValueAtTime(0.02, state.audioCtx.currentTime);

  // Connection Matrix
  lfo.connect(lfoFilterGain).connect(filter.frequency);
  lfo.connect(lfoVolGain).connect(amplitudeNode.gain);
  source.connect(filter).connect(amplitudeNode).connect(state.masterGain);

  lfo.start();
  source.start();

  return { source, filter, lfo, gain: amplitudeNode, lfoVolGain, lfoFilterGain };
}

/**
 * Cosmic Ambient Pad Drone: Multi-Oscillator detuned cluster + LFO swept filter
 */
function synthDrone(vol, basePitch) {
  const rootFreq = basePitch; // MIDI Pitch or direct Hz mapping
  
  const osc1 = state.audioCtx.createOscillator();
  const osc2 = state.audioCtx.createOscillator();
  const osc3 = state.audioCtx.createOscillator();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(rootFreq, state.audioCtx.currentTime);
  
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(rootFreq * 1.5, state.audioCtx.currentTime); // Perfect fifth chord
  
  osc3.type = 'sawtooth';
  osc3.frequency.setValueAtTime(rootFreq * 0.992, state.audioCtx.currentTime); // Detune minor
  
  const filter = state.audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(150, state.audioCtx.currentTime);
  filter.Q.setValueAtTime(4.0, state.audioCtx.currentTime);

  const lfo = state.audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.04, state.audioCtx.currentTime); // slow ambient breath

  const lfoGain = state.audioCtx.createGain();
  lfoGain.gain.setValueAtTime(60, state.audioCtx.currentTime);

  const gainNode = state.audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, state.audioCtx.currentTime); // Start zero

  // Connections
  lfo.connect(lfoGain).connect(filter.frequency);
  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(filter);
  filter.connect(gainNode).connect(state.masterGain);

  osc1.start();
  osc2.start();
  osc3.start();
  lfo.start();

  // Fade-in envelope to prevent digital pops
  gainNode.gain.setTargetAtTime(vol * 0.22, state.audioCtx.currentTime, 2.0);

  return { oscs: [osc1, osc2, osc3], filter, lfo, gain: gainNode };
}

/**
 * Binaural Focus Beats: Phase split routing to left/right stereo channels
 */
function synthBinaural(vol, beatHz) {
  const baseCarrier = 140; // 140Hz focus baseline
  const oscL = state.audioCtx.createOscillator();
  const oscR = state.audioCtx.createOscillator();

  oscL.type = 'sine';
  oscL.frequency.setValueAtTime(baseCarrier, state.audioCtx.currentTime);

  oscR.type = 'sine';
  oscR.frequency.setValueAtTime(baseCarrier + beatHz, state.audioCtx.currentTime);

  const merger = state.audioCtx.createChannelMerger(2);
  const gainNode = state.audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, state.audioCtx.currentTime);

  // Router: Connect OscL to Channel 0 (Left), OscR to Channel 1 (Right)
  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);
  merger.connect(gainNode).connect(state.masterGain);

  oscL.start();
  oscR.start();

  gainNode.gain.setTargetAtTime(vol * 0.45, state.audioCtx.currentTime, 1.5);

  return { oscs: [oscL, oscR], gain: gainNode, carrier: baseCarrier };
}

/**
 * Campfire Crackle: Brown Noise (Wind/Heat hum) + Impulses (Wood snaps)
 */
function synthCampfire(vol, crackleRate) {
  // 1. Warm base rumbling
  const baseSynth = createBrownNoiseNode();
  const filter = state.audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(250, state.audioCtx.currentTime);

  const baseGain = state.audioCtx.createGain();
  baseGain.gain.setValueAtTime(vol * 0.5, state.audioCtx.currentTime);
  baseSynth.connect(filter).connect(baseGain).connect(state.masterGain);
  baseSynth.start();

  // 2. High-frequency crackle impulses
  const impulseInterval = setInterval(() => {
    if (!state.sounds.campfire.active || state.isMuted) return;
    
    // Random chance of snap happening based on crackle rate
    if (Math.random() < 0.6 * crackleRate) {
      const snapOsc = state.audioCtx.createOscillator();
      const snapFilter = state.audioCtx.createBiquadFilter();
      const snapGain = state.audioCtx.createGain();

      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(1500 + Math.random() * 4000, state.audioCtx.currentTime);
      
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(2500, state.audioCtx.currentTime);
      snapFilter.Q.setValueAtTime(4.0, state.audioCtx.currentTime);

      snapGain.gain.setValueAtTime(0.015 * Math.random() * vol, state.audioCtx.currentTime);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.03);

      snapOsc.connect(snapFilter).connect(snapGain).connect(state.masterGain);
      snapOsc.start();
      snapOsc.stop(state.audioCtx.currentTime + 0.05);
    }
  }, 120);

  return { source: baseSynth, filter, gain: baseGain, interval: impulseInterval };
}

/**
 * Cafe Murmur Synthesizer: Simulated chatter & low rumblings
 */
function synthCafe(vol, chatterLevel) {
  // Low hum
  const drone = state.audioCtx.createOscillator();
  drone.type = 'sine';
  drone.frequency.setValueAtTime(105, state.audioCtx.currentTime);
  
  const filter = state.audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(180, state.audioCtx.currentTime);

  const baseGain = state.audioCtx.createGain();
  baseGain.gain.setValueAtTime(vol * 0.4, state.audioCtx.currentTime);

  drone.connect(filter).connect(baseGain).connect(state.masterGain);
  drone.start();

  // Multi-band voices simulation (periodic filtered bubbles)
  const chatterInterval = setInterval(() => {
    if (!state.sounds.cafe.active || state.isMuted) return;
    
    if (Math.random() < 0.7 * chatterLevel) {
      const voiceOsc = state.audioCtx.createOscillator();
      const voiceFilter = state.audioCtx.createBiquadFilter();
      const voiceGain = state.audioCtx.createGain();

      // Random sweeps representing conversation lines
      voiceOsc.type = 'sine';
      voiceOsc.frequency.setValueAtTime(300 + Math.random() * 500, state.audioCtx.currentTime);
      voiceOsc.frequency.linearRampToValueAtTime(200 + Math.random() * 600, state.audioCtx.currentTime + 0.6);

      voiceFilter.type = 'bandpass';
      voiceFilter.frequency.setValueAtTime(450, state.audioCtx.currentTime);
      voiceFilter.Q.setValueAtTime(2.0, state.audioCtx.currentTime);

      voiceGain.gain.setValueAtTime(0.008 * vol, state.audioCtx.currentTime);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.7);

      voiceOsc.connect(voiceFilter).connect(voiceGain).connect(state.masterGain);
      voiceOsc.start();
      voiceOsc.stop(state.audioCtx.currentTime + 0.85);
    }
  }, 350);

  return { source: drone, filter, gain: baseGain, interval: chatterInterval };
}

// --------------------------------------------------------------------------
// ON-TYPING MECHANICAL KEYBOARD CLICKS
// --------------------------------------------------------------------------
function setupKeyboardClicks() {
  window.addEventListener('keydown', (e) => {
    if (!state.keyboardClicks || !state.audioCtx || state.isMuted) return;
    
    // Ignore keystrokes inside input forms or textareas to avoid double triggers
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'textarea' || (tag === 'input' && e.target.id !== 'todo-input')) {
      // Allow it so the user gets acoustic typing feedback when writing tasks!
    }

    playClickSynth();
  });
}

function playClickSynth() {
  const osc = state.audioCtx.createOscillator();
  const filter = state.audioCtx.createBiquadFilter();
  const gain = state.audioCtx.createGain();

  // Detuned clicks
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(700 + Math.random() * 300, state.audioCtx.currentTime);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1800, state.audioCtx.currentTime);
  filter.Q.setValueAtTime(2.5, state.audioCtx.currentTime);

  gain.gain.setValueAtTime(0.02, state.audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0005, state.audioCtx.currentTime + 0.045);

  osc.connect(filter).connect(gain).connect(state.masterGain);
  osc.start();
  osc.stop(state.audioCtx.currentTime + 0.055);
}

// --------------------------------------------------------------------------
// ALARM CHIMES DEFINITIONS
// --------------------------------------------------------------------------
function playAlarmChime() {
  if (!state.audioCtx) return;

  const style = state.timer.alertSound;

  if (style === 'major') {
    // Uplifting major arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime + idx * 0.15);
      
      gain.gain.setValueAtTime(0, state.audioCtx.currentTime + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, state.audioCtx.currentTime + idx * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + idx * 0.15 + 0.6);

      osc.connect(gain).connect(state.audioCtx.destination);
      osc.start(state.audioCtx.currentTime + idx * 0.15);
      osc.stop(state.audioCtx.currentTime + idx * 0.15 + 0.85);
    });
  } 
  else if (style === 'zen') {
    // Heavy meditative bell resonance
    const osc = state.audioCtx.createOscillator();
    const subOsc = state.audioCtx.createOscillator();
    const filter = state.audioCtx.createBiquadFilter();
    const gain = state.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(146.83, state.audioCtx.currentTime); // D3
    
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(148.0, state.audioCtx.currentTime); // slightly out of phase

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, state.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.4, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 3.5);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain).connect(state.audioCtx.destination);

    osc.start();
    subOsc.start();
    osc.stop(state.audioCtx.currentTime + 4.0);
    subOsc.stop(state.audioCtx.currentTime + 4.0);
  }
  else if (style === 'retro') {
    // 8-bit sound ring
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, state.audioCtx.currentTime);
    
    let now = state.audioCtx.currentTime;
    for (let i = 0; i < 6; i++) {
      osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 1320, now + i * 0.08);
    }

    gain.gain.setValueAtTime(0.12, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.5);

    osc.connect(gain).connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + 0.55);
  }
}

// --------------------------------------------------------------------------
// DEACTIVATION MATRIX
// --------------------------------------------------------------------------
function stopSynth(soundName) {
  const sound = state.sounds[soundName];
  if (!sound.nodes) return;

  try {
    if (sound.nodes.source) sound.nodes.source.stop();
    if (sound.nodes.lfo) sound.nodes.lfo.stop();
    if (sound.nodes.oscs) {
      sound.nodes.oscs.forEach(osc => osc.stop());
    }
    if (sound.nodes.interval) {
      clearInterval(sound.nodes.interval);
    }
  } catch (e) {
    // Already cleaned
  }
  sound.nodes = null;
}

// ==========================================================================
// CORE DYNAMICS: TOGGLES, VOLUME CONTROL & PRESETS
// ==========================================================================

function toggleSound(soundName) {
  ensureAudioStarted().then(() => {
    const sound = state.sounds[soundName];
    const card = document.getElementById(`sound-${soundName}`);

    if (sound.active) {
      sound.active = false;
      stopSynth(soundName);
      if (card) card.classList.remove('active');
    } else {
      sound.active = true;
      if (card) card.classList.add('active');

      switch (soundName) {
        case 'rain':
          sound.nodes = synthRain(sound.volume, sound.intensity);
          break;
        case 'waves':
          sound.nodes = synthWaves(sound.volume, sound.period);
          break;
        case 'drone':
          sound.nodes = synthDrone(sound.volume, sound.pitch);
          break;
        case 'binaural':
          sound.nodes = synthBinaural(sound.volume, sound.frequency);
          break;
        case 'campfire':
          sound.nodes = synthCampfire(sound.volume, sound.crackle);
          break;
        case 'cafe':
          sound.nodes = synthCafe(sound.volume, sound.chatter);
          break;
      }
    }
    updateActiveSoundsTag();
  });
}

function handleVolumeChange(soundName, val) {
  const sound = state.sounds[soundName];
  sound.volume = parseFloat(val);

  if (sound.active && sound.nodes && sound.nodes.gain) {
    let scaled = sound.volume;
    if (soundName === 'rain') scaled *= 0.7;
    if (soundName === 'waves') scaled *= 0.8;
    if (soundName === 'drone') scaled *= 0.22;
    if (soundName === 'binaural') scaled *= 0.45;
    if (soundName === 'campfire') scaled *= 0.5;
    if (soundName === 'cafe') scaled *= 0.4;

    sound.nodes.gain.gain.setTargetAtTime(scaled, state.audioCtx.currentTime, 0.15);
  }
}

function handleParamChange(soundName, paramName, val) {
  const numericVal = parseFloat(val);
  state.sounds[soundName][paramName] = numericVal;
  const sound = state.sounds[soundName];

  if (!sound.active || !sound.nodes) return;

  // Real-time procedural parameter adjustments
  switch (soundName) {
    case 'rain':
      if (paramName === 'intensity' && sound.nodes.filter && sound.nodes.lfoGain) {
        sound.nodes.filter.frequency.setTargetAtTime(1000 - (150 * numericVal), state.audioCtx.currentTime, 0.5);
        sound.nodes.lfoGain.gain.setTargetAtTime(200 * numericVal, state.audioCtx.currentTime, 0.5);
      }
      break;
    case 'waves':
      if (paramName === 'period' && sound.nodes.lfo) {
        sound.nodes.lfo.frequency.setTargetAtTime(1 / numericVal, state.audioCtx.currentTime, 1.0);
      }
      break;
    case 'drone':
      if (paramName === 'pitch' && sound.nodes.oscs) {
        sound.nodes.oscs[0].frequency.setTargetAtTime(numericVal, state.audioCtx.currentTime, 0.6);
        sound.nodes.oscs[1].frequency.setTargetAtTime(numericVal * 1.5, state.audioCtx.currentTime, 0.6);
        sound.nodes.oscs[2].frequency.setTargetAtTime(numericVal * 0.992, state.audioCtx.currentTime, 0.6);
      }
      break;
    case 'binaural':
      if (paramName === 'frequency' && sound.nodes.oscs) {
        // Change right channel offset relative to left carrier
        sound.nodes.oscs[1].frequency.setTargetAtTime(sound.nodes.carrier + numericVal, state.audioCtx.currentTime, 0.4);
      }
      break;
    case 'campfire':
      // Handled by dynamic timer block inside the synth loop
      break;
    case 'cafe':
      // Handled by dynamic interval evaluator inside synth cafe
      break;
  }
}

function updateActiveSoundsTag() {
  let count = 0;
  Object.keys(state.sounds).forEach(key => {
    if (state.sounds[key].active) count++;
  });
  activeSoundsTag.textContent = `${count} playing`;
}

// Master Mute Toggle
function toggleMasterMute() {
  ensureAudioStarted().then(() => {
    if (state.isMuted) {
      state.isMuted = false;
      state.masterGain.gain.setTargetAtTime(1.0, state.audioCtx.currentTime, 0.2);
      masterMuteBtn.textContent = 'Mute All';
      masterMuteBtn.classList.remove('muted');
    } else {
      state.isMuted = true;
      state.masterGain.gain.setTargetAtTime(0, state.audioCtx.currentTime, 0.2);
      masterMuteBtn.textContent = 'Unmute All';
      masterMuteBtn.classList.add('muted');
    }
  });
}

// ==========================================================================
// PRESETS MANAGER SAVING/LOADING (LOCAL STORAGE INTERACTION)
// ==========================================================================

function loadPresetsFromStorage() {
  const loaded = localStorage.getItem('rin_presets');
  if (loaded) {
    customPresets = JSON.parse(loaded);
  } else {
    // Default factory focus mixes
    customPresets = {
      'Zen Forest': { rain: 0.4, campfire: 0.5, waves: 0, drone: 0, binaural: 0.2, cafe: 0 },
      'Deep Focus': { drone: 0.6, binaural: 0.5, rain: 0, campfire: 0, waves: 0, cafe: 0 },
      'Cozy Cafe': { cafe: 0.6, rain: 0.3, campfire: 0.2, waves: 0, drone: 0, binaural: 0 }
    };
    savePresetsToStorage();
  }
  renderPresetsList();
}

function savePresetsToStorage() {
  localStorage.setItem('rin_presets', JSON.stringify(customPresets));
}

function renderPresetsList() {
  savedPresetsList.innerHTML = '';
  Object.keys(customPresets).forEach(name => {
    const chip = document.createElement('div');
    chip.className = 'preset-chip';
    chip.innerHTML = `
      <span class="preset-name">${name}</span>
      <span class="delete-preset-x" data-preset="${name}">&times;</span>
    `;
    
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-preset-x')) {
        e.stopPropagation();
        deletePreset(e.target.dataset.preset);
      } else {
        applyPreset(name);
      }
    });

    savedPresetsList.appendChild(chip);
  });
}

function applyPreset(name) {
  const preset = customPresets[name];
  if (!preset) return;

  ensureAudioStarted().then(() => {
    Object.keys(state.sounds).forEach(key => {
      const vol = preset[key] !== undefined ? preset[key] : 0;
      const sound = state.sounds[key];
      const card = document.getElementById(`sound-${key}`);
      const volSlider = card.querySelector('.volume-slider');

      if (vol > 0) {
        sound.volume = vol;
        volSlider.value = vol;
        if (!sound.active) {
          toggleSound(key);
        } else {
          // Adjust volume directly
          handleVolumeChange(key, vol);
        }
      } else {
        if (sound.active) {
          toggleSound(key);
        }
        volSlider.value = 0;
        sound.volume = 0;
      }
    });
  });
}

function createPreset(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const presetData = {};
  Object.keys(state.sounds).forEach(key => {
    const s = state.sounds[key];
    presetData[key] = s.active ? s.volume : 0;
  });

  customPresets[trimmed] = presetData;
  savePresetsToStorage();
  renderPresetsList();
  
  newPresetNameInput.value = '';
  presetDrawer.classList.remove('visible');
}

function deletePreset(name) {
  if (customPresets[name]) {
    delete customPresets[name];
    savePresetsToStorage();
    renderPresetsList();
  }
}

// ==========================================================================
// TIMER CLOCK MODULE
// ==========================================================================

function updateTimerDisplay() {
  timerTimeEl.textContent = formatTime(state.timer.timeLeft);
  timerLabelEl.textContent = state.timer.label;

  // Circular progress ring updates
  const total = state.timer.duration;
  const current = state.timer.timeLeft;
  
  const isMobile = window.innerWidth <= 480;
  const radius = isMobile ? 98 : 128;
  const circumference = 2 * Math.PI * radius;
  
  timerProgressRing.style.strokeDasharray = `${circumference}`;
  const offset = circumference - (current / total) * circumference;
  timerProgressRing.style.strokeDashoffset = offset;

  // Browser title synchronization
  document.title = `${formatTime(state.timer.timeLeft)} - ${state.timer.label}`;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function startTimer() {
  if (state.timer.isRunning) return;
  ensureAudioStarted();

  state.timer.isRunning = true;
  document.body.classList.add('timer-running');
  
  timerPlayBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
    <span>Pause Focus</span>
  `;

  state.timer.intervalId = setInterval(() => {
    if (state.timer.timeLeft > 0) {
      state.timer.timeLeft--;
      updateTimerDisplay();
    } else {
      // Completed Interval
      clearInterval(state.timer.intervalId);
      state.timer.isRunning = false;
      document.body.classList.remove('timer-running');
      
      playAlarmChime();
      handleSessionComplete();
    }
  }, 1000);
}

function pauseTimer() {
  if (!state.timer.isRunning) return;
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.body.classList.remove('timer-running');
  
  timerPlayBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    <span>Resume Focus</span>
  `;
}

function resetTimer() {
  pauseTimer();
  state.timer.timeLeft = state.timer.duration;
  updateTimerDisplay();
}

function changePresetTimer(duration, label, triggerBtn) {
  presetBtns.forEach(b => b.classList.remove('active'));
  triggerBtn.classList.add('active');
  
  state.timer.duration = parseInt(duration);
  state.timer.label = label;
  resetTimer();
}

function handleSessionComplete() {
  const isFocus = state.timer.label === 'FOCUS SESSION';
  const durationMin = Math.round(state.timer.duration / 60);

  if (isFocus) {
    state.stats.completedSessions++;
    state.stats.totalMinutes += durationMin;
    logStatsEntry('Focus Session', `${durationMin} mins`, 'Completed');
  } else {
    logStatsEntry('Relax Break', `${durationMin} mins`, 'Completed');
  }

  saveStatsToStorage();
  updateStatsDisplay();

  // Reset clock
  state.timer.timeLeft = state.timer.duration;
  
  // Autostart next step checks
  if (state.timer.autostart) {
    // Toggle Focus to break, break to focus automatically
    if (isFocus) {
      // Switch to break
      const breakBtn = document.querySelector('[data-label="SHORT BREAK"]');
      changePresetTimer(300, 'SHORT BREAK', breakBtn);
    } else {
      // Switch back to focus
      const focusBtn = document.querySelector('[data-label="FOCUS SESSION"]');
      changePresetTimer(1500, 'FOCUS SESSION', focusBtn);
    }
    setTimeout(startTimer, 1000);
  } else {
    resetTimer();
  }
}

// ==========================================================================
// TASKS MANAGER
// ==========================================================================

function loadTasks() {
  const loaded = localStorage.getItem('rin_tasks');
  if (loaded) {
    state.tasks = JSON.parse(loaded);
  } else {
    state.tasks = [
      { id: 1, text: 'Review deep focus research papers', priority: 'high', completed: false },
      { id: 2, text: 'Calibrate procedural synth frequencies', priority: 'medium', completed: true }
    ];
    saveTasks();
  }
  renderTasks();
}

function saveTasks() {
  localStorage.setItem('rin_tasks', JSON.stringify(state.tasks));
  updateTaskMeta();
}

function renderTasks() {
  todoList.innerHTML = '';
  
  const filtered = state.tasks.filter(t => {
    if (state.taskFilter === 'active') return !t.completed;
    if (state.taskFilter === 'completed') return t.completed;
    return true; // all
  });

  if (filtered.length === 0) {
    todoList.innerHTML = `<li class="empty-list-placeholder">No matching tasks found.</li>`;
    return;
  }

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''}>
      <span class="todo-text">${escapeHtml(task.text)}</span>
      <span class="todo-priority-tag priority-${task.priority}">${task.priority}</span>
      <button class="delete-todo-btn" aria-label="Delete task">&times;</button>
    `;

    // Event hooks
    li.querySelector('.todo-checkbox').addEventListener('change', () => {
      task.completed = !task.completed;
      if (task.completed) {
        state.stats.tasksFinished++;
        saveStatsToStorage();
        updateStatsDisplay();
      } else {
        if (state.stats.tasksFinished > 0) state.stats.tasksFinished--;
        saveStatsToStorage();
        updateStatsDisplay();
      }
      saveTasks();
      renderTasks();
    });

    li.querySelector('.delete-todo-btn').addEventListener('click', () => {
      state.tasks = state.tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    todoList.appendChild(li);
  });
}

function updateTaskMeta() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  taskCompletedRatio.textContent = `${completed}/${total} completed`;
}

function addNewTask(text, priority) {
  const newTask = {
    id: Date.now(),
    text,
    priority,
    completed: false
  };
  state.tasks.push(newTask);
  saveTasks();
  renderTasks();
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ==========================================================================
// MINDFUL BREATH GUIDE TIMER
// ==========================================================================

function handleBreathModeSelect(targetBtn) {
  breathModeBtns.forEach(b => b.classList.remove('active'));
  targetBtn.classList.add('active');

  const inhale = parseInt(targetBtn.dataset.inhale);
  const hold1 = parseInt(targetBtn.dataset.hold1);
  const exhale = parseInt(targetBtn.dataset.exhale);
  const hold2 = parseInt(targetBtn.dataset.hold2);

  // Set sequence configuration
  state.breath.config = { inhale, hold1, exhale, hold2 };
  stopBreathGuide();
}

function startBreathGuide() {
  ensureAudioStarted();
  state.breath.isRunning = true;
  state.breath.cycles = 0;
  state.breath.step = 0;
  
  breathCycleCounter.textContent = 'Cycle #1';
  breathStartBtn.textContent = 'Stop Breathing';

  if (!state.breath.config) {
    // Default Box Breath configuration
    state.breath.config = { inhale: 4, hold1: 4, exhale: 4, hold2: 4 };
  }

  runBreathStep();
}

function stopBreathGuide() {
  if (state.breath.intervalId) {
    clearTimeout(state.breath.intervalId);
  }
  state.breath.isRunning = false;
  
  breathCircle.className = 'breath-guide-circle';
  breathInstruction.textContent = 'Click Start to Breathe';
  breathCycleCounter.textContent = 'Cycle #0';
  breathStartBtn.textContent = 'Start Box Breath';
}

function runBreathStep() {
  if (!state.breath.isRunning) return;

  const cfg = state.breath.config;
  let duration = 0;
  let text = '';
  let className = '';

  // Determine current breathing step sequence
  switch (state.breath.step) {
    case 0: // Inhale
      text = 'Inhale';
      className = 'breath-guide-circle inhale';
      duration = cfg.inhale;
      break;
    case 1: // Hold
      text = cfg.hold1 > 0 ? 'Hold' : '';
      className = 'breath-guide-circle hold';
      duration = cfg.hold1;
      break;
    case 2: // Exhale
      text = 'Exhale';
      className = 'breath-guide-circle exhale';
      duration = cfg.exhale;
      break;
    case 3: // Hold
      text = cfg.hold2 > 0 ? 'Hold' : '';
      className = 'breath-guide-circle';
      duration = cfg.hold2;
      break;
  }

  // Adjust instruction display
  if (duration > 0) {
    breathInstruction.textContent = text;
    breathCircle.className = className;
    // Set circle transition speed dynamically to match inhale/exhale timing!
    breathCircle.style.transitionDuration = `${duration}s`;
    
    // Tick countdown
    let timeLeft = duration;
    const ticker = setInterval(() => {
      if (!state.breath.isRunning) {
        clearInterval(ticker);
        return;
      }
      breathInstruction.textContent = `${text} (${timeLeft})`;
      timeLeft--;
      if (timeLeft < 0) clearInterval(ticker);
    }, 1000);

    state.breath.intervalId = setTimeout(() => {
      advanceBreathCycle();
    }, duration * 1000);
  } else {
    // Skip this step since duration is zero (e.g. coherence mode lacks hold steps)
    state.breath.step = (state.breath.step + 1) % 4;
    runBreathStep();
  }
}

function advanceBreathCycle() {
  state.breath.step = (state.breath.step + 1) % 4;
  if (state.breath.step === 0) {
    state.breath.cycles++;
    breathCycleCounter.textContent = `Cycle #${state.breath.cycles + 1}`;
  }
  runBreathStep();
}

// ==========================================================================
// ANALYTICS TRACKER & HISTORY LOGGER
// ==========================================================================

function loadStats() {
  const loaded = localStorage.getItem('rin_stats');
  if (loaded) {
    state.stats = JSON.parse(loaded);
  } else {
    state.stats = {
      totalMinutes: 0,
      completedSessions: 0,
      tasksFinished: 0,
      historyLog: []
    };
    saveStatsToStorage();
  }
  updateStatsDisplay();
}

function saveStatsToStorage() {
  localStorage.setItem('rin_stats', JSON.stringify(state.stats));
}

function logStatsEntry(type, duration, status) {
  const dateStr = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  state.stats.historyLog.unshift({
    timestamp: dateStr,
    type,
    duration,
    status
  });
  
  // Cap history logs list at 30 items
  if (state.stats.historyLog.length > 30) {
    state.stats.historyLog.pop();
  }
}

function updateStatsDisplay() {
  statMinutesEl.textContent = state.stats.totalMinutes;
  statSessionsEl.textContent = state.stats.completedSessions;
  statTasksEl.textContent = state.stats.tasksFinished;

  statsLogTbody.innerHTML = '';
  if (state.stats.historyLog.length === 0) {
    statsLogTbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-table-placeholder">No focus logs recorded yet.</td>
      </tr>
    `;
    return;
  }

  state.stats.historyLog.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${log.timestamp}</td>
      <td>${log.type}</td>
      <td>${log.duration}</td>
      <td><span class="status-indicator-dot" style="background:var(--accent); display:inline-block; margin-right:5px;"></span>${log.status}</td>
    `;
    statsLogTbody.appendChild(tr);
  });
}

function resetAllStatsData() {
  if (confirm("Are you sure you want to clear your productivity logs and metrics?")) {
    state.stats = {
      totalMinutes: 0,
      completedSessions: 0,
      tasksFinished: 0,
      historyLog: []
    };
    saveStatsToStorage();
    updateStatsDisplay();
  }
}

// ==========================================================================
// DYNAMIC DUAL CANVAS AUDIO VISUALIZER
// ==========================================================================

function initVisualizer() {
  canvas = document.getElementById('visualizer-canvas');
  ctx = canvas.getContext('2d');
  
  handleCanvasResize();
  window.addEventListener('resize', handleCanvasResize);

  // Populate dynamic particle array for Starfield
  for (let i = 0; i < 45; i++) {
    particleArray.push(new VisualizerParticle());
  }

  renderVisualizerFrame();
}

function handleCanvasResize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

class VisualizerParticle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2.5 + 0.5;
    this.speedX = Math.random() * 0.4 - 0.2;
    this.speedY = Math.random() * 0.3 - 0.15;
    this.opacity = Math.random() * 0.5 + 0.25;
  }

  update(audioIntensity) {
    // Particles drift and expand when bass frequencies rise!
    this.x += this.speedX * (1.0 + audioIntensity * 5.0);
    this.y += this.speedY * (1.0 + audioIntensity * 5.0);
    
    // Boundary resets
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;
  }

  draw(accentColor, audioIntensity) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (1.0 + audioIntensity * 1.5), 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = this.opacity * (1.0 + audioIntensity * 0.8);
    ctx.fill();
    ctx.restore();
  }
}

function renderVisualizerFrame() {
  if (!state.canvasActive) {
    animationFrameId = requestAnimationFrame(renderVisualizerFrame);
    return;
  }

  // Get active accent colors
  const activeColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#8b5cf6';
  
  // Clear with transparent alpha to keep glow layers behind panels
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let bassIntensity = 0;
  let dataArray = new Uint8Array(0);

  if (state.audioCtx && state.analyser) {
    const bufferLength = state.analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    if (state.visualizerStyle === 'wave') {
      state.analyser.getByteTimeDomainData(dataArray);
    } else {
      state.analyser.getByteFrequencyData(dataArray);
    }

    // Evaluate average intensity for lower bass bands
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += dataArray[i] || 0;
    }
    bassIntensity = (sum / 12) / 255;
  }

  // 1. Particle Starfield Render
  if (state.visualizerStyle === 'particles' || state.visualizerStyle === 'bars') {
    particleArray.forEach(p => {
      p.update(bassIntensity);
      p.draw(activeColor, bassIntensity);
    });
  }

  // 2. Oscilloscope Waveform render
  if (state.visualizerStyle === 'wave' && dataArray.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = activeColor;
    ctx.globalAlpha = 0.35 + bassIntensity * 0.45;
    
    const sliceWidth = canvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Audio Frequency Bars render (Circular ring around timer)
  if (state.visualizerStyle === 'bars' && dataArray.length > 0) {
    ctx.save();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 240 + (bassIntensity * 12);
    const maxBars = 60;

    ctx.translate(centerX, centerY);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.22;

    for (let i = 0; i < maxBars; i++) {
      const freqVal = dataArray[i % dataArray.length] || 0;
      const height = (freqVal / 255) * 45;
      const angle = (i / maxBars) * Math.PI * 2;

      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -baseRadius);
      ctx.lineTo(0, -baseRadius - height);
      ctx.stroke();
      ctx.rotate(-angle);
    }
    ctx.restore();
  }

  animationFrameId = requestAnimationFrame(renderVisualizerFrame);
}

// ==========================================================================
// SYSTEM HANDLERS: THEMES, NAVIGATION, KEYBOARD EVENTS & SHORTCUTS
// ==========================================================================

function switchTab(targetName) {
  navTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.target === targetName);
  });

  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `${targetName}-panel`);
  });
}

function cycleThemes() {
  const list = ['space', 'aurora', 'sunset'];
  let idx = list.indexOf(state.activeTheme);
  idx = (idx + 1) % list.length;
  
  selectThemeStyle(list[idx]);
}

function selectThemeStyle(themeName) {
  document.body.className = `theme-${themeName}`;
  state.activeTheme = themeName;
  
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === themeName);
  });
  
  // Shift visualizer particles to align with gradient feel
  localStorage.setItem('rin_theme', themeName);
}

function toggleFullscreenWorkspace() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      document.body.classList.add('fullscreen-mode');
    }).catch(err => {
      console.warn(`Fullscreen activation blocked: ${err.message}`);
    });
  } else {
    document.exitFullscreen().then(() => {
      document.body.classList.remove('fullscreen-mode');
    });
  }
}

// Keyboard shortcuts helper Modal
function toggleShortcutsModal(show) {
  shortcutsModal.classList.toggle('hidden', !show);
}

// Bind System Keyboard Shortcuts
function bindKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Do not trigger actions when writing text inside inputs
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
      // Allow escape key to unfocus inputs
      if (e.key === 'Escape') activeEl.blur();
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ': // Spacebar
        e.preventDefault();
        if (state.timer.isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
        break;
      case 'r': // Reset
        resetTimer();
        break;
      case 'm': // Mute
        toggleMasterMute();
        break;
      case 'f': // Fullscreen
        toggleFullscreenWorkspace();
        break;
      case '1':
        toggleSound('rain');
        break;
      case '2':
        toggleSound('waves');
        break;
      case '3':
        toggleSound('drone');
        break;
      case '4':
        toggleSound('binaural');
        break;
      case '5':
        toggleSound('campfire');
        break;
      case '6':
        toggleSound('cafe');
        break;
      case 't': // Cycle theme
        cycleThemes();
        break;
    }
  });
}

// ==========================================================================
// SYSTEM EVENT ATTACHMENTS
// ==========================================================================

function attachEvents() {
  // Navigation Tabs Selector
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.target));
  });

  // Sound Card Switch Toggles & sliders
  document.querySelectorAll('.sound-card').forEach(card => {
    const name = card.dataset.sound;
    const switchBtn = card.querySelector('.sound-card-switch');
    const volSlider = card.querySelector('.volume-slider');
    const paramSlider = card.querySelector('.param-slider');

    switchBtn.addEventListener('click', () => toggleSound(name));
    volSlider.addEventListener('input', (e) => handleVolumeChange(name, e.target.value));
    
    if (paramSlider) {
      paramSlider.addEventListener('input', (e) => {
        handleParamChange(name, paramSlider.dataset.param, e.target.value);
      });
    }
  });

  // Timer Buttons
  timerPlayBtn.addEventListener('click', () => {
    if (state.timer.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });
  timerResetBtn.addEventListener('click', resetTimer);

  // Preset time selections
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      changePresetTimer(btn.dataset.duration, btn.dataset.label, btn);
    });
  });

  // Apply custom time spinner input
  applyCustomTimerBtn.addEventListener('click', () => {
    const mins = parseInt(customMinInput.value);
    if (mins > 0 && mins <= 180) {
      const dur = mins * 60;
      presetBtns.forEach(b => b.classList.remove('active'));
      state.timer.duration = dur;
      state.timer.label = 'FOCUS SESSION';
      resetTimer();
    }
  });

  // Master Mute Selector
  masterMuteBtn.addEventListener('click', toggleMasterMute);

  // Theme Dropdown Toggle
  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeSelectorPanel.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    themeSelectorPanel.classList.add('hidden');
  });

  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectThemeStyle(opt.dataset.theme);
      themeSelectorPanel.classList.add('hidden');
    });
  });

  // Fullscreen trigger
  fullscreenBtn.addEventListener('click', toggleFullscreenWorkspace);
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      document.body.classList.remove('fullscreen-mode');
    }
  });

  // Modal dialog popups
  keyboardShortcutsBtn.addEventListener('click', () => toggleShortcutsModal(true));
  closeModalBtn.addEventListener('click', () => toggleShortcutsModal(false));
  shortcutsModal.addEventListener('click', (e) => {
    if (e.target === shortcutsModal) toggleShortcutsModal(false);
  });

  // Todo Task Form Submission
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = todoInput.value.trim();
    const priority = todoPriority.value;
    if (txt) {
      addNewTask(txt, priority);
      todoInput.value = '';
    }
  });

  // Filter Tasks list
  taskFilters.forEach(tab => {
    tab.addEventListener('click', () => {
      taskFilters.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.taskFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  // Clear Completed tasks
  clearCompletedBtn.addEventListener('click', () => {
    state.tasks = state.tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
  });

  // Breathing Space triggers
  breathStartBtn.addEventListener('click', () => {
    if (state.breath.isRunning) {
      stopBreathGuide();
    } else {
      startBreathGuide();
    }
  });

  breathModeBtns.forEach(btn => {
    btn.addEventListener('click', () => handleBreathModeSelect(btn));
  });

  // Mixer presets save drawer triggers
  savePresetTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    presetDrawer.classList.toggle('visible');
  });

  savePresetConfirmBtn.addEventListener('click', () => {
    const name = newPresetNameInput.value;
    createPreset(name);
  });

  // Analytics controllers
  resetStatsBtn.addEventListener('click', resetAllStatsData);

  // Advanced settings preferences
  visualizerStyleSelect.addEventListener('change', (e) => {
    state.visualizerStyle = e.target.value;
    state.canvasActive = state.visualizerStyle !== 'none';
  });

  keyboardClickToggle.addEventListener('click', () => {
    state.keyboardClicks = !state.keyboardClicks;
    keyboardClickToggle.classList.toggle('active', state.keyboardClicks);
  });

  timerSoundSelect.addEventListener('change', (e) => {
    state.timer.alertSound = e.target.value;
  });

  autostartToggle.addEventListener('click', () => {
    state.timer.autostart = !state.timer.autostart;
    autostartToggle.classList.toggle('active', state.timer.autostart);
  });
}

// ==========================================================================
// SYSTEM INITIATION (ONLOAD ENTRYPOINT)
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
  // Load saved preferences/theme
  const savedTheme = localStorage.getItem('rin_theme') || 'space';
  selectThemeStyle(savedTheme);

  // Initialize modular storage states
  loadPresetsFromStorage();
  loadTasks();
  loadStats();
  
  // Attach DOM events & keyboard hooks
  attachEvents();
  bindKeyboardShortcuts();
  
  // Boot dynamic canvas animations
  initVisualizer();
  updateTimerDisplay();
});
