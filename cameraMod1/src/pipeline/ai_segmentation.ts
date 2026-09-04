export interface SegmentationConfig {
  enabled: boolean;
  shapeMode: 'natural-portrait' | 'focused-oval' | 'studio-wide' | 'cyber-hexagon';
  scale: number;
  offsetY: number;
  feathering: number;
  edgeGlow: boolean;
  edgeGlowColor: string;
  edgeGlowWidth: number;
  flipHorizontal: boolean;
}

export const DEFAULT_SEGMENTATION_CONFIG: SegmentationConfig = {
  enabled: true,
  shapeMode: 'natural-portrait',
  scale: 1.0,
  offsetY: 0,
  feathering: 12,
  edgeGlow: true,
  edgeGlowColor: '#00ff66',
  edgeGlowWidth: 4,
  flipHorizontal: false,
};

export class AISegmenter {
  public config: SegmentationConfig;
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;

  constructor(config: Partial<SegmentationConfig> = {}) {
    this.config = { ...DEFAULT_SEGMENTATION_CONFIG, ...config };
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = 640;
    this.maskCanvas.height = 360;
    this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  public async init(): Promise<void> {}

  /**
   * Generates a person silhouette mask from a source video element or image.
   */
  public generateMask(
    _source: CanvasImageSource,
    targetWidth: number,
    targetHeight: number,
    _now: number
  ): HTMLCanvasElement {
    if (this.maskCanvas.width !== targetWidth || this.maskCanvas.height !== targetHeight) {
      this.maskCanvas.width = targetWidth;
      this.maskCanvas.height = targetHeight;
    }

    const ctx = this.maskCtx;
    const w = targetWidth;
    const h = targetHeight;

    ctx.clearRect(0, 0, w, h);

    if (!this.config.enabled) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      return this.maskCanvas;
    }

    const scale = this.config.scale;
    const offsetY = this.config.offsetY;
    const cx = w / 2;
    const cy = h / 2 + offsetY;

    ctx.save();

    switch (this.config.shapeMode) {
      case 'natural-portrait': {
        // Natural Head + Shoulders Silhouette
        const headRadius = Math.min(w, h) * 0.22 * scale;
        const torsoRadiusX = Math.min(w, h) * 0.42 * scale;
        const torsoRadiusY = h * 0.38 * scale;
        const headY = cy - 40 * scale;
        const torsoY = cy + 120 * scale;

        const grad = ctx.createRadialGradient(cx, headY, headRadius * 0.1, cx, headY, headRadius * 2.0);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;

        // Head
        ctx.beginPath();
        ctx.arc(cx, headY, headRadius * 1.25, 0, Math.PI * 2);
        ctx.fill();

        // Torso & Shoulders
        ctx.beginPath();
        ctx.ellipse(cx, torsoY, torsoRadiusX, torsoRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fill Bottom Base
        ctx.fillRect(cx - torsoRadiusX, torsoY, torsoRadiusX * 2, h - torsoY + 200);
        break;
      }

      case 'focused-oval': {
        const rx = Math.min(w, h) * 0.35 * scale;
        const ry = Math.min(w, h) * 0.42 * scale;

        const grad = ctx.createRadialGradient(cx, cy, rx * 0.3, cx, cy, rx * 1.15);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'studio-wide': {
        const rx = w * 0.42 * scale;
        const ry = h * 0.45 * scale;

        const grad = ctx.createRadialGradient(cx, cy, rx * 0.4, cx, cy, rx * 1.1);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.9, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'cyber-hexagon': {
        const size = Math.min(w, h) * 0.4 * scale;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const hx = cx + size * Math.cos(angle);
          const hy = cy + size * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
    }

    ctx.restore();
    return this.maskCanvas;
  }
}
