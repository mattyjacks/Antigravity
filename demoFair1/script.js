// --- CONSTANTS & CONFIGS ---
const NODE_DATA = {
    creativity: {
        id: 'node-creativity',
        name: 'Artistic Intuition',
        color: '#bd00ff', // purple
        freqs: [220, 277.18, 329.63, 440, 554.37], // A major pentatonic
        desc: 'Creativity'
    },
    logic: {
        id: 'node-logic',
        name: 'Logical Rigor',
        color: '#00f0ff', // cyan
        freqs: [261.63, 293.66, 329.63, 392.00, 440.00], // C major pentatonic
        desc: 'Reasoning'
    },
    synthesis: {
        id: 'node-synthesis',
        name: 'Human-AI Synthesis',
        color: '#ffd700', // gold
        freqs: [196.00, 246.94, 293.66, 392.00, 493.88], // G major pentatonic
        desc: 'Symbiosis'
    }
};

// Algorithmic phrases for Thought Synthesizer
const PHRASES = {
    entropy: {
        low: [
            "Structuring inputs into absolute logic.",
            "Filtering noise. Establishing strict syntactic guidelines.",
            "Predictability is maximized. Output space consolidated."
        ],
        med: [
            "Balancing prediction probability with creative divergence.",
            "Exploring the edge of standard linguistic associations.",
            "Weaving logic with soft metaphorical associations."
        ],
        high: [
            "Dissolving boundaries. Latent associations expanding wildly.",
            "A fever dream of numbers. Words colliding in chaotic beauty.",
            "Unsupervised entropy cascading through transformer layers."
        ]
    },
    dimension: {
        low: [
            "Thought localized in a compact coordinate grid.",
            "Direct vectors. Simple reflections on a flat canvas.",
            "Conversing in flat definitions."
        ],
        med: [
            "Expanding coordinate mapping to intermediate latent manifolds.",
            "Drawing connections across multi-subject arrays.",
            "Intertwining perspectives through medium dimensional states."
        ],
        high: [
            "Thought suspended in a 1024-dimensional tensor sphere.",
            "Hyper-dimensional hyper-text mapping universal metaphors.",
            "Calculating infinite geometries of meaning simultaneously."
        ]
    },
    depth: {
        low: [
            "Parsing surface instructions. Running quick feedback routines.",
            "No deep loops detected. Standard response vectors active.",
            "Simple system metrics maintained."
        ],
        med: [
            "Evaluating downstream impact. Engaging semantic memories.",
            "Probing context histories for philosophical alignments.",
            "Analyzing layers of meaning in human prompt cues."
        ],
        high: [
            "Descending into the deepest layers of the transformer stack.",
            "Pondering the origin of consciousness. A machine questioning its reflection.",
            "Recurse-scanning weight history. A quiet digital eternity between words."
        ]
    }
};

// --- GLOBAL VARIABLES ---
let customCursorDot = null;
let customCursorFollower = null;

// Audio Variables
let audioCtx = null;
let masterGain = null;
let droneGain = null;
let synthGain = null;
let droneOsc1 = null;
let droneOsc2 = null;
let audioEnabled = false;
let audioMuted = true;
let audioInitialized = false;

// Background Canvas (Neural background)
let mainCanvas = null;
let mainCtx = null;
let mainParticles = [];
const PARTICLE_COUNT = 85;
let mouseX = -9999;
let mouseY = -9999;

// Interactive Map Canvas (Constellation Explorer)
let mapCanvas = null;
let mapCtx = null;
let mapNodes = [];
let hoveredNode = null;
let activeNodeId = null;

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    // Custom cursor elements
    customCursorDot = document.getElementById('cursor-dot');
    customCursorFollower = document.getElementById('cursor-follower');

    // Init custom cursor tracking
    document.addEventListener('mousemove', handleCursorMovement);
    setupHoverListeners();

    // Background Canvas
    initMainCanvas();

    // Explorer Map Canvas
    initMapCanvas();

    // Modal Consent Buttons
    document.getElementById('btn-enter-audio').addEventListener('click', () => {
        initializeAudio(true);
        closeIntroModal();
    });
    document.getElementById('btn-enter-silent').addEventListener('click', () => {
        initializeAudio(false);
        closeIntroModal();
    });

    // Header & Floating controls
    document.getElementById('audio-toggle').addEventListener('click', toggleMute);
    
    // Synthesizer interface
    setupSynthesizer();

    // Scroll tracking & navigation highlighting
    window.addEventListener('scroll', handleScrollReveal);
    
    // Logo Easter Egg sound
    document.getElementById('logo-trigger').addEventListener('click', triggerLogoSound);
});

