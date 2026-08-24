/**
 * Three.js High-Detail Anime Realistic 3D Waifu Rendering Engine
 * Features Procedural Anime Textures (Skin, Eyes, Hair Highlights, Cyber Outfit),
 * Layered Anime Hairstyle, Morphable Face Rigging, and DALL-E 2 Texture Integration
 */

export class Waifu3DEngine {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animFrameId = null;

    // 3D Model Hierarchy
    this.waifuGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.hairGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();

    // Body Part Meshes & Materials
    this.faceMesh = null;
    this.faceMaterial = null;
    this.eyeLeftMesh = null;
    this.eyeRightMesh = null;
    this.eyeMaterial = null;
    this.mouthMesh = null;
    this.mouthMaterial = null;
    this.hairMesh = null;
    this.hairMaterial = null;
    this.outfitMesh = null;
    this.outfitMaterial = null;
    this.haloRing = null;
    this.bgTexturePlane = null;
    this.particlesGroup = new THREE.Group();

    // Lighting
    this.ambientLight = null;
    this.dirLight = null;
    this.rimLight = null;

    // State & Animation
    this.isSpeaking = false;
    this.currentEmotion = 'Neutral 😊';
    this.time = 0;
    this.blinkTimer = 0;
    this.initialized = false;
  }

  init(containerElem) {
    if (!containerElem || typeof THREE === 'undefined') return false;
    this.container = containerElem;
    this.container.innerHTML = '';

    const width = containerElem.clientWidth || 300;
    const height = containerElem.clientHeight || 250;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    this.camera.position.set(0, 0.2, 6.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Lighting setup for anime shading
    this.ambientLight = new THREE.AmbientLight(0xfff0f5, 0.9);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xff007f, 1.2);
    this.dirLight.position.set(3, 4, 5);
    this.scene.add(this.dirLight);

    this.rimLight = new THREE.PointLight(0x00f0ff, 2.5, 10);
    this.rimLight.position.set(-3, 2, -2);
    this.scene.add(this.rimLight);

    // Build Detailed Anime Waifu
    this.buildWaifuModel();

    // Build Floating Particle Effects
    this.buildParticles();

    this.initialized = true;
    this.startAnimationLoop();

    return true;
  }

  // Generate Procedural Textures for Each Body Part
  generateFaceTexture(blushColor = '#ff66aa') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base skin tone gradient
    const skinGrad = ctx.createLinearGradient(0, 0, 0, 512);
    skinGrad.addColorStop(0, '#fff5f0');
    skinGrad.addColorStop(0.5, '#ffebe3');
    skinGrad.addColorStop(1, '#ffd9cd');
    ctx.fillStyle = skinGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Soft Anime Cheek Blush
    const drawBlush = (x, y) => {
      const g = ctx.createRadialGradient(x, y, 5, x, y, 60);
      g.addColorStop(0, blushColor);
      g.addColorStop(0.6, 'rgba(255, 100, 150, 0.2)');
      g.addColorStop(1, 'rgba(255, 235, 227, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 60, 0, Math.PI * 2);
      ctx.fill();
    };

    drawBlush(150, 310);
    drawBlush(362, 310);

    // Subtle Anime Nose Dot
    ctx.fillStyle = '#e8a598';
    ctx.beginPath();
    ctx.arc(256, 330, 3, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  generateAnimeEyeTexture(irisColor = '#00f0ff') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Sclera (White background)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    // Iris Outer Circle & Gradient
    const irisGrad = ctx.createLinearGradient(256, 100, 256, 420);
    irisGrad.addColorStop(0, irisColor);
    irisGrad.addColorStop(0.5, '#0088cc');
    irisGrad.addColorStop(1, '#001a33');

    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(256, 260, 140, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#050714';
    ctx.beginPath();
    ctx.ellipse(256, 260, 60, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anime Catchlights / Star Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(200, 180, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(300, 330, 20, 0, Math.PI * 2);
    ctx.fill();

    // Inner Star Burst
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 45px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦', 256, 275);

    return new THREE.CanvasTexture(canvas);
  }

  generateHairTexture(hairColor = '#ff007f') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Hair Base Color
    ctx.fillStyle = hairColor;
    ctx.fillRect(0, 0, 512, 512);

    // Hair Strand Details
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + (Math.random() * 40 - 20), 512);
      ctx.stroke();
    }

    // Anime Hair Specular Highlight Band ("Tenshi no Ring")
    const ringGrad = ctx.createLinearGradient(0, 180, 0, 240);
    ringGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    ringGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
    ringGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = ringGrad;
    ctx.fillRect(0, 180, 512, 60);

    return new THREE.CanvasTexture(canvas);
  }

  generateCyberOutfitTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark Cyber Fabric
    ctx.fillStyle = '#0d111e';
    ctx.fillRect(0, 0, 512, 512);

    // Neon Cyber Trim Lines
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 100); ctx.lineTo(512, 100);
    ctx.moveTo(256, 100); ctx.lineTo(256, 512);
    ctx.stroke();

    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 150, 0, Math.PI * 2);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  // Construct Realistic Anime Waifu Mesh Structure
  buildWaifuModel() {
    this.waifuGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.hairGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();

    // Texture loader helper
    const textureLoader = new THREE.TextureLoader();

    // 1. Anime Face Mesh (Tapered chin, smooth cheeks)
    const faceGeo = new THREE.SphereGeometry(1.1, 32, 32);
    const pos = faceGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i);
      let x = pos.getX(i);
      let z = pos.getZ(i);
      if (y < 0) {
        pos.setX(i, x * (1 + y * 0.25));
        pos.setZ(i, z * (1 + y * 0.25));
      }
    }
    faceGeo.computeVertexNormals();

    const defaultFaceTex = this.generateFaceTexture('#ff66aa');
    this.faceMaterial = new THREE.MeshPhongMaterial({
      map: defaultFaceTex,
      shininess: 15,
      specular: 0x222222
    });
    textureLoader.load('assets/waifu_textures/face.jpg', (tex) => {
      this.faceMaterial.map = tex;
      this.faceMaterial.needsUpdate = true;
    });

    this.faceMesh = new THREE.Mesh(faceGeo, this.faceMaterial);
    this.headGroup.add(this.faceMesh);

    // 2. Realistic Curved Anime Eyes with Eyelashes
    const eyeGeo = new THREE.PlaneGeometry(0.55, 0.7);
    const defaultEyeTex = this.generateAnimeEyeTexture('#00f0ff');
    this.eyeMaterial = new THREE.MeshBasicMaterial({
      map: defaultEyeTex,
      transparent: true,
      side: THREE.DoubleSide
    });
    textureLoader.load('assets/waifu_textures/eyes.jpg', (tex) => {
      this.eyeMaterial.map = tex;
      this.eyeMaterial.needsUpdate = true;
    });

    this.eyeLeftMesh = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    this.eyeLeftMesh.position.set(-0.42, 0.12, 1.02);
    this.eyeLeftMesh.rotation.y = 0.2;
    this.headGroup.add(this.eyeLeftMesh);

    this.eyeRightMesh = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    this.eyeRightMesh.position.set(0.42, 0.12, 1.02);
    this.eyeRightMesh.rotation.y = -0.2;
    this.headGroup.add(this.eyeRightMesh);

    // Anime Eyelash Brushes
    const lashGeo = new THREE.TorusGeometry(0.32, 0.03, 8, 16, Math.PI * 0.7);
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x050714 });

    const lashLeft = new THREE.Mesh(lashGeo, lashMat);
    lashLeft.position.set(-0.42, 0.45, 1.05);
    lashLeft.rotation.z = -0.2;
    this.headGroup.add(lashLeft);

    const lashRight = new THREE.Mesh(lashGeo, lashMat);
    lashRight.position.set(0.42, 0.45, 1.05);
    lashRight.rotation.z = 0.2;
    this.headGroup.add(lashRight);

    // 3. Anime Mouth (Detailed shape)
    const mouthGeo = new THREE.RingGeometry(0.04, 0.14, 24);
    this.mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xff3377, side: THREE.DoubleSide });
    this.mouthMesh = new THREE.Mesh(mouthGeo, this.mouthMaterial);
    this.mouthMesh.position.set(0, -0.45, 1.07);
    this.headGroup.add(this.mouthMesh);

    // 4. Multi-Layered Anime Hairstyle (Bangs, Side Locks, Back Hair)
    const defaultHairTex = this.generateHairTexture('#ff007f');
    this.hairMaterial = new THREE.MeshPhongMaterial({
      map: defaultHairTex,
      shininess: 40,
      specular: 0xffaae5
    });
    textureLoader.load('assets/waifu_textures/hair.jpg', (tex) => {
      this.hairMaterial.map = tex;
      this.hairMaterial.needsUpdate = true;
    });

    // Front Anime Bangs
    for (let i = -3; i <= 3; i++) {
      const bangGeo = new THREE.ConeGeometry(0.22, 1.1, 12);
      const bang = new THREE.Mesh(bangGeo, this.hairMaterial);
      bang.position.set(i * 0.25, 0.75 - Math.abs(i) * 0.05, 0.95);
      bang.rotation.z = -i * 0.12;
      bang.rotation.x = 0.3;
      this.hairGroup.add(bang);
    }

    // Side Tresses
    const tressGeo = new THREE.CylinderGeometry(0.18, 0.05, 2.2, 12);
    const tressLeft = new THREE.Mesh(tressGeo, this.hairMaterial);
    tressLeft.position.set(-1.15, -0.1, 0.7);
    tressLeft.rotation.z = 0.2;
    this.hairGroup.add(tressLeft);

    const tressRight = new THREE.Mesh(tressGeo, this.hairMaterial);
    tressRight.position.set(1.15, -0.1, 0.7);
    tressRight.rotation.z = -0.2;
    this.hairGroup.add(tressRight);

    // Twin Tails / Back Volume
    const backHairGeo = new THREE.SphereGeometry(1.35, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const backHair = new THREE.Mesh(backHairGeo, this.hairMaterial);
    backHair.position.set(0, 0.15, -0.2);
    this.hairGroup.add(backHair);

    this.headGroup.add(this.hairGroup);

    // 5. Floating Cyber Halo & Headset
    const haloGeo = new THREE.TorusGeometry(1.65, 0.06, 16, 100);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.haloRing = new THREE.Mesh(haloGeo, haloMat);
    this.haloRing.position.set(0, 1.85, 0);
    this.haloRing.rotation.x = Math.PI / 2.2;
    this.headGroup.add(this.haloRing);

    this.waifuGroup.add(this.headGroup);

    // 6. Anime Shoulders & Cyber Outfit Body
    const bodyGeo = new THREE.CylinderGeometry(0.7, 0.95, 1.6, 16);
    this.outfitMaterial = new THREE.MeshPhongMaterial({
      map: this.generateCyberOutfitTexture(),
      shininess: 50
    });
    textureLoader.load('assets/waifu_textures/outfit.jpg', (tex) => {
      this.outfitMaterial.map = tex;
      this.outfitMaterial.needsUpdate = true;
    });
    this.outfitMesh = new THREE.Mesh(bodyGeo, this.outfitMaterial);
    this.outfitMesh.position.set(0, -1.8, 0);
    this.bodyGroup.add(this.outfitMesh);

    // Cyber Collar
    const collarGeo = new THREE.TorusGeometry(0.75, 0.08, 16, 32);
    const collarMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, -1.05, 0);
    collar.rotation.x = Math.PI / 2;
    this.bodyGroup.add(collar);

    this.waifuGroup.add(this.bodyGroup);

    // 7. Background Hologram Texture Plane (Only visible once texture loads)
    const planeGeo = new THREE.PlaneGeometry(5.0, 5.0);
    const planeMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0, // Hidden until loaded
      side: THREE.DoubleSide
    });
    this.bgTexturePlane = new THREE.Mesh(planeGeo, planeMat);
    this.bgTexturePlane.position.set(0, 0, -2.5);
    this.scene.add(this.bgTexturePlane);

    // Frame Waifu model cleanly in viewport
    this.waifuGroup.position.set(0, -0.4, 0);
    this.scene.add(this.waifuGroup);
  }

  buildParticles() {
    this.particlesGroup = new THREE.Group();
    const particleCount = 60;
    const geo = new THREE.SphereGeometry(0.04, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff007f, transparent: true, opacity: 0.8 });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 5
      );
      p.userData = {
        speedY: 0.008 + Math.random() * 0.015,
        seed: Math.random() * Math.PI * 2
      };
      this.particlesGroup.add(p);
    }
    this.scene.add(this.particlesGroup);
  }

  startAnimationLoop() {
    const animate = () => {
      if (!this.initialized) return;

      this.time += 0.035;

      // 1. Natural Anime Idle Breathing & Head Nodding
      if (this.waifuGroup) {
        this.waifuGroup.position.y = Math.sin(this.time * 1.6) * 0.08;
        this.headGroup.rotation.y = Math.sin(this.time * 0.9) * 0.12;
        this.headGroup.rotation.z = Math.cos(this.time * 0.6) * 0.04;
      }

      // 2. Halo Spin
      if (this.haloRing) {
        this.haloRing.rotation.z += 0.025;
      }

      // 3. Lip-Sync Mouth Morphing during AI Voice Speech
      if (this.mouthMesh) {
        if (this.isSpeaking) {
          const mouthOpen = 1 + Math.abs(Math.sin(this.time * 14)) * 1.8;
          this.mouthMesh.scale.set(mouthOpen, mouthOpen, 1);
        } else {
          this.mouthMesh.scale.set(1, 0.25, 1);
        }
      }

      // 4. Natural Anime Eye Blinking Cycle
      this.blinkTimer += 0.03;
      if (this.blinkTimer > 3.8) {
        if (this.eyeLeftMesh && this.eyeRightMesh) {
          this.eyeLeftMesh.scale.y = 0.08;
          this.eyeRightMesh.scale.y = 0.08;
        }
        if (this.blinkTimer > 3.95) {
          this.blinkTimer = 0;
          if (this.eyeLeftMesh && this.eyeRightMesh) {
            this.eyeLeftMesh.scale.y = 1.0;
            this.eyeRightMesh.scale.y = 1.0;
          }
        }
      }

      // 5. Floating Particle Movement
      if (this.particlesGroup) {
        this.particlesGroup.children.forEach(p => {
          p.position.y += p.userData.speedY;
          p.position.x += Math.sin(this.time + p.userData.seed) * 0.006;
          if (p.position.y > 4) p.position.y = -3.5;
        });
      }

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  // Update lighting & procedural texture palette based on AI emotion
  updateEmotion(emotionStr) {
    this.currentEmotion = emotionStr || 'Neutral 😊';

    let eyeColor = '#00f0ff';
    let hairColor = '#ff007f';
    let blushColor = '#ff66aa';
    let lightHex = 0xff007f;

    if (emotionStr.includes('Flustered') || emotionStr.includes('Love')) {
      eyeColor = '#ff00aa';
      hairColor = '#ff007f';
      blushColor = '#ff0055';
      lightHex = 0xff00aa;
    } else if (emotionStr.includes('Playful') || emotionStr.includes('Smug')) {
      eyeColor = '#00ffcc';
      hairColor = '#ff9900';
      blushColor = '#ff99aa';
      lightHex = 0x00ffcc;
    } else if (emotionStr.includes('Angry') || emotionStr.includes('Tsundere')) {
      eyeColor = '#ff3300';
      hairColor = '#cc0033';
      blushColor = '#ff3333';
      lightHex = 0xff0033;
    }

    // Update procedural textures
    if (this.eyeMaterial) this.eyeMaterial.map = this.generateAnimeEyeTexture(eyeColor);
    if (this.hairMaterial) this.hairMaterial.map = this.generateHairTexture(hairColor);
    if (this.faceMaterial) this.faceMaterial.map = this.generateFaceTexture(blushColor);
    if (this.dirLight) this.dirLight.color.setHex(lightHex);
    if (this.haloRing) this.haloRing.material.color.setHex(lightHex);
  }

  setSpeakingState(speaking) {
    this.isSpeaking = speaking;
  }

  // Fetch cheapest OpenAI DALL-E 2 (256x256) waifu background texture
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
          this.bgTexturePlane.material.opacity = 0.65;
          this.bgTexturePlane.material.needsUpdate = true;
        });
      }
    } catch (e) {
      console.warn("DALL-E waifu texture load failed:", e);
    }
  }

  destroy() {
    this.initialized = false;
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
