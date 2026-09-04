export interface TickerConfig {
  enabled: boolean;
  speed: number;
  items: string[];
  backgroundColor: string;
  textColor: string;
  highlightColor: string;
  fontSize: number;
  height: number;
  separator: string;
}

export const DEFAULT_TICKER_CONFIG: TickerConfig = {
  enabled: true,
  speed: 2.0,
  items: [
    "🚀 MATTY JACKS • Advanced Full-Stack & AI Engineering",
    "⚡ Expertise: Tauri • Rust • WebGL • TypeScript • Real-Time Media",
    "🎯 Live Networking Event Mode Active • Press Keys 1-6 for 8s Tech Demos!",
    "🤝 Open for High-Impact Software Collaborations & System Consulting",
    "✨ Green-Screen-Less AI Matrix Virtual Cam running at 60 FPS"
  ],
  backgroundColor: "rgba(10, 14, 23, 0.92)",
  textColor: "#e2e8f0",
  highlightColor: "#00ff66",
  fontSize: 16,
  height: 44,
  separator: "   ✦   ",
};

export class LiveTickerOverlay {
  public config: TickerConfig;
  private offset = 0;
  private totalWidth = 0;
  private lastTime = 0;

  constructor(config: Partial<TickerConfig> = {}) {
    this.config = { ...DEFAULT_TICKER_CONFIG, ...config };
  }

  public setItems(items: string[]): void {
    this.config.items = items.filter(t => t.trim().length > 0);
  }

  public addItem(item: string): void {
    if (item.trim()) {
      this.config.items.push(item.trim());
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, now: number): void {
    if (!this.config.enabled || this.config.items.length === 0) return;

    if (!this.lastTime) this.lastTime = now;
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    const tickerY = height - this.config.height;
    const tickerHeight = this.config.height;

    ctx.save();

    // Ticker Background Bar with Gradient & Backdrop Glow
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, tickerY, width, tickerHeight);

    // Top Neon Accent Border Line
    const borderGrad = ctx.createLinearGradient(0, tickerY, width, tickerY);
    borderGrad.addColorStop(0, 'rgba(0, 255, 102, 0.2)');
    borderGrad.addColorStop(0.3, this.config.highlightColor);
    borderGrad.addColorStop(0.7, '#00d2ff');
    borderGrad.addColorStop(1, 'rgba(0, 255, 102, 0.2)');
    
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, tickerY);
    ctx.lineTo(width, tickerY);
    ctx.stroke();

    // Setup Text Font
    ctx.font = `600 ${this.config.fontSize}px "Inter", sans-serif`;
    ctx.textBaseline = 'middle';

    // Construct full ticker string
    const fullText = this.config.items.join(this.config.separator) + this.config.separator;
    const textWidth = ctx.measureText(fullText).width;
    this.totalWidth = Math.max(textWidth, width);

    // Update Offset based on speed
    this.offset += this.config.speed * 40 * delta;
    if (this.offset >= this.totalWidth) {
      this.offset = 0;
    }

    // Clip Region to Ticker Bar
    ctx.beginPath();
    ctx.rect(0, tickerY, width, tickerHeight);
    ctx.clip();

    // Render repeating text segments for seamless infinite scrolling
    const yCenter = tickerY + tickerHeight / 2 + 1;
    let startX = -this.offset;

    while (startX < width) {
      // Split items to highlight keywords or symbols
      let currentItemX = startX;
      for (const item of this.config.items) {
        ctx.fillStyle = this.config.textColor;
        ctx.fillText(item, currentItemX, yCenter);
        currentItemX += ctx.measureText(item).width;

        // Separator symbol in glowing matrix green
        ctx.fillStyle = this.config.highlightColor;
        ctx.fillText(this.config.separator, currentItemX, yCenter);
        currentItemX += ctx.measureText(this.config.separator).width;
      }
      startX += this.totalWidth;
    }

    // Left & Right subtle edge fade vignettes
    const leftFade = ctx.createLinearGradient(0, tickerY, 40, tickerY);
    leftFade.addColorStop(0, 'rgba(10, 14, 23, 1)');
    leftFade.addColorStop(1, 'rgba(10, 14, 23, 0)');
    ctx.fillStyle = leftFade;
    ctx.fillRect(0, tickerY, 40, tickerHeight);

    const rightFade = ctx.createLinearGradient(width - 40, tickerY, width, tickerY);
    rightFade.addColorStop(0, 'rgba(10, 14, 23, 0)');
    rightFade.addColorStop(1, 'rgba(10, 14, 23, 1)');
    ctx.fillStyle = rightFade;
    ctx.fillRect(width - 40, tickerY, 40, tickerHeight);

    ctx.restore();
  }
}