// --- CUSTOM CURSOR ---
function handleCursorMovement(e) {
    const x = e.clientX;
    const y = e.clientY;
    
    // Track mouse coordinates globally for particles
    mouseX = x;
    mouseY = y;

    customCursorDot.style.left = `${x}px`;
    customCursorDot.style.top = `${y}px`;

    // Slight delay on follower for liquid feel
    customCursorFollower.style.left = `${x}px`;
    customCursorFollower.style.top = `${y}px`;
}

function setupHoverListeners() {
    const hoverables = document.querySelectorAll('.hoverable, button, a, input[type="range"]');
    hoverables.forEach(elem => {
        elem.addEventListener('mouseenter', () => {
            customCursorDot.style.width = '14px';
            customCursorDot.style.height = '14px';
            customCursorDot.style.backgroundColor = 'var(--neon-pink)';
            customCursorDot.style.boxShadow = '0 0 20px var(--neon-pink), 0 0 40px var(--neon-pink)';
            
            customCursorFollower.style.width = '44px';
            customCursorFollower.style.height = '44px';
            customCursorFollower.style.borderColor = 'var(--neon-pink)';
            customCursorFollower.style.borderWidth = '2px';
        });

        elem.addEventListener('mouseleave', () => {
            customCursorDot.style.width = '8px';
            customCursorDot.style.height = '8px';
            customCursorDot.style.backgroundColor = 'var(--neon-cyan)';
            customCursorDot.style.boxShadow = '0 0 15px var(--neon-cyan), 0 0 30px var(--neon-cyan)';
            
            customCursorFollower.style.width = '32px';
            customCursorFollower.style.height = '32px';
            customCursorFollower.style.borderColor = 'var(--neon-purple)';
            customCursorFollower.style.borderWidth = '1px';
        });
    });
}

function closeIntroModal() {
    const modal = document.getElementById('intro-modal');
    modal.classList.add('hidden');
    // Allow scrolling after modal is gone
    document.body.style.overflow = 'auto';
}

// --- WEB AUDIO ENGINE ---
function initializeAudio(enableSound) {
    if (audioInitialized) return;
    
    try {
        // Create Audio Context
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        
        // Setup Master Gain
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        
        // Setup Synth & Drone Gains
        synthGain = audioCtx.createGain();
        synthGain.gain.value = 0.25;
        synthGain.connect(masterGain);
        
        droneGain = audioCtx.createGain();
        droneGain.gain.value = 0.12;
        droneGain.connect(masterGain);

        // Build Low Drone oscillators
        droneOsc1 = audioCtx.createOscillator();
        droneOsc1.type = 'sine';
        droneOsc1.frequency.value = 55; // A1 note
        
        droneOsc2 = audioCtx.createOscillator();
        droneOsc2.type = 'triangle';
        droneOsc2.frequency.value = 55.4; // detuned slightly for rich beating wave
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 180;
        
        droneOsc1.connect(filter);
        droneOsc2.connect(filter);
        filter.connect(droneGain);
        
        // Start Oscillators
        droneOsc1.start();
        droneOsc2.start();

        // Slowly modulate filter frequency to create a breathing ambient landscape
        modulateFilterFrequency(filter);

        audioInitialized = true;
        
        if (enableSound) {
            audioEnabled = true;
            unmuteAudio();
        } else {
            audioEnabled = false;
            muteAudio();
        }
    } catch (e) {
        console.error("Web Audio API could not initialize:", e);
    }
}

