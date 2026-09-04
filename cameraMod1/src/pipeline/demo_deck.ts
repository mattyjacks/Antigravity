export interface DemoItem {
  id: string;
  title: string;
  category: string;
  description: string;
  durationSeconds: number;
  type: 'procedural-ai' | 'procedural-quantum' | 'procedural-rust' | 'procedural-cloud' | 'procedural-mobile' | 'procedural-fintech' | 'video';
  videoUrl?: string;
  color: string;
}

export const BUILTIN_DEMOS: DemoItem[] = [
  {
    id: "demo-1",
    title: "Autonomous AI Neural Vision",
    category: "AI & Computer Vision",
    description: "Multi-class spatial object bounding & facial landmark tracking.",
    durationSeconds: 8,
    type: "procedural-ai",
    color: "#00f2fe",
  },
  {
    id: "demo-2",
    title: "Quantum Reactor 3D Visualizer",
    category: "Creative Dev & Shaders",
    description: "Volumetric raymarched particle core with neon harmonics.",
    durationSeconds: 8,
    type: "procedural-quantum",
    color: "#b026ff",
  },
  {
    id: "demo-3",
    title: "Rust & Tauri 0-Copy Engine",
    category: "Systems Engineering",
    description: "Ultra low-latency ring buffer streaming at 100k packets/sec.",
    durationSeconds: 8,
    type: "procedural-rust",
    color: "#ff0844",
  },
  {
    id: "demo-4",
    title: "Global Distributed Cloud Mesh",
    category: "Cloud Architecture",
    description: "Sub-millisecond multi-region active-active event sync mesh.",
    durationSeconds: 8,
    type: "procedural-cloud",
    color: "#00ff66",
  },
  {
    id: "demo-5",
    title: "120Hz Mobile Fluid Gesture Engine",
    category: "Mobile & UI/UX",
    description: "Zero-jank physics-based spring interactions & transitions.",
    durationSeconds: 8,
    type: "procedural-mobile",
    color: "#ffb800",
  },
  {
    id: "demo-6",
    title: "High-Frequency Market Intelligence",
    category: "Fintech & Web3",
    description: "Live real-time orderbook depth and latency arbitrage visualizer.",
    durationSeconds: 8,
    type: "procedural-fintech",
    color: "#00d2ff",
  },
];

export type DemoDisplayMode = 'pip' | 'split-screen' | 'background-replace';

export class DemoActionDeck {
  public demos: DemoItem[] = [...BUILTIN_DEMOS];
  public activeDemo: DemoItem | null = null;
  public displayMode: DemoDisplayMode = 'pip';
  public startTime = 0;
  public soundEnabled = true;

  private audioCtx: AudioContext | null = null;
  private customVideoElement: HTMLVideoElement | null = null;

  constructor() {}

  private initAudio(): void {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
  }

  public playTriggerChime(): void {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.00, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.2); // D6

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  public triggerDemo(demoId: string): void {
    const demo = this.demos.find(d => d.id === demoId);
    if (!demo) return;

    this.activeDemo = demo;
    this.startTime = performance.now();
    this.playTriggerChime();

    if (demo.type === 'video' && demo.videoUrl) {
      if (!this.customVideoElement) {
        this.customVideoElement = document.createElement('video');
        this.customVideoElement.muted = true;
        this.customVideoElement.loop = false;
        this.customVideoElement.playsInline = true;
      }
      this.customVideoElement.src = demo.videoUrl;
      this.customVideoElement.currentTime = 0;
      this.customVideoElement.play().catch(() => {});
    }
  }

  public stopDemo(): void {
    this.activeDemo = null;
    this.startTime = 0;
    if (this.customVideoElement) {
      this.customVideoElement.pause();
    }
  }

