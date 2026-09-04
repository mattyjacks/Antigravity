import { MatrixRainEngine, MatrixConfig } from './matrix_rain.js';
import { WatermarkOverlay, WatermarkConfig } from './watermark.js';
import { LiveTickerOverlay, TickerConfig } from './ticker.js';
import { DemoActionDeck, DemoDisplayMode } from './demo_deck.js';
import { AISegmenter, SegmentationConfig } from './ai_segmentation.js';
import { CameraInputManager } from './camera_input.js';

export interface LayerVisibility {
  camera: boolean;
  aiMatte: boolean;
  matrixRain: boolean;
  watermark: boolean;
  ticker: boolean;
  demoDeck: boolean;
}

export class VideoCompositor {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public matrixEngine: MatrixRainEngine;
  public watermark: WatermarkOverlay;
  public ticker: LiveTickerOverlay;
  public demoDeck: DemoActionDeck;
  public segmenter: AISegmenter;
  public cameraInput: CameraInputManager;

  public layers: LayerVisibility = {
    camera: true,
    aiMatte: true,
    matrixRain: true,
    watermark: true,
    ticker: true,
    demoDeck: true,
  };

  public width = 1280;
  public height = 720;
  private isRunning = false;
  private animationFrameId = 0;

  // Performance metrics
  public currentFps = 60;
  public frameLatencyMs = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;

  // Offscreen Buffers
  private personCanvas: HTMLCanvasElement;
  private personCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;

    this.matrixEngine = new MatrixRainEngine();
    this.watermark = new WatermarkOverlay();
    this.ticker = new LiveTickerOverlay();
    this.demoDeck = new DemoActionDeck();
    this.segmenter = new AISegmenter();
    this.cameraInput = new CameraInputManager();

    this.personCanvas = document.createElement('canvas');
    this.personCanvas.width = this.width;
    this.personCanvas.height = this.height;
    this.personCtx = this.personCanvas.getContext('2d')!;

    this.setResolution(1280, 720);
  }

  public setResolution(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.personCanvas.width = width;
    this.personCanvas.height = height;
    this.matrixEngine.resize(width, height);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFpsUpdate = performance.now();
    this.renderLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public getOutputStream(): MediaStream {
    return this.canvas.captureStream(60);
  }

  private renderLoop = (): void => {
    if (!this.isRunning) return;

    const startTimestamp = performance.now();

    this.renderFrame(startTimestamp);

    // Calculate latency and FPS
    this.frameLatencyMs = performance.now() - startTimestamp;
    this.frameCount++;

    if (startTimestamp - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (startTimestamp - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = startTimestamp;
    }

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  public renderFrame(now: number): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Layer 0: Background (Matrix Digital Rain)
    if (this.layers.matrixRain) {
      this.matrixEngine.render(ctx, w, h, now);
    } else {
      ctx.fillStyle = '#05080f';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Layer 1: Presenter Camera with AI Matte
    if (this.layers.camera) {
      const cameraSource = this.cameraInput.getVideoSource(now);

      if (this.layers.aiMatte) {
        // Render Camera to offscreen buffer masked by AI segmentation
        const pCtx = this.personCtx;
        pCtx.clearRect(0, 0, w, h);

        // Draw camera video feed
        pCtx.save();
        if (this.segmenter.config.flipHorizontal) {
          pCtx.translate(w, 0);
          pCtx.scale(-1, 1);
        }
        pCtx.drawImage(cameraSource, 0, 0, w, h);
        pCtx.restore();

        // Generate AI Matte mask
        const maskCanvas = this.segmenter.generateMask(cameraSource, w, h, now);

        // Apply Destination-In blend mode to mask camera to person silhouette
        pCtx.globalCompositeOperation = 'destination-in';
        pCtx.drawImage(maskCanvas, 0, 0, w, h);
        pCtx.globalCompositeOperation = 'source-over';

        // Draw Person Silhouette onto main canvas
        ctx.save();
        if (this.segmenter.config.edgeGlow) {
          ctx.shadowColor = this.segmenter.config.edgeGlowColor;
          ctx.shadowBlur = this.segmenter.config.edgeGlowWidth * 4;
        }
        ctx.drawImage(this.personCanvas, 0, 0, w, h);
        ctx.restore();
      } else {
        // Direct unmasked camera feed
        ctx.save();
        if (this.segmenter.config.flipHorizontal) {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(cameraSource, 0, 0, w, h);
        ctx.restore();
      }
    }

    // 3. Layer 2: Matty Jacks Networking Watermark Badge
    if (this.layers.watermark) {
      this.watermark.render(ctx, w, h, now);
    }

    // 4. Layer 3: Interactive 8-Second Demo Deck Popup / Split-Screen
    if (this.layers.demoDeck) {
      this.demoDeck.render(ctx, w, h, now);
    }

    // 5. Layer 4: Live Scrolling News Ticker at Bottom
    if (this.layers.ticker) {
      this.ticker.render(ctx, w, h, now);
    }
  }
}