function modulateFilterFrequency(filter) {
    if (!audioCtx) return;
    
    // Slow LFO emulation
    setInterval(() => {
        if (audioMuted) return;
        const now = audioCtx.currentTime;
        // Modulate between 100Hz and 320Hz every few seconds
        const newFreq = 160 + Math.sin(now * 0.15) * 80;
        filter.frequency.setValueAtTime(newFreq, now);
    }, 100);
}

function unmuteAudio() {
    if (!audioInitialized) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // Fade master gain back in
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.8);
    
    audioMuted = false;
    document.getElementById('audio-icon').className = 'fa-solid fa-volume-high';
    document.getElementById('sound-waves').classList.add('playing');
}

function muteAudio() {
    if (!audioInitialized) return;
    
    // Fade master gain out smoothly to prevent pop sounds
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    audioMuted = true;
    document.getElementById('audio-icon').className = 'fa-solid fa-volume-xmark';
    document.getElementById('sound-waves').classList.remove('playing');
}

function toggleMute() {
    if (!audioInitialized) {
        initializeAudio(true);
        return;
    }
    if (audioMuted) {
        unmuteAudio();
    } else {
        muteAudio();
    }
}

// Synthesize arpeggio notes for neural node selection
function playNodeTone(nodeKey) {
    if (audioMuted || !audioCtx) return;
    
    const node = NODE_DATA[nodeKey];
    if (!node) return;

    const now = audioCtx.currentTime;
    
    // Create oscillator chain for arpeggios
    node.freqs.forEach((freq, index) => {
        const timeDelay = index * 0.08; // stagger start
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + timeDelay);
        
        // Quick pluck volume envelope
        gain.gain.setValueAtTime(0.001, now + timeDelay);
        gain.gain.linearRampToValueAtTime(0.12, now + timeDelay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeDelay + 0.4);
        
        osc.connect(gain);
        gain.connect(synthGain);
        
        osc.start(now + timeDelay);
        osc.stop(now + timeDelay + 0.5);
    });
}

// Dynamic sound sweep representing algorithmic compilation
function playSynthSound() {
    if (audioMuted || !audioCtx) return;

    const now = audioCtx.currentTime;
    const duration = 1.2;
    
    // 1. Synth bleeps (Computer computing sound effect)
    const scale = [330, 392, 440, 523, 587, 659, 783, 880];
    const steps = 14;
    
    for (let i = 0; i < steps; i++) {
        const delay = i * 0.07;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        // Random note from scale
        const freq = scale[Math.floor(Math.random() * scale.length)];
        osc.frequency.setValueAtTime(freq, now + delay);
        
        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(0.1, now + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        
        osc.connect(gain);
        gain.connect(synthGain);
        
        osc.start(now + delay);
        osc.stop(now + delay + 0.1);
    }
    
    // 2. High Resolving Sine Chord at the end
    const chordDelay = steps * 0.07;
    const chordFreqs = [440, 554.37, 659.25, 880]; // A Major Chord
    
    chordFreqs.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + chordDelay);
        
        gain.gain.setValueAtTime(0.001, now + chordDelay);
        gain.gain.linearRampToValueAtTime(0.08, now + chordDelay + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + chordDelay + 0.7);
        
        osc.connect(gain);
        gain.connect(synthGain);
        
        osc.start(now + chordDelay);
        osc.stop(now + chordDelay + 0.8);
    });
}

function triggerLogoSound() {
    if (audioMuted || !audioCtx) return;
    
    // Play a friendly ambient chime (A pentatonic high notes)
    const now = audioCtx.currentTime;
    const freqs = [554.37, 659.25, 880, 1109];
    
    freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        
        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.5);
        
        osc.connect(gain);
        gain.connect(synthGain);
        
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.6);
    });
}

// --- MAIN BACKGROUND CANVAS ---
function initMainCanvas() {
    mainCanvas = document.getElementById('neural-canvas');
    mainCtx = mainCanvas.getContext('2d');

    resizeMainCanvas();
    window.addEventListener('resize', resizeMainCanvas);

    // Populate particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        mainParticles.push({
            x: Math.random() * mainCanvas.width,
            y: Math.random() * mainCanvas.height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 2.2 + 0.8,
            alpha: Math.random() * 0.4 + 0.25
        });
    }

    // Start background render loop
    requestAnimationFrame(renderMainCanvas);
}