  public getProgress(now: number): { elapsed: number; remaining: number; percent: number; isComplete: boolean } {
    if (!this.activeDemo || this.startTime === 0) {
      return { elapsed: 0, remaining: 0, percent: 0, isComplete: true };
    }

    const elapsed = (now - this.startTime) / 1000;
    const duration = this.activeDemo.durationSeconds;
    const remaining = Math.max(0, duration - elapsed);
    const percent = Math.min(100, (elapsed / duration) * 100);
    const isComplete = elapsed >= duration;

    if (isComplete) {
      this.stopDemo();
    }

    return { elapsed, remaining, percent, isComplete };
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, now: number): void {
    if (!this.activeDemo) return;

    const { remaining, percent, isComplete } = this.getProgress(now);
    if (isComplete) return;

    const demo = this.activeDemo;
    const elapsed = (now - this.startTime) / 1000;

    // Determine viewport placement based on display mode
    let targetX = width - 420 - 24;
    let targetY = height - 290 - 64; // Above ticker
    let targetW = 420;
    let targetH = 260;

    if (this.displayMode === 'split-screen') {
      targetX = width / 2;
      targetY = 0;
      targetW = width / 2;
      targetH = height - 44;
    }

    ctx.save();

    // Container Glass Card with Glow
    ctx.shadowColor = demo.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(8, 12, 20, 0.95)';
    ctx.beginPath();
    ctx.roundRect(targetX, targetY, targetW, targetH, 12);
    ctx.fill();

    // Border
    ctx.strokeStyle = demo.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Clip content to window
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(targetX, targetY, targetW, targetH, 12);
    ctx.clip();

    // Draw procedural demo canvas animation
    this.renderDemoContent(ctx, targetX, targetY, targetW, targetH, demo, elapsed);

    // Header Overlay: Title & Category
    const headerH = 46;
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(targetX, targetY, targetW, headerH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(targetX, targetY + headerH);
    ctx.lineTo(targetX + targetW, targetY + headerH);
    ctx.stroke();

    // Category Tag
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = demo.color;
    ctx.textAlign = 'left';
    ctx.fillText(demo.category.toUpperCase(), targetX + 14, targetY + 18);

    // Title
    ctx.font = '800 13px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(demo.title, targetX + 14, targetY + 34);

    // Live Countdown Timer Badge
    const timerText = `${remaining.toFixed(1)}s`;
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillStyle = demo.color;
    ctx.textAlign = 'right';
    ctx.fillText(`⏱️ ${timerText}`, targetX + targetW - 14, targetY + 28);

    // Top 8-Second Progress Countdown Bar
    const barHeight = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(targetX, targetY, targetW, barHeight);

    const progressWidth = targetW * (1 - percent / 100);
    ctx.fillStyle = demo.color;
    ctx.shadowColor = demo.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(targetX, targetY, progressWidth, barHeight);

    ctx.restore();
    ctx.restore();
  }

  private renderDemoContent(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    demo: DemoItem,
    elapsed: number
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2 + 20;

    switch (demo.type) {
      case 'procedural-ai': {
        // AI Neural Vision detection bounding boxes & facial mesh
        ctx.fillStyle = '#060a12';
        ctx.fillRect(x, y, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
        ctx.lineWidth = 1;
        for (let gx = x; gx < x + w; gx += 30) {
          ctx.beginPath();
          ctx.moveTo(gx, y);
          ctx.lineTo(gx, y + h);
          ctx.stroke();
        }

        // Bounding Box 1
        const boxX = cx - 80 + Math.sin(elapsed * 2) * 20;
        const boxY = cy - 60 + Math.cos(elapsed * 2.5) * 15;
        const boxW = 160;
        const boxH = 110;

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Corner brackets
        ctx.fillStyle = '#00f2fe';
        const cLen = 10;
        ctx.fillRect(boxX - 2, boxY - 2, cLen, 3);
        ctx.fillRect(boxX - 2, boxY - 2, 3, cLen);
        ctx.fillRect(boxX + boxW - cLen + 2, boxY - 2, cLen, 3);
        ctx.fillRect(boxX + boxW - 1, boxY - 2, 3, cLen);

        // Label
        ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
        ctx.fillRect(boxX, boxY - 18, 120, 16);
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#000000';
        ctx.fillText(`HUMAN [${(98.4 + Math.sin(elapsed * 4) * 1.2).toFixed(1)}%]`, boxX + 4, boxY - 6);

        // Feature vector stream
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`LATENCY: ${(4.2 + Math.cos(elapsed * 5) * 0.8).toFixed(1)}ms | FPS: 60.0`, x + 14, y + h - 14);
        break;
      }

      case 'procedural-quantum': {
        // Volumetric 3D Quantum Reactor
        ctx.fillStyle = '#05030a';
        ctx.fillRect(x, y, w, h);

        const rings = 5;
        for (let r = 0; r < rings; r++) {
          const radius = (r + 1) * 22;
          const rot = elapsed * (1.5 + r * 0.4) * (r % 2 === 0 ? 1 : -1);

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);

          ctx.strokeStyle = r % 2 === 0 ? '#b026ff' : '#00ff66';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 10;

          ctx.beginPath();
          ctx.ellipse(0, 0, radius, radius * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Particle on ring
          const px = Math.cos(elapsed * 3 + r) * radius;
          const py = Math.sin(elapsed * 3 + r) * (radius * 0.4);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // Core pulsating orb
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#b026ff';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(cx, cy, 14 + Math.sin(elapsed * 6) * 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'procedural-rust': {
        // Rust & Tauri zero-copy streaming visualizer
        ctx.fillStyle = '#0d0406';
        ctx.fillRect(x, y, w, h);

        // Waveform
        ctx.strokeStyle = '#ff0844';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ff0844';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        for (let wx = x; wx < x + w; wx += 4) {
          const normX = (wx - x) / w;
          const wy = cy + Math.sin(normX * 12 + elapsed * 10) * 35 * Math.sin(normX * Math.PI);
          if (wx === x) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        // Stats
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffb199';
        ctx.fillText(`BUFFER: ZERO-COPY 4K RGBA SINK`, x + 14, y + 68);
        ctx.fillText(`THROUGHPUT: 120.4 MB/s (NO HEAP ALLOC)`, x + 14, y + 84);
        break;
      }

      case 'procedural-cloud': {
        // Global distributed cloud nodes
        ctx.fillStyle = '#020b08';
        ctx.fillRect(x, y, w, h);

        const nodes = [
          { name: 'SFO', nx: cx - 110, ny: cy - 20 },
          { name: 'NYC', nx: cx - 40, ny: cy - 35 },
          { name: 'FRA', nx: cx + 40, ny: cy - 30 },
          { name: 'TYO', nx: cx + 110, ny: cy - 10 },
          { name: 'SYD', nx: cx + 80, ny: cy + 35 },
        ];

        // Draw connections
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.3)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].nx, nodes[i].ny);
            ctx.lineTo(nodes[j].nx, nodes[j].ny);
            ctx.stroke();
          }
        }

        // Draw Nodes
        for (const node of nodes) {
          ctx.fillStyle = '#00ff66';
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(node.nx, node.ny, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#a7f3d0';
          ctx.fillText(node.name, node.nx - 10, node.ny - 9);
        }
        break;
      }

      default: {
        // Generic animated showcase
        ctx.fillStyle = '#080c14';
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = demo.color;
        ctx.font = '700 12px "Inter", sans-serif';
        ctx.fillText(demo.description, x + 14, cy);
        break;
      }
    }
  }
}
