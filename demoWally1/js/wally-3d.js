/**
 * IT'S WALLY'S WORLD - THREE.JS 3D RUNNING WALLY WORLD EXPERIENCE
 * Loads the 3D Store Building and 3D Animated Wally Boy running around the store.
 */

class WallyWorld3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      storeModelPath: 'assets/models/wally_store.glb',
      boyModelPath: 'assets/models/wally_boy_running.glb',
      orbitRadiusX: 4.8,
      orbitRadiusZ: 3.8,
      runSpeed: 1.2,
      cameraMode: 'orbit', // 'orbit', 'follow', 'front', 'top'
      theme: 'neon' // 'neon', 'luxe'
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    this.storeMesh = null;
    this.boyMesh = null;
    this.mixer = null;
    this.runAction = null;
    this.boyAngle = 0;
    this.runSpeedMultiplier = 1.0;
    this.isPaused = false;

    this.particles = null;
    this.loadingOverlay = null;

    this.init();
  }

  init() {
    this.createDOMOverlay();
    this.initThree();
    this.initLights();
    this.initEnvironment();
    this.loadModels();
    this.initEvents();
    this.animate();
  }

  createDOMOverlay() {
    // Create HUD & Controls Overlay inside container
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';

    const hud = document.createElement('div');
    hud.className = 'wally-3d-hud';
    hud.innerHTML = `
      <div class="hud-top-bar">
        <div class="hud-badge">
          <span class="hud-live-dot"></span> 3D RUNNING WALLY SIMULATION
        </div>
        <div class="hud-view-selectors">
          <button class="hud-btn active" data-view="orbit" title="Free Orbit View"><i class="fa-solid fa-arrows-spin"></i> Orbit</button>
          <button class="hud-btn" data-view="follow" title="Follow Wally Boy"><i class="fa-solid fa-person-running"></i> Follow Wally</button>
          <button class="hud-btn" data-view="front" title="Storefront View"><i class="fa-solid fa-store"></i> Front</button>
          <button class="hud-btn" data-view="top" title="Top View"><i class="fa-solid fa-street-view"></i> Top</button>
        </div>
      </div>

      <div class="hud-loading-screen" id="wally3dLoader">
        <div class="loader-spinner"></div>
        <div class="loader-text">INITIALIZING 3D NOSTALGIA ENGINE...</div>
        <div class="loader-sub">Loading Wally's Store & Animated Running Boy</div>
        <div class="loader-progress-bar"><div class="loader-progress-fill" id="wally3dFill"></div></div>
      </div>

      <div class="hud-bottom-bar">
        <div class="hud-controls-group">
          <button class="hud-ctrl-btn" id="wally3dPlayPause" title="Play/Pause"><i class="fa-solid fa-pause"></i></button>
          <div class="hud-speed-control">
            <span>SPEED:</span>
            <button class="speed-btn active" data-speed="1.0">1x</button>
            <button class="speed-btn" data-speed="1.8">Turbo</button>
            <button class="speed-btn" data-speed="3.0">Hyper</button>
          </div>
          <button class="hud-ctrl-btn" id="wally3dResetCam" title="Reset Camera"><i class="fa-solid fa-camera-rotate"></i></button>
        </div>
        <div class="hud-hint">
          <i class="fa-solid fa-hand-pointer"></i> Drag to rotate • Scroll to zoom
        </div>
      </div>
    `;

    this.container.appendChild(hud);
    this.loadingOverlay = hud.querySelector('#wally3dLoader');
    this.progressFill = hud.querySelector('#wally3dFill');
  }

  initThree() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 550;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.theme === 'luxe' ? 0x08080a : 0x0c0a17);
    this.scene.fog = new THREE.FogExp2(this.options.theme === 'luxe' ? 0x08080a : 0x0c0a17, 0.035);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 4.5, 9.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 22;
    this.controls.target.set(0, 1.2, 0);
  }

  initLights() {
    // Ambient Light
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    // Main Sun / Key Light
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    this.scene.add(dirLight);

    // Rim light from behind
    const rimLight = new THREE.DirectionalLight(0x7928ca, 1.8);
    rimLight.position.set(-6, 6, -6);
    this.scene.add(rimLight);

    // Neon Accent Lights
    const neonCyan = new THREE.PointLight(0x00f0ff, 3.5, 12);
    neonCyan.position.set(0, 3.2, 2.5);
    this.scene.add(neonCyan);

    const neonPink = new THREE.PointLight(0xff007f, 3.0, 10);
    neonPink.position.set(-2.5, 2.0, 1.8);
    this.scene.add(neonPink);

    const neonGold = new THREE.PointLight(0xffe600, 2.5, 10);
    neonGold.position.set(2.5, 2.0, 1.8);
    this.scene.add(neonGold);
  }

  initEnvironment() {
    // Cyber / Reflective Ground Platform
    const groundGeo = new THREE.CylinderGeometry(8.5, 8.5, 0.3, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: this.options.theme === 'luxe' ? 0x111116 : 0x141026,
      roughness: 0.25,
      metalness: 0.6,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Neon Glowing Edge Rings
    const ringGeo = new THREE.TorusGeometry(8.55, 0.08, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.options.theme === 'luxe' ? 0xd4af37 : 0x00f0ff
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    this.scene.add(ring);

    const innerRingGeo = new THREE.TorusGeometry(5.6, 0.03, 16, 100);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: this.options.theme === 'luxe' ? 0x997a15 : 0xff007f,
      transparent: true,
      opacity: 0.6
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.02;
    this.scene.add(innerRing);

    // Grid Helper
    const grid = new THREE.GridHelper(17, 34, this.options.theme === 'luxe' ? 0xd4af37 : 0x9d4edd, 0x333344);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // Ambient floating particles
    this.initParticles();
  }

  initParticles() {
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 16;
      positions[i + 1] = Math.random() * 6 + 0.2;
      positions[i + 2] = (Math.random() - 0.5) * 16;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.08,
      color: this.options.theme === 'luxe' ? 0xf5e298 : 0x00f0ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  loadModels() {
    const loader = new THREE.GLTFLoader();
    let loadedCount = 0;
    const totalModels = 2;

    const updateProgress = () => {
      loadedCount++;
      const pct = Math.round((loadedCount / totalModels) * 100);
      if (this.progressFill) this.progressFill.style.width = `${pct}%`;
      if (loadedCount >= totalModels) {
        setTimeout(() => {
          if (this.loadingOverlay) {
            this.loadingOverlay.style.opacity = '0';
            setTimeout(() => this.loadingOverlay.style.display = 'none', 500);
          }
        }, 300);
      }
    };

    // 1. Load Wally's World Building Storefront
    loader.load(
      this.options.storeModelPath,
      (gltf) => {
        this.storeMesh = gltf.scene;

        // Auto-center & compute bounding box
        const bbox = new THREE.Box3().setFromObject(this.storeMesh);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        // Normalize scale to fit nicely in scene (~4.2 units wide)
        const targetWidth = 4.2;
        const scale = targetWidth / Math.max(size.x, size.z);
        this.storeMesh.scale.set(scale, scale, scale);

        // Recompute bbox after scale
        bbox.setFromObject(this.storeMesh);
        this.storeMesh.position.x = -center.x * scale;
        this.storeMesh.position.y = -bbox.min.y; // sit exactly on floor
        this.storeMesh.position.z = -center.z * scale;

        this.storeMesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
            }
          }
        });

        this.scene.add(this.storeMesh);
        updateProgress();
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const pct = Math.round((xhr.loaded / xhr.total) * 50);
          if (this.progressFill) this.progressFill.style.width = `${pct}%`;
        }
      },
      (error) => {
        console.error('Error loading store model:', error);
        updateProgress();
      }
    );

    // 2. Load Animated Running Wally Boy
    loader.load(
      this.options.boyModelPath,
      (gltf) => {
        this.boyMesh = gltf.scene;

        // Scale character
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

        this.scene.add(this.boyMesh);
        updateProgress();
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const pct = 50 + Math.round((xhr.loaded / xhr.total) * 50);
          if (this.progressFill) this.progressFill.style.width = `${pct}%`;
        }
      },
      (error) => {
        console.error('Error loading animated Wally boy model:', error);
        updateProgress();
      }
    );
  }

  updateWallyBoyPosition(delta) {
    if (!this.boyMesh || this.isPaused) return;

    // Advance angle around store perimeter
    const speed = this.options.runSpeed * this.runSpeedMultiplier;
    this.boyAngle += delta * speed;

    // Rounded rectangular / elliptical orbit around building
    const rx = this.options.orbitRadiusX;
    const rz = this.options.orbitRadiusZ;

    const x = Math.cos(this.boyAngle) * rx;
    const z = Math.sin(this.boyAngle) * rz;

    this.boyMesh.position.set(x, 0, z);

    // Calculate forward tangent velocity vector for natural running orientation
    const tangentX = -Math.sin(this.boyAngle) * rx;
    const tangentZ = Math.cos(this.boyAngle) * rz;

    const targetHeading = Math.atan2(tangentX, tangentZ);
    this.boyMesh.rotation.y = targetHeading;

    // Handle Follow Camera Mode
    if (this.options.cameraMode === 'follow') {
      const camDist = 3.8;
      const camHeight = 2.2;
      const camX = x - Math.sin(targetHeading) * camDist;
      const camZ = z - Math.cos(targetHeading) * camDist;

      this.camera.position.lerp(new THREE.Vector3(camX, camHeight, camZ), 0.08);
      this.controls.target.lerp(new THREE.Vector3(x, 1.0, z), 0.1);
    }
  }

  initEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    // View Selector Buttons
    this.container.querySelectorAll('.hud-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.hud-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view');
        this.setCameraView(view);
      });
    });

    // Play/Pause
    const playPauseBtn = this.container.querySelector('#wally3dPlayPause');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        this.isPaused = !this.isPaused;
        if (this.runAction) {
          this.runAction.paused = this.isPaused;
        }
        playPauseBtn.innerHTML = this.isPaused 
          ? '<i class="fa-solid fa-play"></i>' 
          : '<i class="fa-solid fa-pause"></i>';
      });
    }

    // Speed Buttons
    this.container.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const spd = parseFloat(btn.getAttribute('data-speed')) || 1.0;
        this.runSpeedMultiplier = spd;
        if (this.runAction) {
          this.runAction.timeScale = spd;
        }
      });
    });

    // Reset Camera
    const resetBtn = this.container.querySelector('#wally3dResetCam');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.setCameraView('orbit');
      });
    }
  }

  setCameraView(view) {
    this.options.cameraMode = view;

    if (view === 'orbit') {
      this.camera.position.set(0, 4.5, 9.5);
      this.controls.target.set(0, 1.2, 0);
    } else if (view === 'front') {
      this.camera.position.set(0, 2.2, 7.8);
      this.controls.target.set(0, 1.8, 0);
    } else if (view === 'top') {
      this.camera.position.set(0, 13.5, 0.1);
      this.controls.target.set(0, 0, 0);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Update skeletal running animation
    if (this.mixer && !this.isPaused) {
      this.mixer.update(delta);
    }

    // Update Wally Boy running orbit path
    this.updateWallyBoyPosition(delta);

    // Subtle floating particle motion
    if (this.particles) {
      this.particles.rotation.y += delta * 0.04;
    }

    // OrbitControls update
    if (this.controls && this.options.cameraMode !== 'follow') {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Global initialization helper
window.WallyWorld3D = WallyWorld3D;