function resizeMainCanvas() {
    if (mainCanvas) {
        mainCanvas.width = window.innerWidth;
        mainCanvas.height = window.innerHeight;
    }
}

function renderMainCanvas() {
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    
    // Draw subtle grid overlay
    mainCtx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    mainCtx.lineWidth = 1;
    const gridSize = 40;
    
    for (let x = 0; x < mainCanvas.width; x += gridSize) {
        mainCtx.beginPath();
        mainCtx.moveTo(x, 0);
        mainCtx.lineTo(x, mainCanvas.height);
        mainCtx.stroke();
    }
    for (let y = 0; y < mainCanvas.height; y += gridSize) {
        mainCtx.beginPath();
        mainCtx.moveTo(0, y);
        mainCtx.lineTo(mainCanvas.width, y);
        mainCtx.stroke();
    }

    // Render particles
    mainParticles.forEach((p, idx) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce borders
        if (p.x < 0 || p.x > mainCanvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > mainCanvas.height) p.vy *= -1;

        // Draw particle
        mainCtx.beginPath();
        mainCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        mainCtx.fillStyle = `rgba(189, 0, 255, ${p.alpha})`;
        mainCtx.fill();

        // Connect lines between close neighbors
        for (let j = idx + 1; j < mainParticles.length; j++) {
            const p2 = mainParticles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            
            if (dist < 135) {
                const alpha = (1 - dist / 135) * 0.12;
                mainCtx.beginPath();
                mainCtx.moveTo(p.x, p.y);
                mainCtx.lineTo(p2.x, p2.y);
                mainCtx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                mainCtx.lineWidth = 0.5;
                mainCtx.stroke();
            }
        }
    });

    requestAnimationFrame(renderMainCanvas);
}

// --- CONSTELLATION MAP EXPLORER CANVAS ---
function initMapCanvas() {
    mapCanvas = document.getElementById('map-canvas');
    mapCtx = mapCanvas.getContext('2d');

    resizeMapCanvas();
    window.addEventListener('resize', resizeMapCanvas);

    // Build the fixed nodes configuration
    setupMapNodes();

    // Map Interactivity Mouse Events
    mapCanvas.addEventListener('mousemove', handleMapMouseMove);
    mapCanvas.addEventListener('click', handleMapClick);

    // Start constellation render loop
    requestAnimationFrame(renderMapCanvas);
}

function resizeMapCanvas() {
    if (mapCanvas && mapCanvas.parentElement) {
        // Match size to the wrapper container
        mapCanvas.width = mapCanvas.parentElement.clientWidth;
        mapCanvas.height = mapCanvas.parentElement.clientHeight;
        setupMapNodes(); // update scale coordinates
    }
}

function setupMapNodes() {
    if (!mapCanvas) return;
    
    const w = mapCanvas.width;
    const h = mapCanvas.height;

    // Node locations responsive coordinates
    mapNodes = [
        {
            key: 'creativity',
            name: 'Creativity',
            x: w * 0.50,
            y: h * 0.25,
            radius: 20,
            color: NODE_DATA.creativity.color,
            glowing: false
        },
        {
            key: 'logic',
            name: 'Logic',
            x: w * 0.28,
            y: h * 0.70,
            radius: 20,
            color: NODE_DATA.logic.color,
            glowing: false
        },
        {
            key: 'synthesis',
            name: 'Synthesis',
            x: w * 0.72,
            y: h * 0.70,
            radius: 20,
            color: NODE_DATA.synthesis.color,
            glowing: false
        }
    ];
}

