export interface WatermarkConfig {
  enabled: boolean;
  name: string;
  role: string;
  statusBadge: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showQr: boolean;
  qrUrl: string;
  glowColor: string;
  cardOpacity: number;
  scale: number;
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true,
  name: "MATTY JACKS",
  role: "AI & Full-Stack Systems Specialist",
  statusBadge: "🟢 LIVE NETWORKING",
  position: "top-right",
  showQr: true,
  qrUrl: "https://mattyjacks.com",
  glowColor: "#00ff66",
  cardOpacity: 0.9,
  scale: 1.0,
};

export class WatermarkOverlay {
  public config: WatermarkConfig;
  private logoImage: HTMLImageElement | null = null;
  private pulsePhase = 0;

  constructor(config: Partial<WatermarkConfig> = {}) {
    this.config = { ...DEFAULT_WATERMARK_CONFIG, ...config };
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, now: number): void {
    if (!this.config.enabled) return;

    this.pulsePhase = (now % 3000) / 3000;
    const pulseScale = 1 + Math.sin(this.pulsePhase * Math.PI * 2) * 0.03;

    const scale = this.config.scale;
    const cardWidth = 320 * scale;
    const cardHeight = 78 * scale;
    const padding = 24;

    let x = width - cardWidth - padding;
    let y = padding;

    if (this.config.position === 'top-left') {
      x = padding;
      y = padding;
    } else if (this.config.position === 'bottom-right') {
      x = width - cardWidth - padding;
      y = height - cardHeight - padding - 60; // Leave room for ticker
    } else if (this.config.position === 'bottom-left') {
      x = padding;
      y = height - cardHeight - padding - 60;
    }

    ctx.save();

    // Subtle Glassmorphism Card Background
    ctx.shadowColor = this.config.glowColor;
    ctx.shadowBlur = 15;
    ctx.fillStyle = `rgba(10, 14, 23, ${this.config.cardOpacity})`;
    
    // Draw Rounded Card
    const r = 10 * scale;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + cardWidth - r, y);
    ctx.quadraticCurveTo(x + cardWidth, y, x + cardWidth, y + r);
    ctx.lineTo(x + cardWidth, y + cardHeight - r);
    ctx.quadraticCurveTo(x + cardWidth, y + cardHeight, x + cardWidth - r, y + cardHeight);
    ctx.lineTo(x + r, y + cardHeight);
    ctx.quadraticCurveTo(x, y + cardHeight, x, y + cardHeight - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // Card Border with Neon Glow Gradient
    const borderGrad = ctx.createLinearGradient(x, y, x + cardWidth, y + cardHeight);
    borderGrad.addColorStop(0, this.config.glowColor);
    borderGrad.addColorStop(0.5, '#00d2ff');
    borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Brand Logo Icon Badge
    const iconSize = 46 * scale;
    const iconX = x + 16 * scale;
    const iconY = y + 16 * scale;

    const iconGrad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize);
    iconGrad.addColorStop(0, this.config.glowColor);
    iconGrad.addColorStop(1, '#00d2ff');
    ctx.fillStyle = iconGrad;
    
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, 8 * scale);
    ctx.fill();

    // Logo Text "MJ" inside icon
    ctx.fillStyle = '#000000';
    ctx.font = `900 ${22 * scale}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MJ', iconX + iconSize / 2, iconY + iconSize / 2 + 1);

    // Presenter Brand Name
    const textStartX = iconX + iconSize + 14 * scale;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `800 ${16 * scale}px "Inter", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.config.name, textStartX, y + 27 * scale);

    // Presenter Subtitle / Role
    ctx.font = `500 ${11 * scale}px "Inter", sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(this.config.role, textStartX, y + 44 * scale);

    // Live Status Pill Background
    const pillY = y + 51 * scale;
    const pillH = 18 * scale;
    const statusText = this.config.statusBadge.replace(/^[🟢🔴🟡⚡]\s*/, '');
    ctx.font = `700 ${9.5 * scale}px "JetBrains Mono", monospace`;
    const pillTextW = ctx.measureText(statusText).width;
    const pillW = pillTextW + 28 * scale;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.strokeStyle = this.config.glowColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(textStartX, pillY, pillW, pillH, 9 * scale);
    ctx.fill();
    ctx.stroke();

    // Status beacon dot inside pill
    const beaconX = textStartX + 9 * scale;
    const beaconY = pillY + pillH / 2;
    ctx.fillStyle = this.config.glowColor;
    ctx.shadowColor = this.config.glowColor;
    ctx.shadowBlur = 8 * pulseScale;
    ctx.beginPath();
    ctx.arc(beaconX, beaconY, 3.5 * pulseScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Status pill text
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusText, textStartX + 18 * scale, beaconY);

    // Pulsing Beacon in Card Corner
    const dotX = x + cardWidth - 18 * scale;
    const dotY = y + 18 * scale;
    ctx.fillStyle = this.config.glowColor;
    ctx.shadowColor = this.config.glowColor;
    ctx.shadowBlur = 10 * pulseScale;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
