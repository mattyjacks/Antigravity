/**
 * Three.js High-Detail 3D Anime Waifu Rendering & Animation Engine
 * Features:
 * - High-poly geometry (>20,000 vertices total)
 * - Authentic texture integration (face.jpg, eyes.jpg, hair.jpg, outfit.jpg)
 * - Dynamic facial rigging & animation (blinking, eye darting/tracking, speech lip-sync)
 * - Animated Ahoge hair bounce, idle breathing, floating cyber halo, and particle physics
 * - Non-destructive emotion-based material lighting & blush controls
 */

export class Waifu3DEngine {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animFrameId = null;

    // 3D Model Hierarchy Groups
    this.waifuGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.hairGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();

    // Body Part Meshes & Materials
    this.faceMesh = null;
    this.faceMaterial = null;
    this.faceOverlayMesh = null;
    this.faceOverlayMaterial = null;
    
    this.eyeLeftMesh = null;
    this.eyeRightMesh = null;
    this.eyeMaterial = null;
    this.eyelidLeft = null;
    this.eyelidRight = null;
    this.eyebrowLeft = null;
    this.eyebrowRight = null;

    this.mouthMesh = null;
    this.mouthMaterial = null;
    this.blushLeft = null;
    this.blushRight = null;
    this.blushMaterial = null;

    this.hairMaterial = null;
    this.ahogeMesh = null;
    this.outfitMesh = null;
    this.outfitMaterial = null;
    this.haloRing = null;
    this.bgTexturePlane = null;
    this.particlesGroup = new THREE.Group();

    // Lighting
    this.ambientLight = null;
    this.dirLight = null;
    this.rimLight = null;
    this.facePointLight = null;

    // Animation & State Tracking
    this.isSpeaking = false;
    this.currentEmotion = 'Neutral 😊';
    this.time = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;
    
    this.eyeTargetX = 0;
    this.eyeTargetY = 0;
    this.eyeCurrentX = 0;
    this.eyeCurrentY = 0;
    this.nextEyeLookTime = 0;

    this.resizeObserver = null;
    this.onWindowResize = this.handleResize.bind(this);