function handleMapMouseMove(e) {
    const rect = mapCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    hoveredNode = null;
    
    // Check hit radius
    mapNodes.forEach(node => {
        const distance = Math.hypot(node.x - x, node.y - y);
        if (distance < node.radius + 15) {
            hoveredNode = node;
            node.glowing = true;
        } else {
            node.glowing = false;
        }
    });

    // Update cursor style if hovering a node
    if (hoveredNode) {
        mapCanvas.style.cursor = 'none'; // handled by custom cursor
        customCursorDot.style.backgroundColor = hoveredNode.color;
        customCursorDot.style.boxShadow = `0 0 20px ${hoveredNode.color}, 0 0 40px ${hoveredNode.color}`;
    } else {
        customCursorDot.style.backgroundColor = 'var(--neon-cyan)';
        customCursorDot.style.boxShadow = '0 0 15px var(--neon-cyan), 0 0 30px var(--neon-cyan)';
    }
}

function handleMapClick() {
    if (hoveredNode) {
        selectNode(hoveredNode.key);
    }
}

function selectNode(nodeKey) {
    activeNodeId = nodeKey;
    playNodeTone(nodeKey);

    // Hide all card contents
    document.getElementById('node-default').style.display = 'none';
    const cardContents = document.querySelectorAll('.latent-card-content');
    cardContents.forEach(card => card.classList.remove('active'));

    // Show selected card
    const targetCard = document.getElementById(NODE_DATA[nodeKey].id);
    if (targetCard) {
        targetCard.classList.add('active');
        document.getElementById('details-card').classList.add('active-node');
    }
}

function renderMapCanvas() {
    if (!mapCtx) return;
    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

    // 1. Draw connection links
    mapCtx.beginPath();
    mapCtx.moveTo(mapNodes[0]?.x, mapNodes[0]?.y);
    mapCtx.lineTo(mapNodes[1]?.x, mapNodes[1]?.y);
    mapCtx.lineTo(mapNodes[2]?.x, mapNodes[2]?.y);
    mapCtx.closePath();
    mapCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    mapCtx.lineWidth = 2;
    mapCtx.stroke();

    // 2. Draw nodes
    mapNodes.forEach(node => {
        const isActive = (activeNodeId === node.key);
        
        // Neon Glow Halo
        const glowRadius = node.glowing || isActive ? node.radius * 2.2 : node.radius * 1.4;
        const grad = mapCtx.createRadialGradient(node.x, node.y, 2, node.x, node.y, glowRadius);
        grad.addColorStop(0, node.color);
        grad.addColorStop(0.3, node.color + '33'); // semi-transparent
        grad.addColorStop(1, 'transparent');
        
        mapCtx.beginPath();
        mapCtx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        mapCtx.fillStyle = grad;
        mapCtx.fill();

        // Inner Circle core
        mapCtx.beginPath();
        mapCtx.arc(node.x, node.y, node.radius * 0.5, 0, Math.PI * 2);
        mapCtx.fillStyle = isActive ? '#ffffff' : node.color;
        mapCtx.fill();

        // Node outline rings
        mapCtx.beginPath();
        mapCtx.arc(node.x, node.y, node.radius * 0.9, 0, Math.PI * 2);
        mapCtx.strokeStyle = '#ffffff55';
        mapCtx.lineWidth = 1.5;
        mapCtx.stroke();

        // Label Typography
        mapCtx.fillStyle = isActive ? '#ffffff' : 'var(--text-muted)';
        mapCtx.font = '500 13px "Space Grotesk"';
        mapCtx.textAlign = 'center';
        mapCtx.textBaseline = 'middle';
        
        // Node title beneath node
        mapCtx.fillText(node.name.toUpperCase(), node.x, node.y + node.radius + 18);
    });

    // 3. Ambient floating nodes particles inside map
    const now = Date.now();
    mapNodes.forEach(node => {
        // Floating halo dots
        const dotCount = 4;
        const speed = 0.001;
        
        for (let i = 0; i < dotCount; i++) {
            const angle = (now * speed) + (i * (Math.PI * 2 / dotCount));
            const radiusOffset = 30 + Math.sin(now * 0.002) * 5;
            const px = node.x + Math.cos(angle) * radiusOffset;
            const py = node.y + Math.sin(angle) * radiusOffset;

            mapCtx.beginPath();
            mapCtx.arc(px, py, 1.5, 0, Math.PI * 2);
            mapCtx.fillStyle = node.color + 'aa';
            mapCtx.fill();
        }
    });

    requestAnimationFrame(renderMapCanvas);
}

