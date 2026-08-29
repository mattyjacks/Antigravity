/**
 * IT'S WALLY'S WORLD 3D - SPEEDRUN RACE GAME ENGINE (Three.js r128)
 * 3rd Person Mobile & PC Ready Speedrun Experience
 *
 * Race Wally Boy to the legendary Wally's World Storefront before scalpers beat you!
 * Features:
 * - 3rd Person dynamic character & spring camera controller (Wally faces the store, running forward into the screen)
 * - PC Keyboard (WASD/Arrows, Space to jump, Shift/E to boost) & Mobile Virtual Joystick + Touch Buttons
 * - Roaming Scalper Drones & Lowballer enemies with collision warning & slowdowns
 * - Collectible 3D Graded Comic Slabs & Gold Funko Grails (+Score & Boost Energy)
 * - Neon Speed Boost Pads with hyper sprint launch
 * - Procedural Web Audio API sound synthesizer (zero external audio dependencies)
 * - Speedrun Stopwatch with ms precision, rankings (S/A/B/C), local high score saving
 * - Fullscreen, Camera view switcher (3rd Person, Action Close, Top Radar, Free Orbit)
 */

class WallyWorld3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      storeModelPath: 'assets/models/wally_store.glb',
      boyModelPath: 'assets/models/wally_boy_running.glb',
      trackLength: 160, // Start at z = 160, Store at z = 0
      trackWidth: 16,
      theme: 'luxe'
    }, options);

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.orbitControls = null;
    this.clock = new THREE.Clock();

    // Game States: 'loading', 'menu', 'countdown', 'playing', 'victory', 'orbit'
    this.gameState = 'loading';
    this.difficulty = 'normal'; // 'normal', 'hard'

    // Models & Meshes
    this.storeMesh = null;
    this.boyMesh = null;
    this.mixer = null;
    this.runAction = null;
    this.particles = null;
    this.finishConfetti = [];

    // Player Physics & Controller (Heading 0 = Facing -Z towards Store at Z=0)
    this.player = {
      pos: new THREE.Vector3(0, 0, 150),
      velocity: new THREE.Vector3(0, 0, 0),
      heading: 0, // 0 = facing forward towards Store (-Z)
      baseSpeed: 16.5,
      currentSpeed: 0,
      boostSpeedMultiplier: 1.85,
      isGrounded: true,
      vy: 0,
      jumpForce: 12.0,
      gravity: -28.0,
      isBoosting: false,
      boostEnergy: 100, // 0 - 100%
      isSlowed: false,
      slowTimer: 0,
      slowMultiplier: 1.0,
      grailsCollected: 0,
      totalGrails: 8,
      score: 0,
      boostPadsHit: 0,
      enemyHits: 0
    };

    // Camera settings (Follows behind Wally at +Z looking towards -Z)
    this.cameraMode = 'follow'; // 'follow', 'close', 'top', 'orbit'
    this.currentCamPos = new THREE.Vector3(0, 3.5, 155);
    this.currentCamTarget = new THREE.Vector3(0, 1.2, 140);
    this.shakeIntensity = 0;
    this.targetFov = 45;

    // Track Entities
    this.enemies = [];
    this.collectibles = [];
    this.boostPads = [];
    this.hazards = [];

    // Input States
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      boost: false
    };

    // Mobile Joystick
    this.joystick = {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      vectorX: 0,
      vectorY: 0
    };

    // Timer & Scores
    this.startTime = 0;
    this.elapsedTime = 0;
    this.penaltyTime = 0;
    this.bestTime = parseFloat(localStorage.getItem('wally_speedrun_best') || '0');

    // Audio Engine
    this.audio = new WallyAudioEngine();
    this.audioEnabled = true;

    // DOM Elements Cache
    this.dom = {};

    this.init();
  }

  /* ==========================================================================
     1. INITIALIZATION & SCENE SETUP
     ========================================================================== */
  init() {
    this.createDOMStructure();
    this.initThree();
    this.initLights();
    this.buildSpeedrunTrack();
    this.loadModels();
    this.initInputListeners();
    this.initUIEvents();
    this.animate();
  }

  createDOMStructure() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.userSelect = 'none';
    this.container.style.webkitUserSelect = 'none';

    const hud = document.createElement('div');
    hud.className = 'wally-game-hud';
    hud.innerHTML = `
      <!-- TOP STATUS BAR -->
      <div class="game-top-bar">
        <div class="hud-stat-pill time-pill">
          <i class="fa-solid fa-stopwatch text-gold"></i>
          <span class="hud-time-val" id="wallyTimerDisplay">00:00.00</span>
        </div>

        <div class="hud-stat-pill progress-pill">
          <div class="track-progress-bar">
            <div class="track-progress-fill" id="wallyProgressFill"></div>
            <div class="track-runner-icon" id="wallyRunnerIcon">🏃</div>
            <div class="track-store-icon">🏛️</div>
          </div>
          <span class="hud-dist-text" id="wallyDistText">150m</span>
        </div>

        <div class="hud-stat-pill score-pill">
          <i class="fa-solid fa-gem text-gold"></i>
          <span id="wallyScoreVal">0 PTS</span>
          <span class="grail-count" id="wallyGrailCount">(0/8)</span>
        </div>

        <div class="game-top-actions">
          <button class="game-icon-btn" id="wallyCamToggle" title="Switch Camera (C)"><i class="fa-solid fa-camera"></i></button>
          <button class="game-icon-btn" id="wallySoundToggle" title="Toggle Sound"><i class="fa-solid fa-volume-high"></i></button>
          <button class="game-icon-btn" id="wallyFullscreenBtn" title="Fullscreen"><i class="fa-solid fa-expand"></i></button>
          <button class="game-icon-btn" id="wallyRestartQuickBtn" title="Restart (R)"><i class="fa-solid fa-rotate-right"></i></button>
        </div>
      </div>

      <!-- CENTER HUD NOTIFICATIONS (Speed Surge / Debuff / Combos) -->
      <div class="game-center-alerts" id="wallyCenterAlerts">
        <div class="alert-banner" id="wallyAlertBanner"></div>
      </div>

      <!-- SPEEDOMETER & NITRO BOOST GAUGE (BOTTOM CENTER) -->
      <div class="game-bottom-center">
        <div class="nitro-gauge-wrap">
          <div class="nitro-header">
            <span><i class="fa-solid fa-bolt text-gold"></i> NITRO BOOST [SHIFT / ⚡]</span>
            <span id="wallyNitroPct">100%</span>
          </div>
          <div class="nitro-bar-track">
            <div class="nitro-bar-fill" id="wallyNitroFill"></div>
          </div>
        </div>
        <div class="speed-indicator">
          <span class="speed-val" id="wallySpeedVal">0</span>
          <span class="speed-unit">MPH</span>
        </div>
      </div>

      <!-- MOBILE TOUCH JOYSTICK (BOTTOM LEFT) -->
      <div class="touch-joystick-zone" id="wallyTouchJoystick">
        <div class="joystick-base" id="joystickBase">
          <div class="joystick-knob" id="joystickKnob"></div>
          <div class="joystick-arrows">
            <span class="arrow-up">▲</span>
            <span class="arrow-down">▼</span>
            <span class="arrow-left">◀</span>
            <span class="arrow-right">▶</span>
          </div>
        </div>
        <span class="touch-hint">DRAG TO RUN & STEER</span>
      </div>

      <!-- MOBILE TOUCH ACTION BUTTONS (BOTTOM RIGHT) -->
      <div class="touch-actions-zone">
        <button class="touch-action-btn btn-boost" id="touchBtnBoost">
          <i class="fa-solid fa-bolt"></i>
          <span>BOOST</span>
        </button>
        <button class="touch-action-btn btn-jump" id="touchBtnJump">
          <i class="fa-solid fa-angles-up"></i>
          <span>JUMP</span>
        </button>
      </div>

      <!-- COUNTDOWN OVERLAY -->
      <div class="countdown-overlay" id="wallyCountdownOverlay">
        <div class="countdown-number" id="countdownNumber">3</div>
        <div class="countdown-sub">SPRINT TO WALLY'S WORLD STORE!</div>
      </div>

      <!-- START GAME MENU OVERLAY -->
      <div class="game-modal-overlay" id="wallyStartMenu">
        <div class="game-modal-card">
          <div class="modal-badge-row">
            <span class="luxe-badge"><i class="fa-solid fa-trophy"></i> 3D NOSTALGIA SPEEDRUN</span>
            <span class="best-time-badge" id="startBestTimeBadge">BEST: --:--.--</span>
          </div>

          <h2 class="game-modal-title">WALLY'S WORLD <span class="text-gold">SPEEDRUN 3D</span></h2>
          <p class="game-modal-desc">
            Take control of Wally Boy in 3rd person! Sprint down the neon retro strip towards the store, dodge lowballer scalper drones, snatch rare comic slabs & grails, and reach Wally's World store in record time!
          </p>

          <div class="controls-guide-grid">
            <div class="control-col">
              <span class="col-title"><i class="fa-solid fa-keyboard"></i> PC KEYBOARD</span>
              <div class="ctrl-row"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>Arrows</kbd></span><span>Run & Steer</span></div>
              <div class="ctrl-row"><span><kbd>SPACEBAR</kbd></span><span>Jump Obstacles</span></div>
              <div class="ctrl-row"><span><kbd>SHIFT</kbd> / <kbd>E</kbd></span><span>Nitro Sprint</span></div>
              <div class="ctrl-row"><span><kbd>C</kbd> / <kbd>R</kbd></span><span>Camera / Restart</span></div>
            </div>
            <div class="control-col">
              <span class="col-title"><i class="fa-solid fa-mobile-screen"></i> MOBILE TOUCH</span>
              <div class="ctrl-row"><span>🕹️ Left Joystick</span><span>Analog Steer & Run</span></div>
              <div class="ctrl-row"><span>⚡ Boost Button</span><span>Hyper Sprint</span></div>
              <div class="ctrl-row"><span>⬆️ Jump Button</span><span>Vault Over Tar/Cones</span></div>
              <div class="ctrl-row"><span>👆 Drag Screen</span><span>Look / Pan View</span></div>
            </div>
          </div>

          <div class="difficulty-select-row">
            <label class="diff-btn active" data-diff="normal">
              <input type="radio" name="wallyDiff" value="normal" checked>
              <span>🏁 Classic Collector</span>
            </label>
            <label class="diff-btn" data-diff="hard">
              <input type="radio" name="wallyDiff" value="hard">
              <span>🔥 Scalper Mayhem (Hard)</span>
            </label>
          </div>

          <div class="modal-actions-row">
            <button class="btn btn-gold btn-lg btn-start-game" id="btnStartSpeedrun">
              <i class="fa-solid fa-bolt"></i> START SPEEDRUN RACE
            </button>
            <button class="btn btn-luxury-outline" id="btnFreeRoamOrbit">
              <i class="fa-solid fa-arrows-spin"></i> Free Roam / 3D Orbit
            </button>
          </div>
        </div>
      </div>

      <!-- VICTORY & RESULTS SCREEN -->
      <div class="game-modal-overlay" id="wallyVictoryMenu" style="display: none;">
        <div class="game-modal-card victory-card">
          <div class="victory-confetti-header">
            <span class="victory-icon">🏛️</span>
            <div class="victory-tag">GOAL REACHED! WALLY'S WORLD ARRIVAL</div>
            <h2 class="game-modal-title" style="margin-bottom: 0.25rem;">STORE <span class="text-gold">UNLOCKED!</span></h2>
            <div class="rank-badge" id="victoryRankBadge">S-TIER GRAIL MASTER</div>
          </div>

          <div class="victory-stats-grid">
            <div class="v-stat-card">
              <span class="v-label">TRACK TIME</span>
              <span class="v-val" id="vTrackTime">00:00.00</span>
            </div>
            <div class="v-stat-card">
              <span class="v-label">ENEMY PENALTIES</span>
              <span class="v-val text-red" id="vPenalties">+0.00s</span>
            </div>
            <div class="v-stat-card highlight">
              <span class="v-label">FINAL OFFICIAL TIME</span>
              <span class="v-val text-gold" id="vFinalTime">00:00.00</span>
            </div>
            <div class="v-stat-card">
              <span class="v-label">GRAILS & SCORE</span>
              <span class="v-val" id="vScore">0 PTS</span>
            </div>
          </div>

          <div class="new-record-banner" id="vNewRecordBanner" style="display: none;">
            <i class="fa-solid fa-crown text-gold"></i> NEW PERSONAL SPEEDRUN RECORD!
          </div>

          <div class="modal-actions-row" style="margin-top: 1.5rem;">
            <button class="btn btn-gold btn-lg" id="btnPlayAgain">
              <i class="fa-solid fa-rotate-right"></i> PLAY AGAIN (R)
            </button>
            <button class="btn btn-luxury-outline" id="btnVictoryOrbit">
              <i class="fa-solid fa-store"></i> Explore Store 3D
            </button>
            <a href="#consignment" class="btn btn-luxury-outline">
              <i class="fa-solid fa-gem"></i> Sell Collection
            </a>
          </div>
        </div>
      </div>

      <!-- 3D LOADER SCREEN -->
      <div class="hud-loading-screen" id="wally3dLoader">
        <div class="loader-spinner"></div>
        <div class="loader-text">INITIALIZING 3D SPEEDRUN ENGINE...</div>
        <div class="loader-sub">Loading Animated Wally & 3D Store Boulevard</div>
        <div class="loader-progress-bar"><div class="loader-progress-fill" id="wally3dFill"></div></div>
      </div>
    `;

    this.container.appendChild(hud);

    this.dom = {
      hud: hud,
      timer: hud.querySelector('#wallyTimerDisplay'),
      progressFill: hud.querySelector('#wallyProgressFill'),
      runnerIcon: hud.querySelector('#wallyRunnerIcon'),
      distText: hud.querySelector('#wallyDistText'),
      scoreVal: hud.querySelector('#wallyScoreVal'),
      grailCount: hud.querySelector('#wallyGrailCount'),
      nitroFill: hud.querySelector('#wallyNitroFill'),
      nitroPct: hud.querySelector('#wallyNitroPct'),
      speedVal: hud.querySelector('#wallySpeedVal'),
      alertBanner: hud.querySelector('#wallyAlertBanner'),
      countdownOverlay: hud.querySelector('#wallyCountdownOverlay'),
      countdownNum: hud.querySelector('#countdownNumber'),
      startMenu: hud.querySelector('#wallyStartMenu'),
      victoryMenu: hud.querySelector('#wallyVictoryMenu'),
      startBestTime: hud.querySelector('#startBestTimeBadge'),
      loader: hud.querySelector('#wally3dLoader'),
      loaderFill: hud.querySelector('#wally3dFill'),
      btnStart: hud.querySelector('#btnStartSpeedrun'),
      btnFreeRoam: hud.querySelector('#btnFreeRoamOrbit'),
      btnPlayAgain: hud.querySelector('#btnPlayAgain'),
      btnVictoryOrbit: hud.querySelector('#btnVictoryOrbit'),
      btnCamToggle: hud.querySelector('#wallyCamToggle'),
      btnSoundToggle: hud.querySelector('#wallySoundToggle'),
      btnFullscreen: hud.querySelector('#wallyFullscreenBtn'),
      btnRestartQuick: hud.querySelector('#wallyRestartQuickBtn'),
      touchJoystick: hud.querySelector('#wallyTouchJoystick'),
      joystickBase: hud.querySelector('#joystickBase'),
      joystickKnob: hud.querySelector('#joystickKnob'),
      touchBtnBoost: hud.querySelector('#touchBtnBoost'),
      touchBtnJump: hud.querySelector('#touchBtnJump'),
      vRank: hud.querySelector('#victoryRankBadge'),
      vTrackTime: hud.querySelector('#vTrackTime'),
      vPenalties: hud.querySelector('#vPenalties'),
      vFinalTime: hud.querySelector('#vFinalTime'),
      vScore: hud.querySelector('#vScore'),
      vRecordBanner: hud.querySelector('#vNewRecordBanner')
    };

    if (this.bestTime > 0) {
      this.dom.startBestTime.textContent = `BEST: ${this.formatTime(this.bestTime)}`;
    }
  }

  initThree() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 550;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06060c);
    this.scene.fog = new THREE.Fog(0x06060c, 50, 220);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 300);
    this.camera.position.set(0, 3.8, 155);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.container.appendChild(this.renderer.domElement);

    // OrbitControls for Spectator / Free Roam
    this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.08;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.orbitControls.minDistance = 2.5;
    this.orbitControls.maxDistance = 100;
    this.orbitControls.enabled = false;
  }

  initLights() {
    // Hemispherical Sky/Ground Light
    const hemiLight = new THREE.HemisphereLight(0xfff0dd, 0x111122, 1.6);
    this.scene.add(hemiLight);

    // Main Directional Sunlight along the runway
    const dirLight = new THREE.DirectionalLight(0xfffaee, 2.2);
    dirLight.position.set(30, 55, 75);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 240;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -160;
    dirLight.shadow.bias = -0.0002;
    this.scene.add(dirLight);

    // Storefront Accent Spotlights
    const storeGold = new THREE.PointLight(0xd4af37, 5.0, 35);
    storeGold.position.set(0, 6, 2);
    this.scene.add(storeGold);

    const storeCyan = new THREE.PointLight(0x00f0ff, 4.0, 30);
    storeCyan.position.set(-7, 5, 3);
    this.scene.add(storeCyan);

    const storePink = new THREE.PointLight(0xff007f, 4.0, 30);
    storePink.position.set(7, 5, 3);
    this.scene.add(storePink);
  }

  /* ==========================================================================
     2. TRACK, PROPS, HAZARDS, BOOST PADS & COLLECTIBLES
     ========================================================================== */
  buildSpeedrunTrack() {
    const len = this.options.trackLength; // 160
    const width = this.options.trackWidth; // 16

    // 1. Asphalt Road Track Plane (Spans Z = -10 to Z = 175)
    const roadGeo = new THREE.PlaneGeometry(width, len + 30);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x14141e,
      roughness: 0.35,
      metalness: 0.6
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, (len - 5) / 2);
    road.receiveShadow = true;
    this.scene.add(road);

    // Road Grid Lines
    const grid = new THREE.GridHelper(len + 30, 60, 0xd4af37, 0x2a2a3e);
    grid.position.set(0, 0.01, (len - 5) / 2);
    grid.scale.x = width / (len + 30);
    this.scene.add(grid);

    // Center Dashed Line
    for (let z = 5; z <= len + 10; z += 4) {
      const dashGeo = new THREE.PlaneGeometry(0.3, 2.0);
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, z);
      this.scene.add(dash);
    }

    // 2. Glowing Neon Curbs on Left & Right
    const curbGeo = new THREE.BoxGeometry(0.6, 0.3, len + 30);
    const curbMatL = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const curbMatR = new THREE.MeshBasicMaterial({ color: 0xd4af37 });

    const curbL = new THREE.Mesh(curbGeo, curbMatL);
    curbL.position.set(-width / 2, 0.15, (len - 5) / 2);
    this.scene.add(curbL);

    const curbR = new THREE.Mesh(curbGeo, curbMatR);
    curbR.position.set(width / 2, 0.15, (len - 5) / 2);
    this.scene.add(curbR);

    // 3. Start Line Arch & Finish Line Gate
    this.buildStartLine(len);
    this.buildFinishLineGate();

    // 4. Track Overhead Arches
    for (let z = 25; z < len - 15; z += 30) {
      this.buildOverheadArch(z);
    }

    // 5. Decorative Cyber Pillars along sides
    for (let z = 2; z <= len + 10; z += 12) {
      this.buildNeonPillar(-width / 2 - 2, z, 0x00f0ff);
      this.buildNeonPillar(width / 2 + 2, z, 0xff007f);
    }

    // 6. Speed Boost Pads (Chevrons)
    const boostPads = [
      { x: -3.0, z: 135 },
      { x: 3.0, z: 105 },
      { x: 0.0, z: 75 },
      { x: -3.5, z: 45 },
      { x: 2.5, z: 20 }
    ];
    boostPads.forEach(p => this.createSpeedBoostPad(p.x, p.z));

    // 7. Collectibles (CGC Graded Slabs & Gold Funko Grails)
    const collectibleSpots = [
      { x: -3.5, z: 142, type: 'comic' },
      { x: 3.5, z: 125, type: 'funko' },
      { x: 0, z: 112, type: 'comic' },
      { x: -4.0, z: 92, type: 'funko' },
      { x: 4.0, z: 80, type: 'comic' },
      { x: -2.5, z: 60, type: 'funko' },
      { x: 3.0, z: 35, type: 'comic' },
      { x: 0, z: 15, type: 'funko' }
    ];
    this.player.totalGrails = collectibleSpots.length;
    collectibleSpots.forEach(s => this.createCollectible(s.x, s.z, s.type));

    // 8. Obstacles & Tar Puddles
    const obstacleSpots = [
      { x: 0, z: 138, type: 'crate' },
      { x: -3.2, z: 118, type: 'puddle' },
      { x: 3.5, z: 98, type: 'barrier' },
      { x: 0, z: 85, type: 'puddle' },
      { x: -3.5, z: 68, type: 'crate' },
      { x: 3.0, z: 52, type: 'barrier' },
      { x: 0, z: 38, type: 'puddle' },
      { x: -2.8, z: 25, type: 'crate' }
    ];
    obstacleSpots.forEach(o => this.createObstacle(o.x, o.z, o.type));

    // 9. Scalper Drones & Lowballer Patrol Enemies
    const enemyConfigs = [
      { x: 0, z: 130, range: 4.5, speed: 2.2 },
      { x: -3.0, z: 100, range: 4.0, speed: 2.6 },
      { x: 3.0, z: 70, range: 4.5, speed: 3.0 },
      { x: 0, z: 42, range: 5.0, speed: 3.4 },
      { x: -2.5, z: 22, range: 4.5, speed: 3.6 }
    ];
    enemyConfigs.forEach(e => this.createEnemy(e));

    // 10. Ambient Floating Dust
    this.createAmbientDust();
  }

  buildStartLine(len) {
    const archMat = new THREE.MeshStandardMaterial({ color: 0x22222a, metalness: 0.8 });
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 0.6), archMat);
    archBeam.position.set(0, 5, len);
    this.scene.add(archBeam);

    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5), archMat);
    postL.position.set(-9.0, 2.5, len);
    this.scene.add(postL);

    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5), archMat);
    postR.position.set(9.0, 2.5, len);
    this.scene.add(postR);

    // Neon Start Banner
    const bannerMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.9 });
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.2), bannerMat);
    banner.position.set(0, 4.4, len);
    this.scene.add(banner);

    // Checkered Start Line Strip
    const stripGeo = new THREE.PlaneGeometry(16, 1.5);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.02, len);
    this.scene.add(strip);
  }

  buildFinishLineGate() {
    // Checkered Finish Line Strip right before store (Z = 2.5)
    const finishGeo = new THREE.PlaneGeometry(16, 2.5);
    const finishMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    const finishMesh = new THREE.Mesh(finishGeo, finishMat);
    finishMesh.rotation.x = -Math.PI / 2;
    finishMesh.position.set(0, 0.03, 2.5);
    this.scene.add(finishMesh);

    // Glowing Golden Gate Arch
    const archMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(17, 0.8, 0.8), archMat);
    topBar.position.set(0, 5.5, 2.5);
    this.scene.add(topBar);

    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5.5), archMat);
    pL.position.set(-8.5, 2.75, 2.5);
    this.scene.add(pL);

    const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5.5), archMat);
    pR.position.set(8.5, 2.75, 2.5);
    this.scene.add(pR);

    // Neon Halo Ring over Finish Gate
    const haloGeo = new THREE.TorusGeometry(3.5, 0.1, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 6.2, 2.5);
    this.scene.add(halo);
  }

  buildOverheadArch(z) {
    const archMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, metalness: 0.7 });
    const arch = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 0.4), archMat);
    arch.position.set(0, 4.8, z);
    this.scene.add(arch);

    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.8), archMat);
    pL.position.set(-9.0, 2.4, z);
    this.scene.add(pL);

    const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.8), archMat);
    pR.position.set(9.0, 2.4, z);
    this.scene.add(pR);

    // Glowing Neon Bar
    const neonMat = new THREE.MeshBasicMaterial({ color: z % 2 === 0 ? 0x00f0ff : 0xff007f });
    const neonBar = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 0.1), neonMat);
    neonBar.position.set(0, 4.5, z);
    this.scene.add(neonBar);
  }

  buildNeonPillar(x, z, colorHex) {
    const pillarGeo = new THREE.CylinderGeometry(0.25, 0.35, 4.5, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.8 });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(x, 2.25, z);
    this.scene.add(pillar);

    const orbGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(x, 4.6, z);
    this.scene.add(orb);
  }

  createSpeedBoostPad(x, z) {
    const padGroup = new THREE.Group();

    // Base Pad
    const padGeo = new THREE.PlaneGeometry(3.2, 4.0);
    const padMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.y = 0.04;
    padGroup.add(padMesh);

    // 3 Golden Chevrons (Point towards negative Z / Store)
    for (let c = -1; c <= 1; c++) {
      const chevGeo = new THREE.ConeGeometry(0.7, 0.8, 3);
      const chevMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const chev = new THREE.Mesh(chevGeo, chevMat);
      chev.rotation.x = Math.PI / 2;
      chev.rotation.z = 0; // Point towards -Z (Store)
      chev.position.set(0, 0.06, c * 1.1);
      padGroup.add(chev);
    }

    padGroup.position.set(x, 0, z);
    this.scene.add(padGroup);

    this.boostPads.push({
      group: padGroup,
      x: x,
      z: z,
      radius: 2.2,
      active: true
    });
  }

  createCollectible(x, z, type) {
    const group = new THREE.Group();

    if (type === 'comic') {
      // 3D CGC Graded Comic Slab
      const slabGeo = new THREE.BoxGeometry(1.0, 1.5, 0.12);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x00d2ff,
        metalness: 0.6,
        roughness: 0.2,
        emissive: 0x003366
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      group.add(slab);

      // Gold Grade Top Label
      const labelGeo = new THREE.BoxGeometry(0.9, 0.2, 0.14);
      const labelMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.y = 0.65;
      group.add(label);
    } else {
      // 3D Gold Funko Grail Box
      const boxGeo = new THREE.BoxGeometry(1.0, 1.2, 0.8);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.85,
        roughness: 0.15,
        emissive: 0x443300
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      group.add(box);

      // Halo ring around Grail
      const ringGeo = new THREE.TorusGeometry(0.8, 0.04, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    group.position.set(x, 1.2, z);
    this.scene.add(group);

    this.collectibles.push({
      group: group,
      x: x,
      z: z,
      type: type,
      collected: false,
      baseY: 1.2,
      rotSpeed: 2.0 + Math.random() * 1.5
    });
  }

  createObstacle(x, z, type) {
    if (type === 'crate') {
      const geo = new THREE.BoxGeometry(1.6, 1.4, 1.6);
      const mat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });
      const crate = new THREE.Mesh(geo, mat);
      crate.position.set(x, 0.7, z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);

      this.hazards.push({
        mesh: crate,
        x: x,
        z: z,
        radius: 1.3,
        type: 'solid'
      });
    } else if (type === 'barrier') {
      const geo = new THREE.BoxGeometry(3.2, 0.9, 0.5);
      const mat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.5 });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.set(x, 0.45, z);
      bar.castShadow = true;
      bar.receiveShadow = true;
      this.scene.add(bar);

      const stripeGeo = new THREE.BoxGeometry(3.0, 0.3, 0.55);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(x, 0.45, z);
      this.scene.add(stripe);

      this.hazards.push({
        mesh: bar,
        x: x,
        z: z,
        radius: 1.8,
        type: 'solid'
      });
    } else if (type === 'puddle') {
      const geo = new THREE.CylinderGeometry(2.0, 2.0, 0.05, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x7928ca,
        roughness: 0.1,
        metalness: 0.8,
        emissive: 0x240046
      });
      const puddle = new THREE.Mesh(geo, mat);
      puddle.position.set(x, 0.03, z);
      puddle.receiveShadow = true;
      this.scene.add(puddle);

      this.hazards.push({
        mesh: puddle,
        x: x,
        z: z,
        radius: 2.0,
        type: 'tar'
      });
    }
  }

  createEnemy(config) {
    const enemyGroup = new THREE.Group();

    // 3D Scalper Drone Body
    const bodyGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a24,
      metalness: 0.9,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(1.0, 0.6, 1.2);
    enemyGroup.add(body);

    // Glowing Red Eye Visor
    const eyeGeo = new THREE.BoxGeometry(0.8, 0.18, 0.3);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0.05, 0.65);
    enemyGroup.add(eye);

    // 4 Drone Propeller Rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const ringPositions = [
      [-0.8, 0.1, 0.6],
      [0.8, 0.1, 0.6],
      [-0.8, 0.1, -0.6],
      [0.8, 0.1, -0.6]
    ];
    ringPositions.forEach(p => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 16), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(p[0], p[1], p[2]);
      enemyGroup.add(ring);
    });

    // Red Searchlight Down-Cone
    const coneGeo = new THREE.ConeGeometry(1.6, 2.2, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = -1.1;
    enemyGroup.add(cone);

    enemyGroup.position.set(config.x, 1.8, config.z);
    this.scene.add(enemyGroup);

    this.enemies.push({
      group: enemyGroup,
      originX: config.x,
      z: config.z,
      range: config.range,
      speed: config.speed,
      time: Math.random() * 10,
      radius: 1.6,
      hitCooldown: 0
    });
  }

  createAmbientDust() {
    const count = 150;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 35;
      positions[i + 1] = Math.random() * 8 + 0.2;
      positions[i + 2] = Math.random() * 180 - 10;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xd4af37,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  /* ==========================================================================
     3. 3D GLTF MODEL LOADING (Store & Running Boy)
     ========================================================================== */
  loadModels() {
    const loader = new THREE.GLTFLoader();
    let loadedCount = 0;
    const totalModels = 2;

    const updateProgress = () => {
      loadedCount++;
      const pct = Math.round((loadedCount / totalModels) * 100);
      if (this.dom.loaderFill) this.dom.loaderFill.style.width = `${pct}%`;
      if (loadedCount >= totalModels) {
        setTimeout(() => {
          if (this.dom.loader) {
            this.dom.loader.style.opacity = '0';
            setTimeout(() => this.dom.loader.style.display = 'none', 400);
          }
          this.setGameState('menu');
        }, 300);
      }
    };

    // 1. Load Wally's Store Building Model (Positioned at Z = 0)
    loader.load(
      this.options.storeModelPath,
      (gltf) => {
        this.storeMesh = gltf.scene;

        const bbox = new THREE.Box3().setFromObject(this.storeMesh);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        // Scale store to fit grand entrance
        const targetWidth = 10.0;
        const scale = targetWidth / Math.max(size.x, size.z);
        this.storeMesh.scale.set(scale, scale, scale);

        bbox.setFromObject(this.storeMesh);
        this.storeMesh.position.x = -center.x * scale;
        this.storeMesh.position.y = -bbox.min.y;
        this.storeMesh.position.z = -center.z * scale - 2.5; // Behind finish line

        this.storeMesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) child.material.side = THREE.DoubleSide;
          }
        });

        this.scene.add(this.storeMesh);
        updateProgress();
      },
      (xhr) => {
        if (xhr.lengthComputable && this.dom.loaderFill) {
          const pct = Math.round((xhr.loaded / xhr.total) * 50);
          this.dom.loaderFill.style.width = `${pct}%`;
        }
      },
      (err) => {
        console.warn('Store GLTF load note:', err);
        updateProgress();
      }
    );

    // 2. Load Animated Running Wally Boy Model
    loader.load(
      this.options.boyModelPath,
      (gltf) => {
        this.boyMesh = gltf.scene;
        const charScale = 0.85;
        this.boyMesh.scale.set(charScale, charScale, charScale);

        this.boyMesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Setup Skeletal Animation
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.boyMesh);
          this.runAction = this.mixer.clipAction(gltf.animations[0]);
          this.runAction.play();
        }

        // Position player at Start Line facing the store (-Z)
        this.resetPlayerPosition();
        this.scene.add(this.boyMesh);
        updateProgress();
      },
      (xhr) => {
        if (xhr.lengthComputable && this.dom.loaderFill) {
          const pct = 50 + Math.round((xhr.loaded / xhr.total) * 50);
          this.dom.loaderFill.style.width = `${pct}%`;
        }
      },
      (err) => {
        console.warn('Boy GLTF load note:', err);
        updateProgress();
      }
    );
  }

  resetPlayerPosition() {
    const startZ = this.options.trackLength - 10; // 150
    this.player.pos.set(0, 0, startZ);
    this.player.velocity.set(0, 0, 0);
    this.player.vy = 0;
    this.player.isGrounded = true;
    this.player.heading = 0; // 0 = facing forward towards Store (-Z)
    this.player.currentSpeed = 0;
    this.player.boostEnergy = 100;
    this.player.isBoosting = false;
    this.player.isSlowed = false;
    this.player.slowTimer = 0;
    this.player.slowMultiplier = 1.0;
    this.player.score = 0;
    this.player.grailsCollected = 0;
    this.player.boostPadsHit = 0;
    this.player.enemyHits = 0;

    // Reset Collectibles
    this.collectibles.forEach(col => {
      col.collected = false;
      this.scene.add(col.group);
    });

    if (this.boyMesh) {
      this.boyMesh.position.copy(this.player.pos);
      // NOTE: wally_boy_running.glb model natively faces +Z at rotation 0.
      // To make him face forward towards -Z (Store), we add Math.PI (180 deg) so we see his back!
      this.boyMesh.rotation.y = this.player.heading + Math.PI;
      this.boyMesh.rotation.z = 0;
    }

    // Camera behind Wally at start looking forward down the track
    this.currentCamPos.set(0, 3.5, startZ + 5);
    this.currentCamTarget.set(0, 1.2, startZ - 10);
  }

  /* ==========================================================================
     4. USER INPUT & CONTROLS (PC Keyboard + Mobile Touch Joystick)
     ========================================================================== */
  initInputListeners() {
    // Keyboard KeyDown
    window.addEventListener('keydown', (e) => {
      if (this.gameState === 'menu' && (e.code === 'Space' || e.code === 'Enter')) {
        this.startCountdown();
        return;
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'Space') {
        this.triggerJump();
        e.preventDefault();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') {
        this.keys.boost = true;
      }
      if (e.code === 'KeyR') {
        this.startCountdown();
      }
      if (e.code === 'KeyC') {
        this.toggleCameraMode();
      }
    });

    // Keyboard KeyUp
    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') {
        this.keys.boost = false;
      }
    });

    // Mobile Virtual Joystick Touch Handlers
    const joyZone = this.dom.touchJoystick;
    const base = this.dom.joystickBase;
    const knob = this.dom.joystickKnob;

    const handleTouchStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const rect = base.getBoundingClientRect();
        this.joystick.active = true;
        this.joystick.touchId = touch.identifier;
        this.joystick.startX = rect.left + rect.width / 2;
        this.joystick.startY = rect.top + rect.height / 2;
        this.updateJoystickPosition(touch.clientX, touch.clientY);
        break;
      }
    };

    const handleTouchMove = (e) => {
      if (!this.joystick.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystick.touchId) {
          this.updateJoystickPosition(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystick.touchId) {
          this.joystick.active = false;
          this.joystick.touchId = null;
          this.joystick.vectorX = 0;
          this.joystick.vectorY = 0;
          knob.style.transform = 'translate(0px, 0px)';
          break;
        }
      }
    };

    joyZone.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Mobile Action Buttons (Jump & Boost)
    this.dom.touchBtnJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.triggerJump();
    });

    this.dom.touchBtnBoost.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys.boost = true;
      this.dom.touchBtnBoost.classList.add('active');
    });

    this.dom.touchBtnBoost.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.keys.boost = false;
      this.dom.touchBtnBoost.classList.remove('active');
    });
  }

  updateJoystickPosition(clientX, clientY) {
    const maxRadius = 42;
    const dx = clientX - this.joystick.startX;
    const dy = clientY - this.joystick.startY;
    const dist = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;

    if (dist > maxRadius) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }

    this.dom.joystickKnob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

    if (dist < 8) {
      this.joystick.vectorX = 0;
      this.joystick.vectorY = 0;
    } else {
      this.joystick.vectorX = clampedX / maxRadius;
      this.joystick.vectorY = clampedY / maxRadius;
    }
  }

  triggerJump() {
    if (this.player.isGrounded && this.gameState === 'playing') {
      this.player.vy = this.player.jumpForce;
      this.player.isGrounded = false;
      this.audio.playJump();
    }
  }

  /* ==========================================================================
     5. UI EVENTS & BUTTON CLICKS
     ========================================================================== */
  initUIEvents() {
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    this.dom.btnStart.addEventListener('click', () => {
      this.audio.initContext();
      this.startCountdown();
    });

    this.dom.btnFreeRoam.addEventListener('click', () => {
      this.setGameState('orbit');
    });

    this.dom.btnPlayAgain.addEventListener('click', () => {
      this.startCountdown();
    });

    this.dom.btnVictoryOrbit.addEventListener('click', () => {
      this.setGameState('orbit');
    });

    this.dom.btnRestartQuick.addEventListener('click', () => {
      this.startCountdown();
    });

    this.dom.btnSoundToggle.addEventListener('click', () => {
      this.audioEnabled = !this.audioEnabled;
      this.audio.setMuted(!this.audioEnabled);
      this.dom.btnSoundToggle.innerHTML = this.audioEnabled 
        ? '<i class="fa-solid fa-volume-high"></i>' 
        : '<i class="fa-solid fa-volume-xmark"></i>';
      this.showAlert(this.audioEnabled ? '🔊 Sound Unmuted' : '🔇 Sound Muted');
    });

    this.dom.btnCamToggle.addEventListener('click', () => {
      this.toggleCameraMode();
    });

    this.dom.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        this.container.requestFullscreen().catch(err => console.log(err));
      } else {
        document.exitFullscreen().catch(err => console.log(err));
      }
    });

    this.dom.startMenu.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.startMenu.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = btn.getAttribute('data-diff') || 'normal';
      });
    });
  }

  toggleCameraMode() {
    const modes = ['follow', 'close', 'top', 'orbit'];
    const idx = modes.indexOf(this.cameraMode);
    this.cameraMode = modes[(idx + 1) % modes.length];

    if (this.cameraMode === 'orbit') {
      this.orbitControls.enabled = true;
      this.orbitControls.target.copy(this.player.pos);
      this.showAlert('📷 Orbit Camera (Drag to look)');
    } else {
      this.orbitControls.enabled = false;
      if (this.cameraMode === 'follow') this.showAlert('📷 3rd Person Dynamic');
      if (this.cameraMode === 'close') this.showAlert('📷 Action Close Cam');
      if (this.cameraMode === 'top') this.showAlert('📷 Birds-Eye Radar');
    }
  }

  /* ==========================================================================
     6. GAME LOOP & STATE MACHINE
     ========================================================================== */
  setGameState(state) {
    this.gameState = state;

    if (state === 'menu') {
      this.dom.startMenu.style.display = 'flex';
      this.dom.victoryMenu.style.display = 'none';
      this.dom.countdownOverlay.style.display = 'none';
      this.orbitControls.enabled = true;
      this.orbitControls.target.set(0, 1.5, 0);
      this.camera.position.set(0, 4, 12);
    } else if (state === 'countdown') {
      this.dom.startMenu.style.display = 'none';
      this.dom.victoryMenu.style.display = 'none';
      this.dom.countdownOverlay.style.display = 'flex';
      this.orbitControls.enabled = false;
      this.resetPlayerPosition();
    } else if (state === 'playing') {
      this.dom.startMenu.style.display = 'none';
      this.dom.victoryMenu.style.display = 'none';
      this.dom.countdownOverlay.style.display = 'none';
      this.orbitControls.enabled = false;
      this.startTime = performance.now();
      this.penaltyTime = 0;
      this.elapsedTime = 0;
    } else if (state === 'victory') {
      this.dom.victoryMenu.style.display = 'flex';
      this.orbitControls.enabled = true;
      this.orbitControls.target.set(0, 1.5, 0);
      this.triggerVictoryCelebration();
    } else if (state === 'orbit') {
      this.dom.startMenu.style.display = 'none';
      this.dom.victoryMenu.style.display = 'none';
      this.dom.countdownOverlay.style.display = 'none';
      this.cameraMode = 'orbit';
      this.orbitControls.enabled = true;
      this.orbitControls.target.set(0, 1.5, 0);
      this.showAlert('👁️ Free Roam / Orbit Mode Active');
    }
  }

  startCountdown() {
    this.setGameState('countdown');
    let count = 3;
    this.dom.countdownNum.textContent = count;
    this.dom.countdownNum.className = 'countdown-number pulse-anim';
    this.audio.playBeep(440, 0.15, 'square');

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        this.dom.countdownNum.textContent = count;
        this.dom.countdownNum.className = 'countdown-number pulse-anim';
        this.audio.playBeep(440, 0.15, 'square');
      } else if (count === 0) {
        this.dom.countdownNum.textContent = 'SPRINT!';
        this.dom.countdownNum.className = 'countdown-number sprint-anim';
        this.audio.playBeep(880, 0.35, 'square');
      } else {
        clearInterval(interval);
        this.setGameState('playing');
      }
    }, 900);
  }

  /* ==========================================================================
     7. PHYSICS & CHARACTER CONTROLLER (Forward = Decreasing Z towards Store)
     ========================================================================== */
  updatePlayerPhysics(delta) {
    if (!this.boyMesh) return;

    let inputFwd = 0;
    let inputTurn = 0;

    // PC Keyboard
    if (this.keys.forward) inputFwd += 1;
    if (this.keys.backward) inputFwd -= 0.5;
    if (this.keys.left) inputTurn += 1;
    if (this.keys.right) inputTurn -= 1;

    // Mobile Joystick
    if (this.joystick.active) {
      inputFwd = -this.joystick.vectorY; // Up is negative Y on screen
      inputTurn = -this.joystick.vectorX; // Left/Right steering
    }

    // Auto-run forward drive during speedrun race
    if (this.gameState === 'playing' && inputFwd === 0 && !this.joystick.active) {
      inputFwd = 0.95; // Natural sprint drive
    }

    // Nitro Boost
    const wantsBoost = (this.keys.boost) && this.player.boostEnergy > 5;
    if (wantsBoost) {
      this.player.isBoosting = true;
      this.player.boostEnergy = Math.max(0, this.player.boostEnergy - delta * 35);
      this.targetFov = 58;
    } else {
      this.player.isBoosting = false;
      this.player.boostEnergy = Math.min(100, this.player.boostEnergy + delta * 15);
      this.targetFov = 45;
    }

    // Slow Debuff Recovery
    if (this.player.isSlowed) {
      this.player.slowTimer -= delta;
      if (this.player.slowTimer <= 0) {
        this.player.isSlowed = false;
        this.player.slowMultiplier = 1.0;
      }
    }

    // Target Speed calculation
    const targetSpeed = this.player.baseSpeed * 
      (this.player.isBoosting ? this.player.boostSpeedMultiplier : 1.0) * 
      this.player.slowMultiplier * inputFwd;

    this.player.currentSpeed = THREE.MathUtils.lerp(this.player.currentSpeed, targetSpeed, delta * 10);

    // Steering Rotation (0 = facing -Z towards store)
    const turnRate = 2.8;
    this.player.heading += inputTurn * turnRate * delta;

    // Forward velocity: when heading = 0, vx = 0 and vz = -currentSpeed (moving towards Store at Z=0)
    const vx = -Math.sin(this.player.heading) * this.player.currentSpeed;
    const vz = -Math.cos(this.player.heading) * this.player.currentSpeed;

    this.player.pos.x += vx * delta;
    this.player.pos.z += vz * delta;

    // Clamp track X boundaries
    const maxX = (this.options.trackWidth / 2) - 0.8;
    this.player.pos.x = THREE.MathUtils.clamp(this.player.pos.x, -maxX, maxX);

    // Vertical Jump Physics & Gravity
    if (!this.player.isGrounded) {
      this.player.vy += this.player.gravity * delta;
      this.player.pos.y += this.player.vy * delta;

      if (this.player.pos.y <= 0) {
        this.player.pos.y = 0;
        this.player.vy = 0;
        this.player.isGrounded = true;
      }
    }

    // Sync 3D Mesh
    this.boyMesh.position.copy(this.player.pos);
    // Face forward towards Store (-Z): heading + Math.PI
    this.boyMesh.rotation.y = this.player.heading + Math.PI;
    this.boyMesh.rotation.z = THREE.MathUtils.lerp(this.boyMesh.rotation.z, -inputTurn * 0.15, delta * 8);

    // Sync Skeletal Animation Playback Speed
    if (this.runAction) {
      const animSpeed = Math.max(0.1, Math.abs(this.player.currentSpeed) / 10);
      this.runAction.timeScale = this.player.isGrounded ? animSpeed : 0.4;
    }

    // Check Finish Line (Z <= 2.5 reached the Store!)
    if (this.gameState === 'playing' && this.player.pos.z <= 2.5) {
      this.handleStoreReached();
    }
  }

  /* ==========================================================================
     8. COLLISIONS (Enemies, Boost Pads, Collectibles, Hazards)
     ========================================================================== */
  checkCollisions(delta) {
    if (this.gameState !== 'playing') return;

    const pPos = this.player.pos;

    // 1. Scalper Drone Patrols & Collisions
    const speedScale = this.difficulty === 'hard' ? 1.5 : 1.0;
    this.enemies.forEach(e => {
      e.time += delta * e.speed * speedScale;
      const newX = e.originX + Math.sin(e.time) * e.range;
      e.group.position.x = newX;
      e.group.position.y = 1.8 + Math.sin(e.time * 2) * 0.35;

      if (e.hitCooldown > 0) e.hitCooldown -= delta;

      const dist = Math.hypot(pPos.x - newX, pPos.z - e.z);
      if (dist < (e.radius + 0.6) && pPos.y < 1.4 && e.hitCooldown <= 0) {
        e.hitCooldown = 2.5;
        this.triggerEnemyHit();
      }
    });

    // 2. Speed Boost Pads
    this.boostPads.forEach(pad => {
      const dist = Math.hypot(pPos.x - pad.x, pPos.z - pad.z);
      if (dist < pad.radius && pad.active) {
        this.triggerBoostPad();
      }
    });

    // 3. Collectibles (Comics & Funko Grails)
    this.collectibles.forEach(col => {
      if (col.collected) return;

      col.group.rotation.y += delta * col.rotSpeed;
      col.group.position.y = col.baseY + Math.sin(performance.now() * 0.004) * 0.18;

      const dist = Math.hypot(pPos.x - col.x, pPos.z - col.z);
      if (dist < 1.4 && Math.abs(pPos.y - col.group.position.y) < 1.8) {
        col.collected = true;
        this.scene.remove(col.group);
        this.triggerCollectiblePickup(col.type);
      }
    });

    // 4. Hazards (Puddles & Solid Crates)
    this.hazards.forEach(h => {
      const dist = Math.hypot(pPos.x - h.x, pPos.z - h.z);
      if (dist < h.radius) {
        if (h.type === 'tar' && this.player.isGrounded) {
          this.player.slowMultiplier = 0.55;
          this.player.isSlowed = true;
          this.player.slowTimer = 0.5;
        } else if (h.type === 'solid' && pPos.y < 0.8) {
          this.player.currentSpeed *= 0.4;
          this.triggerScreenShake(0.2);
        }
      }
    });
  }

  triggerEnemyHit() {
    this.player.enemyHits++;
    this.player.isSlowed = true;
    this.player.slowTimer = 2.2;
    this.player.slowMultiplier = 0.45;
    this.penaltyTime += 2.0;

    this.audio.playEnemyHit();
    this.triggerScreenShake(0.45);
    this.showAlert('⚠️ SCALPER HIT! SLOWED DOWN (+2s Penalty)', 'red');
  }

  triggerBoostPad() {
    this.player.boostPadsHit++;
    this.player.currentSpeed = this.player.baseSpeed * 2.2;
    this.player.boostEnergy = Math.min(100, this.player.boostEnergy + 40);
    this.targetFov = 64;

    this.audio.playBoostPad();
    this.triggerScreenShake(0.18);
    this.showAlert('⚡ HYPER SPEED BOOST PAD! ⚡', 'cyan');
  }

  triggerCollectiblePickup(type) {
    this.player.grailsCollected++;
    const pts = type === 'funko' ? 500 : 250;
    this.player.score += pts;
    this.player.boostEnergy = Math.min(100, this.player.boostEnergy + 30);

    this.audio.playPickup();
    this.showAlert(type === 'funko' ? '🏆 VAULTED FUNKO GRAIL! (+500 PTS)' : '💎 CGC 9.8 SLAB! (+250 PTS)', 'gold');
  }

  triggerScreenShake(amount) {
    this.shakeIntensity = Math.min(0.6, this.shakeIntensity + amount);
  }

  showAlert(text, type = 'gold') {
    if (!this.dom.alertBanner) return;
    this.dom.alertBanner.textContent = text;
    this.dom.alertBanner.className = `alert-banner active alert-${type}`;
    clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      this.dom.alertBanner.className = 'alert-banner';
    }, 1800);
  }

  /* ==========================================================================
     9. 3RD PERSON DYNAMIC CAMERA CONTROLLER
     ========================================================================== */
  updateCamera(delta) {
    if (this.cameraMode === 'orbit') {
      if (this.orbitControls) this.orbitControls.update();
      return;
    }

    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, delta * 6);
    this.camera.updateProjectionMatrix();

    const p = this.player.pos;
    const h = this.player.heading;

    let targetCamPos = new THREE.Vector3();
    let targetLook = new THREE.Vector3(
      p.x - Math.sin(h) * 6.0,
      p.y + 1.2,
      p.z - Math.cos(h) * 6.0
    );

    if (this.cameraMode === 'follow') {
      // Positioned behind Wally at +Z when h = 0
      const dist = 4.8;
      const height = 2.4;
      targetCamPos.set(
        p.x + Math.sin(h) * dist,
        p.y + height,
        p.z + Math.cos(h) * dist
      );
    } else if (this.cameraMode === 'close') {
      const dist = 3.0;
      const height = 1.8;
      targetCamPos.set(
        p.x + Math.sin(h) * dist + 0.6,
        p.y + height,
        p.z + Math.cos(h) * dist
      );
    } else if (this.cameraMode === 'top') {
      targetCamPos.set(p.x, p.y + 18, p.z + 4);
      targetLook.set(p.x, p.y, p.z - 8);
    }

    // Screen Shake Offset
    if (this.shakeIntensity > 0) {
      targetCamPos.x += (Math.random() - 0.5) * this.shakeIntensity;
      targetCamPos.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 1.5);
    }

    // Smooth Lerp Camera
    const lerpSpeed = delta * 10;
    this.currentCamPos.lerp(targetCamPos, lerpSpeed);
    this.currentCamTarget.lerp(targetLook, lerpSpeed);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentCamTarget);
  }

  /* ==========================================================================
     10. HUD UPDATES, TIMER & VICTORY
     ========================================================================== */
  updateHUD() {
    if (this.gameState === 'playing') {
      this.elapsedTime = (performance.now() - this.startTime) / 1000;
      const totalDisplay = this.elapsedTime + this.penaltyTime;
      this.dom.timer.textContent = this.formatTime(totalDisplay);

      // Distance to Store (Store at Z=0, finish at Z=2.5)
      const dist = Math.max(0, Math.round(this.player.pos.z - 2.5));
      this.dom.distText.textContent = `${dist}m`;
      const startDist = this.options.trackLength - 10;
      const progressPct = Math.max(0, Math.min(100, ((startDist - dist) / startDist) * 100));
      this.dom.progressFill.style.width = `${progressPct}%`;
      this.dom.runnerIcon.style.left = `${progressPct}%`;

      // Speedometer
      const mph = Math.round(Math.abs(this.player.currentSpeed) * 2.6);
      this.dom.speedVal.textContent = mph;

      // Nitro Bar
      this.dom.nitroFill.style.width = `${Math.round(this.player.boostEnergy)}%`;
      this.dom.nitroPct.textContent = `${Math.round(this.player.boostEnergy)}%`;

      // Score
      this.dom.scoreVal.textContent = `${this.player.score} PTS`;
      this.dom.grailCount.textContent = `(${this.player.grailsCollected}/${this.player.totalGrails})`;
    }
  }

  handleStoreReached() {
    this.setGameState('victory');
    const finalOfficial = this.elapsedTime + this.penaltyTime;

    this.dom.vTrackTime.textContent = this.formatTime(this.elapsedTime);
    this.dom.vPenalties.textContent = `+${this.penaltyTime.toFixed(2)}s (${this.player.enemyHits} hits)`;
    this.dom.vFinalTime.textContent = this.formatTime(finalOfficial);
    this.dom.vScore.textContent = `${this.player.score} PTS (${this.player.grailsCollected}/${this.player.totalGrails} Grails)`;

    let rank = '🥈 C-TIER COLLECTOR';
    let rankColor = '#a0aec0';
    if (finalOfficial < 16.5) {
      rank = '⚡ S-TIER GRAIL MASTER';
      rankColor = '#ffd700';
    } else if (finalOfficial < 22.0) {
      rank = '🏆 A-TIER TOP CURATOR';
      rankColor = '#00f0ff';
    } else if (finalOfficial < 28.0) {
      rank = '🥇 B-TIER VINTAGE HUNTER';
      rankColor = '#10b981';
    }

    this.dom.vRank.textContent = rank;
    this.dom.vRank.style.borderColor = rankColor;
    this.dom.vRank.style.color = rankColor;

    if (this.bestTime === 0 || finalOfficial < this.bestTime) {
      this.bestTime = finalOfficial;
      localStorage.setItem('wally_speedrun_best', finalOfficial.toString());
      this.dom.vRecordBanner.style.display = 'block';
      this.dom.startBestTime.textContent = `BEST: ${this.formatTime(this.bestTime)}`;
    } else {
      this.dom.vRecordBanner.style.display = 'none';
    }

    this.audio.playVictory();
  }

  triggerVictoryCelebration() {
    const colors = [0xd4af37, 0x00f0ff, 0xff007f, 0x10b981, 0xffffff];
    for (let i = 0; i < 60; i++) {
      const geo = new THREE.PlaneGeometry(0.15, 0.15);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide
      });
      const c = new THREE.Mesh(geo, mat);
      c.position.set((Math.random() - 0.5) * 10, Math.random() * 5 + 1, (Math.random() - 0.5) * 6);
      c.userData = {
        vy: Math.random() * 3 + 2,
        vx: (Math.random() - 0.5) * 4,
        vz: (Math.random() - 0.5) * 4,
        rotSpeed: (Math.random() - 0.5) * 8
      };
      this.scene.add(c);
      this.finishConfetti.push(c);
    }
  }

  formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  /* ==========================================================================
     11. ANIMATION FRAME RENDER
     ========================================================================== */
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(0.1, this.clock.getDelta());

    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.gameState === 'playing') {
      this.updatePlayerPhysics(delta);
      this.checkCollisions(delta);
    }

    this.updateCamera(delta);
    this.updateHUD();

    if (this.particles) {
      this.particles.rotation.y += delta * 0.02;
    }

    if (this.finishConfetti.length > 0) {
      this.finishConfetti.forEach(c => {
        c.position.y += c.userData.vy * delta;
        c.position.x += c.userData.vx * delta;
        c.position.z += c.userData.vz * delta;
        c.rotation.x += c.userData.rotSpeed * delta;
        c.userData.vy -= 4.0 * delta;
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}

/* ==========================================================================
   WALLY PROCEDURAL WEB AUDIO ENGINE (Zero External Sound Files Needed)
   ========================================================================== */
class WallyAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  playBeep(freq = 440, duration = 0.15, type = 'sine') {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playJump() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {}
  }

  playBoostPad() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {}
  }

  playPickup() {
    if (this.isMuted || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.05);
        osc.stop(this.ctx.currentTime + idx * 0.05 + 0.2);
      });
    } catch (e) {}
  }

  playEnemyHit() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playVictory() {
    if (this.isMuted || !this.ctx) return;
    try {
      const fanfare = [
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.15 },
        { f: 1046.50, d: 0.45 }
      ];
      let t = this.ctx.currentTime;
      fanfare.forEach(item => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + item.d);
        t += item.d + 0.02;
      });
    } catch (e) {}
  }
}

// Global Export
window.WallyWorld3D = WallyWorld3D;
