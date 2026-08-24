/**
 * Three.js 3D Animated Waifu & AI Driven Character Rendering Engine
 * Powered by WebGL + Procedural 3D Rigging + OpenAI DALL-E 2 Texture Planes
 */

export class Waifu3DEngine {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animFrameId = null;

    // 3D Meshes
    this.waifuGroup = new THREE.Group();
    this.headMesh = null;
    this.eyeLeft = null;
    this.eyeRight = null;
    this.mouthMesh = null;
    this.haloRing = null;
    this.texturePlane = null;
    this.particlesGroup = new THREE.Group();

    // Lighting
    this.ambientLight = null;
    this.pointLight = null;

    // State
    this.isSpeaking = false;
    this.currentEmotion = 'Neutral 😊';
    this.blinkTimer = 0;
    this.time = 0;
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
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 7);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(this.ambientLight);

    this.pointLight = new THREE.PointLight(0xff007f, 2, 20);
    this.pointLight.position.set(2, 3, 4);
    this.scene.add(this.pointLight);

    // Build 3D Waifu Character
    this.buildWaifuModel();

    // Add Floating Particles
    this.buildParticles();

    // Animation Loop
    this.initialized = true;
    this.startAnimationLoop();

    return true;
  }

  buildWaifuModel() {
    this.waifuGroup = new THREE.Group();

    // 1. Head (Stylized Sphere)
    const headGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const headMat = new THREE.MeshPhongMaterial({
      color: 0xffe4e1,
      shininess: 30,
      specular: 0x333333
    });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.waifuGroup.add(this.headMesh);

    // 2. Anime Eyes (Glowing Cyan/Pink Spheroids)
    const eyeGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    this.eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeLeft.position.set(-0.45, 0.2, 1.05);
    this.eyeLeft.scale.set(1, 1.3, 0.3);
    this.waifuGroup.add(this.eyeLeft);

    this.eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeRight.position.set(0.45, 0.2, 1.05);
    this.eyeRight.scale.set(1, 1.3, 0.3);
    this.waifuGroup.add(this.eyeRight);

    // 3. Mouth (Dynamic Scale for Lip-Sync)
    const mouthGeo = new THREE.RingGeometry(0.05, 0.12, 16);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide });
    this.mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouthMesh.position.set(0, -0.4, 1.15);
    this.waifuGroup.add(this.mouthMesh);

    // 4. Cyber Headset / Cat Ears
    const earGeo = new THREE.ConeGeometry(0.4, 0.8, 4);
    const earMat = new THREE.MeshPhongMaterial({ color: 0xff007f });

    const earLeft = new THREE.Mesh(earGeo, earMat);
    earLeft.position.set(-0.9, 1.2, 0);
    earLeft.rotation.z = 0.3;
    this.waifuGroup.add(earLeft);

    const earRight = new THREE.Mesh(earGeo, earMat);
    earRight.position.set(0.9, 1.2, 0);
    earRight.rotation.z = -0.3;
    this.waifuGroup.add(earRight);

    // 5. Spinning Cyber Halo Ring
    const haloGeo = new THREE.TorusGeometry(1.6, 0.05, 16, 100);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.haloRing = new THREE.Mesh(haloGeo, haloMat);
    this.haloRing.position.set(0, 1.7, 0);
    this.haloRing.rotation.x = Math.PI / 2.2;
    this.waifuGroup.add(this.haloRing);

    // 6. Holographic Texture Plane (DALL-E 2 Image Background)
    const planeGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });
    this.texturePlane = new THREE.Mesh(planeGeo, planeMat);
    this.texturePlane.position.set(0, 0, -1.5);
    this.waifuGroup.add(this.texturePlane);

    this.scene.add(this.waifuGroup);
  }

  buildParticles() {
    this.particlesGroup = new THREE.Group();
    const particleCount = 40;
    const geo = new THREE.SphereGeometry(0.04, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff007f });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4
      );
      p.userData = {
        speedY: 0.01 + Math.random() * 0.02,
        seed: Math.random() * Math.PI * 2
      };
      this.particlesGroup.add(p);
    }
    this.scene.add(this.particlesGroup);
  }

  startAnimationLoop() {
    const animate = () => {
      if (!this.initialized) return;

      this.time += 0.03;

      // 1. Idle Breathing & Head Sway
      if (this.waifuGroup) {
        this.waifuGroup.position.y = Math.sin(this.time * 1.5) * 0.12;
        this.waifuGroup.rotation.y = Math.sin(this.time * 0.8) * 0.15;
        this.waifuGroup.rotation.z = Math.cos(this.time * 0.5) * 0.05;
      }

      // 2. Halo Rotation
      if (this.haloRing) {
        this.haloRing.rotation.z += 0.02;
      }

      // 3. Dynamic Mouth Lip-Sync Scale when AI Speaks
      if (this.mouthMesh) {
        if (this.isSpeaking) {
          const mouthScale = 1 + Math.abs(Math.sin(this.time * 12)) * 1.5;
          this.mouthMesh.scale.set(mouthScale, mouthScale, 1);
        } else {
          this.mouthMesh.scale.set(1, 0.3, 1);
        }
      }

      // 4. Eye Blink Cycle
      this.blinkTimer += 0.03;
      if (this.blinkTimer > 4) {
        if (this.eyeLeft && this.eyeRight) {
          this.eyeLeft.scale.y = 0.1;
          this.eyeRight.scale.y = 0.1;
        }
        if (this.blinkTimer > 4.15) {
          this.blinkTimer = 0;
          if (this.eyeLeft && this.eyeRight) {
            this.eyeLeft.scale.y = 1.3;
            this.eyeRight.scale.y = 1.3;
          }
        }
      }

      // 5. Floating Particles Movement
      if (this.particlesGroup) {
        this.particlesGroup.children.forEach(p => {
          p.position.y += p.userData.speedY;
          p.position.x += Math.sin(this.time + p.userData.seed) * 0.005;
          if (p.position.y > 4) p.position.y = -3;
        });
      }

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  // Update lighting and color scheme based on AI emotion
  updateEmotion(emotionStr) {
    this.currentEmotion = emotionStr || 'Neutral 😊';

    let lightColor = 0x00f0ff;
    let particleColor = 0xff007f;

    if (emotionStr.includes('Flustered') || emotionStr.includes('Love')) {
      lightColor = 0xff007f;
      particleColor = 0xff66cc;
    } else if (emotionStr.includes('Playful') || emotionStr.includes('Smug')) {
      lightColor = 0x00ffcc;
      particleColor = 0xffd700;
    } else if (emotionStr.includes('Angry') || emotionStr.includes('Tsundere')) {
      lightColor = 0xff0033;
      particleColor = 0xff3300;
    }

    if (this.pointLight) this.pointLight.color.setHex(lightColor);
    if (this.haloRing) this.haloRing.material.color.setHex(lightColor);
    if (this.eyeLeft && this.eyeRight) {
      this.eyeLeft.material.color.setHex(lightColor);
      this.eyeRight.material.color.setHex(lightColor);
    }
  }

  setSpeakingState(speaking) {
    this.isSpeaking = speaking;
  }

  // Fetch cheapest OpenAI DALL-E 2 (256x256) waifu texture map
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
      if (data.url && this.texturePlane) {
        const loader = new THREE.TextureLoader();
        loader.load(data.url, (texture) => {
          this.texturePlane.material.map = texture;
          this.texturePlane.material.opacity = 0.85;
          this.texturePlane.material.needsUpdate = true;
        });
      }
    } catch (e) {
      console.warn("DALL-E waifu texture load failed:", e);
    }
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 250;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
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