    this.initialized = false;
  }

  init(containerElem) {
    if (!containerElem || typeof THREE === 'undefined') return false;
    this.container = containerElem;
    this.container.innerHTML = '';

    const width = containerElem.clientWidth || 340;
    const height = containerElem.clientHeight || 300;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    this.camera.position.set(0, 0.15, 6.2);

    // WebGL Renderer with High-Quality Shadows & Antialiasing
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Auto-responsive resize observer
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }
    window.addEventListener('resize', this.onWindowResize);

    // Studio Lighting for Anime Aesthetic
    this.ambientLight = new THREE.AmbientLight(0xfff0f5, 0.95);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xff66bb, 1.25);
    this.dirLight.position.set(3, 4, 5);
    this.scene.add(this.dirLight);

    this.rimLight = new THREE.PointLight(0x00f0ff, 2.5, 12);
    this.rimLight.position.set(-3.5, 2.5, -2);
    this.scene.add(this.rimLight);

    this.facePointLight = new THREE.PointLight(0xffe6f2, 0.8, 5);
    this.facePointLight.position.set(0, 0.5, 3);
    this.scene.add(this.facePointLight);

    // Construct High-Poly 3D Waifu
    this.buildWaifuModel();

    // Construct Ambient Floating Particles
    this.buildParticles();

    this.initialized = true;
    this.startAnimationLoop();

    return true;
  }

  // Generate High-Quality Canvas Fallback Textures (Used if image loading is delayed)
  generateFallbackFaceTexture(blushColor = '#ff66aa') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const skinGrad = ctx.createLinearGradient(0, 0, 0, 512);
    skinGrad.addColorStop(0, '#fff6f2');
    skinGrad.addColorStop(0.6, '#ffece4');
    skinGrad.addColorStop(1, '#ffd6c9');
    ctx.fillStyle = skinGrad;
    ctx.fillRect(0, 0, 512, 512);

    return new THREE.CanvasTexture(canvas);
  }

  generateFallbackEyeTexture(irisColor = '#00f0ff') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 200);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.3, irisColor);
    grad.addColorStop(0.8, '#ff00aa');
    grad.addColorStop(1, '#050714');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(256, 256, 200, 0, Math.PI * 2);
    ctx.fill();

    // Catchlight Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(200, 180, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(310, 310, 22, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  generateFallbackHairTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ff007f';
    ctx.fillRect(0, 0, 512, 512);

    // Specular Highlight Band
    const ringGrad = ctx.createLinearGradient(0, 180, 0, 240);
    ringGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    ringGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
    ringGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = ringGrad;
    ctx.fillRect(0, 180, 512, 60);

    return new THREE.CanvasTexture(canvas);
  }

  generateFallbackOutfitTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f1423';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 100); ctx.lineTo(512, 100);
    ctx.moveTo(256, 100); ctx.lineTo(256, 512);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  // Key out white background of face.jpg to create a seamless transparent anime face overlay
  createAlphaMaskedFaceTexture(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width || 512;
    canvas.height = image.height || 512;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxR = canvas.width * 0.44;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const px = (i / 4) % canvas.width;
      const py = Math.floor((i / 4) / canvas.width);
      const dist = Math.hypot(px - cx, py - cy);

      // If near pure white or outside face radial boundary, make transparent
      if ((r > 235 && g > 235 && b > 235) || dist > maxR) {
        if (dist > maxR) {
          const alphaFade = Math.max(0, 1 - (dist - maxR) / 25);
          data[i + 3] = Math.floor(data[i + 3] * alphaFade);
        } else {
          data[i + 3] = 0;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Construct High-Poly Realistic Anime Waifu Mesh
  buildWaifuModel() {
    this.waifuGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.hairGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();

    const textureLoader = new THREE.TextureLoader();

    // -------------------------------------------------------------------------
    // 1. SCULPTED HIGH-POLY HEAD BASE & CURVED FACE OVERLAY
    // -------------------------------------------------------------------------
    const headGeo = new THREE.SphereGeometry(1.15, 64, 64);
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i);
      let x = pos.getX(i);
      let z = pos.getZ(i);

      if (y < 0) {
        let factor = 1 + y * 0.28;
        pos.setX(i, x * factor);
        pos.setZ(i, z * Math.max(0.65, factor));
      }
      if (y > -0.4 && y < 0.2 && z > 0) {
        pos.setZ(i, z * 1.05);
      }
    }
    headGeo.computeVertexNormals();

    const defaultFaceTex = this.generateFallbackFaceTexture();
    this.faceMaterial = new THREE.MeshPhongMaterial({
      map: defaultFaceTex,
      shininess: 25,
      specular: 0x444444
    });

    this.faceMesh = new THREE.Mesh(headGeo, this.faceMaterial);
    this.headGroup.add(this.faceMesh);

    // Front Face Overlay Mesh (Curved Sphere Shell fitting head contour)
    const faceOverlayGeo = new THREE.SphereGeometry(
      1.154, 32, 32,
      -Math.PI * 0.35, Math.PI * 0.7,
      Math.PI * 0.18, Math.PI * 0.65
    );

    this.faceOverlayMaterial = new THREE.MeshBasicMaterial({
      map: defaultFaceTex,
      transparent: true,
      opacity: 0.99,
      side: THREE.DoubleSide
    });

    textureLoader.load('assets/waifu_textures/face.jpg', (imageElem) => {
      // Process image with alpha keying to remove white square background
      const maskedTex = this.createAlphaMaskedFaceTexture(imageElem.image || imageElem);
      this.faceOverlayMaterial.map = maskedTex;
      this.faceOverlayMaterial.needsUpdate = true;
      this.faceMaterial.map = maskedTex;
      this.faceMaterial.needsUpdate = true;
    });

    this.faceOverlayMesh = new THREE.Mesh(faceOverlayGeo, this.faceOverlayMaterial);
    this.headGroup.add(this.faceOverlayMesh);

    // -------------------------------------------------------------------------
    // 2. 3D EYE SOCKETS, IRIS DISCS & EYE ANIMATION RIG
    // -------------------------------------------------------------------------
    const eyeIrisGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32);
    eyeIrisGeo.rotateX(Math.PI / 2);

    const defaultEyeTex = this.generateFallbackEyeTexture();
    this.eyeMaterial = new THREE.MeshBasicMaterial({
      map: defaultEyeTex,
      transparent: true,
      side: THREE.DoubleSide
    });

    textureLoader.load('assets/waifu_textures/eyes.jpg', (tex) => {
      this.eyeMaterial.map = tex;
      this.eyeMaterial.needsUpdate = true;
    });

    // Left Eye Iris Mesh
    this.eyeLeftMesh = new THREE.Mesh(eyeIrisGeo, this.eyeMaterial);
    this.eyeLeftMesh.position.set(-0.38, 0.08, 1.05);
    this.headGroup.add(this.eyeLeftMesh);

    // Right Eye Iris Mesh
    this.eyeRightMesh = new THREE.Mesh(eyeIrisGeo, this.eyeMaterial);
    this.eyeRightMesh.position.set(0.38, 0.08, 1.05);
    this.headGroup.add(this.eyeRightMesh);

    // 3D Eyelids for Blinking Animation (Torus Ribbons)
    const eyelidGeo = new THREE.TorusGeometry(0.27, 0.04, 16, 32, Math.PI);
    const eyelidMat = new THREE.MeshPhongMaterial({ color: 0xffdbd0, shininess: 10 });

    this.eyelidLeft = new THREE.Mesh(eyelidGeo, eyelidMat);
    this.eyelidLeft.position.set(-0.38, 0.12, 1.07);
    this.eyelidLeft.rotation.z = Math.PI;
    this.eyelidLeft.scale.set(1, 0.01, 1); // Hidden initially
    this.headGroup.add(this.eyelidLeft);

    this.eyelidRight = new THREE.Mesh(eyelidGeo, eyelidMat);
    this.eyelidRight.position.set(0.38, 0.12, 1.07);
    this.eyelidRight.rotation.z = Math.PI;
    this.eyelidRight.scale.set(1, 0.01, 1);
    this.headGroup.add(this.eyelidRight);

    // 3D Anime Upper Eyelash Brushes
    const lashGeo = new THREE.TorusGeometry(0.30, 0.035, 16, 32, Math.PI * 0.65);
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x11091c });

    const lashLeft = new THREE.Mesh(lashGeo, lashMat);
    lashLeft.position.set(-0.38, 0.22, 1.08);
    lashLeft.rotation.z = -0.15;
    this.headGroup.add(lashLeft);

    const lashRight = new THREE.Mesh(lashGeo, lashMat);
    lashRight.position.set(0.38, 0.22, 1.08);
    lashRight.rotation.z = 0.15;
    this.headGroup.add(lashRight);

    // 3D Expressive Eyebrows
    const browGeo = new THREE.BoxGeometry(0.32, 0.03, 0.02);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x3d0c24 });

    this.eyebrowLeft = new THREE.Mesh(browGeo, browMat);
    this.eyebrowLeft.position.set(-0.38, 0.42, 1.06);
    this.eyebrowLeft.rotation.z = 0.05;
    this.headGroup.add(this.eyebrowLeft);

    this.eyebrowRight = new THREE.Mesh(browGeo, browMat);
    this.eyebrowRight.position.set(0.38, 0.42, 1.06);
    this.eyebrowRight.rotation.z = -0.05;
    this.headGroup.add(this.eyebrowRight);

    // -------------------------------------------------------------------------
    // 3. MORPHABLE 3D MOUTH & ANIMATED BLUSH PLANES
    // -------------------------------------------------------------------------
    const mouthGeo = new THREE.RingGeometry(0.03, 0.13, 32);
    this.mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xff2b75, side: THREE.DoubleSide });
    this.mouthMesh = new THREE.Mesh(mouthGeo, this.mouthMaterial);
    this.mouthMesh.position.set(0, -0.42, 1.07);
    this.headGroup.add(this.mouthMesh);

    // Cheek Blush Layers
    const blushGeo = new THREE.CircleGeometry(0.22, 32);
    this.blushMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3388,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });

    this.blushLeft = new THREE.Mesh(blushGeo, this.blushMaterial);
    this.blushLeft.position.set(-0.55, -0.15, 1.04);
    this.headGroup.add(this.blushLeft);

    this.blushRight = new THREE.Mesh(blushGeo, this.blushMaterial);
    this.blushRight.position.set(0.55, -0.15, 1.04);
    this.headGroup.add(this.blushRight);

    // -------------------------------------------------------------------------
    // 4. MULTI-LAYERED ANIME HAIRSTYLE (Bangs, Side Locks, Canopy, Ahoge)
    // -------------------------------------------------------------------------
    const defaultHairTex = this.generateFallbackHairTexture();
    this.hairMaterial = new THREE.MeshPhongMaterial({
      map: defaultHairTex,
      shininess: 45,
      specular: 0xffc2eb
    });

    textureLoader.load('assets/waifu_textures/hair.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 2);
      this.hairMaterial.map = tex;
      this.hairMaterial.needsUpdate = true;
    });

    // Front Bangs (9 High-Poly Strands)
    for (let i = -4; i <= 4; i++) {
      const bangGeo = new THREE.ConeGeometry(0.18, 1.15, 24);
      const bang = new THREE.Mesh(bangGeo, this.hairMaterial);
      const offsetX = i * 0.22;
      const offsetY = 0.72 - Math.abs(i) * 0.04;
      bang.position.set(offsetX, offsetY, 0.98);
      bang.rotation.z = -i * 0.1;
      bang.rotation.x = 0.28;
      this.hairGroup.add(bang);
    }

    // Side Tresses / Locks (24 Radial Segments each)
    const tressGeo = new THREE.CylinderGeometry(0.16, 0.04, 2.5, 24);
    const tressLeft = new THREE.Mesh(tressGeo, this.hairMaterial);
    tressLeft.position.set(-1.18, -0.2, 0.75);
    tressLeft.rotation.z = 0.18;
    this.hairGroup.add(tressLeft);

    const tressRight = new THREE.Mesh(tressGeo, this.hairMaterial);
    tressRight.position.set(1.18, -0.2, 0.75);
    tressRight.rotation.z = -0.18;
    this.hairGroup.add(tressRight);

    // Sculpted Rear Hair Canopy (48x48 segments = 2,401 vertices)
    const backHairGeo = new THREE.SphereGeometry(1.42, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.78);
    const backHair = new THREE.Mesh(backHairGeo, this.hairMaterial);
    backHair.position.set(0, 0.1, -0.15);
    this.hairGroup.add(backHair);

    // Top Ahoge (Bouncing Anime Hair Antenna)
    const ahogeGeo = new THREE.TorusGeometry(0.42, 0.04, 16, 32, Math.PI * 0.8);
    this.ahogeMesh = new THREE.Mesh(ahogeGeo, this.hairMaterial);
    this.ahogeMesh.position.set(0, 1.45, 0.3);
    this.ahogeMesh.rotation.x = -Math.PI / 3;
    this.ahogeMesh.rotation.y = Math.PI / 4;
    this.hairGroup.add(this.ahogeMesh);

    this.headGroup.add(this.hairGroup);

    // -------------------------------------------------------------------------
    // 5. REVOLVING CYBER HALO & NECK COLLAR
    // -------------------------------------------------------------------------
    const haloGeo = new THREE.TorusGeometry(1.65, 0.07, 32, 128); // 4,200 vertices
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.haloRing = new THREE.Mesh(haloGeo, haloMat);
    this.haloRing.position.set(0, 1.85, 0);
    this.haloRing.rotation.x = Math.PI / 2.2;
    this.headGroup.add(this.haloRing);

    this.waifuGroup.add(this.headGroup);

    // -------------------------------------------------------------------------
    // 6. CYBER OUTFIT TORSO & SHOULDERS (48x16 segments = 1,600 vertices)
    // -------------------------------------------------------------------------
    const bodyGeo = new THREE.CylinderGeometry(0.75, 1.05, 1.8, 48, 16);
    this.outfitMaterial = new THREE.MeshPhongMaterial({
      map: this.generateFallbackOutfitTexture(),
      shininess: 60,
      specular: 0x00ffff
    });

    textureLoader.load('assets/waifu_textures/outfit.jpg', (tex) => {
      this.outfitMaterial.map = tex;
      this.outfitMaterial.needsUpdate = true;
    });

    this.outfitMesh = new THREE.Mesh(bodyGeo, this.outfitMaterial);
    this.outfitMesh.position.set(0, -1.85, 0);
    this.bodyGroup.add(this.outfitMesh);

    // Cyber Collar (32x64 segments = 2,100 vertices)
    const collarGeo = new THREE.TorusGeometry(0.78, 0.09, 32, 64);
    const collarMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, -1.05, 0);
    collar.rotation.x = Math.PI / 2;
    this.bodyGroup.add(collar);

    this.waifuGroup.add(this.bodyGroup);

    // -------------------------------------------------------------------------
    // 7. BACKGROUND HOLOGRAM PLANE & SCENE POSITIONING
    // -------------------------------------------------------------------------
    const planeGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const planeMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.bgTexturePlane = new THREE.Mesh(planeGeo, planeMat);
    this.bgTexturePlane.position.set(0, 0, -2.5);
    this.scene.add(this.bgTexturePlane);

    this.waifuGroup.position.set(0, -0.35, 0);
    this.scene.add(this.waifuGroup);
  }

  // Construct Ambient Particle System
  buildParticles() {
    this.particlesGroup = new THREE.Group();
    const particleCount = 75;
    const geo = new THREE.SphereGeometry(0.045, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff00aa, transparent: true, opacity: 0.75 });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(
        (Math.random() - 0.5) * 9.5,
        (Math.random() - 0.5) * 7.5,
        (Math.random() - 0.5) * 5.5
      );
      p.userData = {
        speedY: 0.008 + Math.random() * 0.016,
        seed: Math.random() * Math.PI * 2
      };
      this.particlesGroup.add(p);
    }
    this.scene.add(this.particlesGroup);
  }

  startAnimationLoop() {
    // Mouse Parallax Pointer listener
    this.mouseTargetX = 0;
    this.mouseTargetY = 0;
    this.mouseCurrentX = 0;
    this.mouseCurrentY = 0;

    if (this.container) {
      this.container.addEventListener('mousemove', (e) => {
        const rect = this.container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        this.mouseTargetX = x * 0.35;
        this.mouseTargetY = y * 0.25;
      });

      this.container.addEventListener('mouseleave', () => {
        this.mouseTargetX = 0;
        this.mouseTargetY = 0;
      });
    }

    const animate = () => {
      if (!this.initialized) return;

      this.time += 0.04;

      // Smooth Mouse Parallax Interpolation
      this.mouseCurrentX += (this.mouseTargetX - this.mouseCurrentX) * 0.08;
      this.mouseCurrentY += (this.mouseTargetY - this.mouseCurrentY) * 0.08;

      // 1. Idle Breathing, Head Sway & Speech Movement + Mouse Parallax
      if (this.waifuGroup) {
        if (this.isSpeaking) {
          // Energetic head tilt & bounce while talking
          this.waifuGroup.position.y = -0.35 + Math.abs(Math.sin(this.time * 4.5)) * 0.09;
          this.headGroup.rotation.y = Math.sin(this.time * 3.2) * 0.16 + this.mouseCurrentX;
          this.headGroup.rotation.x = this.mouseCurrentY;
          this.headGroup.rotation.z = Math.cos(this.time * 2.4) * 0.07;
          if (this.hairGroup) this.hairGroup.rotation.z = Math.sin(this.time * 3.5) * 0.05;
        } else {
          // Smooth idle breathing
          this.waifuGroup.position.y = -0.35 + Math.sin(this.time * 1.5) * 0.04;
          this.headGroup.rotation.y = Math.sin(this.time * 0.7) * 0.08 + this.mouseCurrentX;
          this.headGroup.rotation.x = this.mouseCurrentY;
          this.headGroup.rotation.z = Math.cos(this.time * 0.5) * 0.025;
          if (this.hairGroup) this.hairGroup.rotation.z = 0;
        }
      }

      // 2. Animated Top Ahoge Hair Antenna Bounce
      if (this.ahogeMesh) {
        this.ahogeMesh.rotation.z = Math.sin(this.time * 2.8) * 0.18;
      }

      // 3. Dynamic Eye Pupil Tracking & Gentle Eye Darting
      if (this.time > this.nextEyeLookTime) {
        this.eyeTargetX = (Math.random() - 0.5) * 0.08;
        this.eyeTargetY = (Math.random() - 0.5) * 0.05;
        this.nextEyeLookTime = this.time + 2 + Math.random() * 3;
      }
      this.eyeCurrentX += (this.eyeTargetX - this.eyeCurrentX) * 0.1;
      this.eyeCurrentY += (this.eyeTargetY - this.eyeCurrentY) * 0.1;

      if (this.eyeLeftMesh && this.eyeRightMesh) {
        this.eyeLeftMesh.position.x = -0.38 + this.eyeCurrentX + (this.mouseCurrentX * 0.15);
        this.eyeLeftMesh.position.y = 0.08 + this.eyeCurrentY - (this.mouseCurrentY * 0.15);
        this.eyeRightMesh.position.x = 0.38 + this.eyeCurrentX + (this.mouseCurrentX * 0.15);
        this.eyeRightMesh.position.y = 0.08 + this.eyeCurrentY - (this.mouseCurrentY * 0.15);
      }

      // 4. Natural Blinking Animation Cycle
      this.blinkTimer += 0.04;
      if (this.blinkTimer > 3.8) {
        this.isBlinking = true;
        if (this.eyelidLeft && this.eyelidRight) {
          this.eyelidLeft.scale.y = 1.0;
          this.eyelidRight.scale.y = 1.0;
        }
        if (this.blinkTimer > 4.02) {
          this.blinkTimer = 0;
          this.isBlinking = false;
          if (this.eyelidLeft && this.eyelidRight) {
            this.eyelidLeft.scale.y = 0.01;
            this.eyelidRight.scale.y = 0.01;
          }
        }
      }

      // 5. Dynamic Mouth Speech Lip-Sync Morphing
      if (this.mouthMesh) {
        if (this.isSpeaking) {
          const mouthOpenX = 1.1 + Math.abs(Math.sin(this.time * 14)) * 1.4;
          const mouthOpenY = 0.8 + Math.abs(Math.cos(this.time * 16)) * 1.8;
          this.mouthMesh.scale.set(mouthOpenX, mouthOpenY, 1);
        } else {
          this.mouthMesh.scale.set(1.0, 0.28, 1.0);
        }
      }

      // 6. Glowing Cyber Halo Spin & Float
      if (this.haloRing) {
        this.haloRing.rotation.z += 0.025;
        this.haloRing.position.y = 1.85 + Math.sin(this.time * 2.2) * 0.05;
      }

      // 7. Ambient Particle Rise & Sway
      if (this.particlesGroup) {
        this.particlesGroup.children.forEach(p => {
          p.position.y += p.userData.speedY;
          p.position.x += Math.sin(this.time + p.userData.seed) * 0.006;
          if (p.position.y > 4.2) p.position.y = -3.5;
        });
      }

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  // Update lighting, materials, and facial expressions cleanly based on AI emotion
  // WITHOUT destroying loaded textures!
  updateEmotion(emotionStr) {
    const str = typeof emotionStr === 'string' ? emotionStr : '';
    this.currentEmotion = str || 'Neutral 😊';

    let rimColorHex = 0x00f0ff;
    let dirColorHex = 0xff66bb;
    let blushOpacity = 0.35;
    let browAngleLeft = 0.05;
    let browAngleRight = -0.05;

    if (str.includes('Flustered') || str.includes('Love')) {
      rimColorHex = 0xff00aa;
      dirColorHex = 0xff0066;
      blushOpacity = 0.75; // Heavy blush
      browAngleLeft = -0.1;
      browAngleRight = 0.1;
    } else if (str.includes('Playful') || str.includes('Smug')) {
      rimColorHex = 0x00ffcc;
      dirColorHex = 0xff9900;
      blushOpacity = 0.45;
      browAngleLeft = 0.15;
      browAngleRight = -0.05;
    } else if (str.includes('Angry') || str.includes('Tsundere')) {
      rimColorHex = 0xff2200;
      dirColorHex = 0xcc0033;
      blushOpacity = 0.6;
      browAngleLeft = -0.25;
      browAngleRight = 0.25;
    }

    // Safely update light colors
    if (this.rimLight) this.rimLight.color.setHex(rimColorHex);
    if (this.dirLight) this.dirLight.color.setHex(dirColorHex);
    if (this.haloRing && this.haloRing.material) this.haloRing.material.color.setHex(rimColorHex);

    // Safely update blush intensity
    if (this.blushMaterial) this.blushMaterial.opacity = blushOpacity;

    // Safely update eyebrow angles
    if (this.eyebrowLeft) this.eyebrowLeft.rotation.z = browAngleLeft;
    if (this.eyebrowRight) this.eyebrowRight.rotation.z = browAngleRight;
  }

  setSpeakingState(speaking) {
    this.isSpeaking = !!speaking;
  }

  // Fetch AI DALL-E waifu background texture
  async loadWaifuTexture(characterName, emotion) {
    try {
      const endpoint = window.location.protocol === 'file:'
        ? 'http://localhost:3000/api/waifu-image'
        : '/api/waifu-image';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName, emotion })
      });

      const data = await res.json();
      if (data.url && this.bgTexturePlane) {
        const loader = new THREE.TextureLoader();
        loader.load(data.url, (texture) => {
          this.bgTexturePlane.material.map = texture;
          this.bgTexturePlane.material.opacity = 0.6;
          this.bgTexturePlane.material.needsUpdate = true;
        });
      }
    } catch (e) {
      console.warn("Waifu texture load warning:", e);
    }
  }

  handleResize() {
    if (!this.initialized || !this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 340;
    const height = this.container.clientHeight || 300;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  destroy() {
    this.initialized = false;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.onWindowResize);

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement) {
        this.renderer.domElement.remove();
      }
    }
  }
}
