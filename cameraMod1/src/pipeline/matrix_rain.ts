export interface MatrixConfig {
  color: string;
  glowColor: string;
  speed: number;
  density: number;
  fontSize: number;
  trailDecay: number;
  glowIntensity: number;
  charSet: 'katakana' | 'binary' | 'hex' | 'mattyjacks' | 'matrix';
  scanlines: boolean;
  scanlineOpacity: number;
}

export const DEFAULT_MATRIX_CONFIG: MatrixConfig = {
  color: '#00ff66',
  glowColor: 'rgba(0, 255, 102, 0.8)',
  speed: 1.0,
  density: 1.0,
  fontSize: 18,
  trailDecay: 0.08,
  glowIntensity: 12,
  charSet: 'katakana',
  scanlines: true,
  scanlineOpacity: 0.15,
};

export class MatrixRainEngine {
  public config: MatrixConfig;
  private columns: number[] = [];
  private columnChars: string[][] = [];
  private columnSpeeds: number[] = [];
  private width = 1280;
  private height = 720;
  private lastUpdate = 0;

  private charSets = {
    katakana: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ1234567890@#$%&*+-/<>',
    matrix: '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ1234567890:・."=*+-<>¦｜',
    binary: '0101010100110011',
    hex: '0123456789ABCDEF',
    mattyjacks: 'MATTYJACKS0123456789AI_ENGINEERING_TAURI_RUST_WEBGL',
  };

  constructor(config: Partial<MatrixConfig> = {}) {
    this.config = { ...DEFAULT_MATRIX_CONFIG, ...config };
  }

  public resize(width: number, height: number): void {
    if (this.width === width && this.height === height && this.columns.length > 0) return;
    this.width = width;
    this.height = height;

    const columnCount = Math.floor(width / (this.config.fontSize * 0.9));
    this.columns = [];
    this.columnChars = [];
    this.columnSpeeds = [];

    for (let i = 0; i < columnCount; i++) {
      this.columns[i] = Math.floor(Math.random() * -50); // Start staggered above screen
      this.columnSpeeds[i] = 0.5 + Math.random() * 1.5;
      this.columnChars[i] = [];
    }
  }

  private getRandomChar(): string {
    const chars = this.charSets[this.config.charSet] || this.charSets.katakana;
    return chars[Math.floor(Math.random() * chars.length)];
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, now: number): void {
    this.resize(width, height);

    // Trail fade effect
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.04, this.config.trailDecay)})`;
    ctx.fillRect(0, 0, width, height);

    const fontSize = this.config.fontSize;
    ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';

    const numCols = this.columns.length;
    const densityStep = Math.max(1, Math.round(1 / this.config.density));

    for (let i = 0; i < numCols; i += densityStep) {
      const x = i * (fontSize * 0.9) + fontSize * 0.5;
      const y = this.columns[i] * fontSize;
      const char = this.getRandomChar();

      if (y > 0 && y < height + fontSize * 2) {
        // Leading drop is ultra-bright white with strong glow
        ctx.shadowBlur = this.config.glowIntensity;
        ctx.shadowColor = this.config.color;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(char, x, y);

        // Previous character is bright theme color
        if (this.columns[i] > 1) {
          const prevChar = this.columnChars[i]?.[0] || this.getRandomChar();
          ctx.fillStyle = this.config.color;
          ctx.fillText(prevChar, x, y - fontSize);
        }

        ctx.shadowBlur = 0;
      }

      // Track character history for trail consistency
      if (!this.columnChars[i]) this.columnChars[i] = [];
      this.columnChars[i].unshift(char);
      if (this.columnChars[i].length > 10) this.columnChars[i].pop();

      // Drop advance
      this.columns[i] += this.columnSpeeds[i] * this.config.speed * 0.45;

      // Reset when drop leaves screen bottom with randomized delay
      if (this.columns[i] * fontSize > height && Math.random() > 0.96) {
        this.columns[i] = 0;
        this.columnSpeeds[i] = 0.6 + Math.random() * 1.4;
      }
    }

    // Optional CRT scanlines
    if (this.config.scanlines && this.config.scanlineOpacity > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.config.scanlineOpacity})`;
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }
    }
  }
}