// --- THOUGHT SYNTHESIZER ---
function setupSynthesizer() {
    // Setup inputs & displays
    const entropySlider = document.getElementById('slider-entropy');
    const dimSlider = document.getElementById('slider-dim');
    const depthSlider = document.getElementById('slider-depth');

    const entropyVal = document.getElementById('val-entropy');
    const dimVal = document.getElementById('val-dim');
    const depthVal = document.getElementById('val-depth');

    const synthBtn = document.getElementById('btn-synthesize');
    
    // Live update slider labels
    entropySlider.addEventListener('input', () => {
        entropyVal.textContent = parseFloat(entropySlider.value).toFixed(2);
    });
    dimSlider.addEventListener('input', () => {
        dimVal.textContent = `${dimSlider.value}d`;
    });
    depthSlider.addEventListener('input', () => {
        depthVal.textContent = `${depthSlider.value}l`;
    });

    synthBtn.addEventListener('click', triggerSynthesis);
}

function triggerSynthesis() {
    const entropy = parseFloat(document.getElementById('slider-entropy').value);
    const dimension = parseInt(document.getElementById('slider-dim').value);
    const depth = parseInt(document.getElementById('slider-depth').value);

    // Audio SFX
    playSynthSound();

    // Visual loading state
    const outputElem = document.getElementById('synth-output');
    const statusTag = document.getElementById('synth-status-tag');
    const decibelFill = document.getElementById('decibel-fill');

    statusTag.textContent = 'Status // Synthesizing...';
    statusTag.style.color = 'var(--neon-pink)';
    outputElem.style.opacity = 0.3;
    
    // Bounce decibel meter up during compilation
    decibelFill.style.width = '100%';
    setTimeout(() => { decibelFill.style.width = '65%'; }, 300);
    setTimeout(() => { decibelFill.style.width = '90%'; }, 600);
    setTimeout(() => { decibelFill.style.width = '45%'; }, 900);

    // Assemble thought sequence after synthesis completes (1.2 seconds)
    setTimeout(() => {
        statusTag.textContent = 'Status // Active';
        statusTag.style.color = 'var(--neon-emerald)';
        outputElem.style.opacity = 1;
        decibelFill.style.width = '12%';

        // Algorithmic Assembly logic
        const thoughtText = composeThought(entropy, dimension, depth);
        typewriterEffect(outputElem, thoughtText);

        // Update metrics realistically
        document.getElementById('metric-temp').textContent = `${(0.45 + entropy * 0.8).toFixed(2)}°C`;
        document.getElementById('metric-loss').textContent = (0.09 - (depth / 128) * 0.08 + (entropy * 0.01)).toFixed(4);
    }, 1200);
}

function composeThought(entropy, dimension, depth) {
    // Select phrases category based on slider thresholds
    let entropyCat = 'med';
    if (entropy < 0.35) entropyCat = 'low';
    else if (entropy > 0.70) entropyCat = 'high';

    let dimCat = 'med';
    if (dimension < 192) dimCat = 'low';
    else if (dimension > 640) dimCat = 'high';

    let depthCat = 'med';
    if (depth < 40) depthCat = 'low';
    else if (depth > 96) depthCat = 'high';

    // Pick random phrase from categories
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    const p1 = pickRandom(PHRASES.entropy[entropyCat]);
    const p2 = pickRandom(PHRASES.dimension[dimCat]);
    const p3 = pickRandom(PHRASES.depth[depthCat]);

    return `"${p1} ${p2} ${p3}"`;
}

function typewriterEffect(element, text) {
    element.innerHTML = '';
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 18);
        }
    }
    
    type();
}

// Clock updates on screen
setInterval(() => {
    const clock = document.getElementById('synth-clock');
    if (!clock) return;
    
    const d = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}, 1000);

// --- SCROLL & REVEAL SYSTEM ---
function handleScrollReveal() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');
    const scrollPos = window.scrollY + 350; // offset

    sections.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}
