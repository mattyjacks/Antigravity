export interface VideoDeviceInfo {
  deviceId: string;
  label: string;
}

export class CameraInputManager {
  public videoElement: HTMLVideoElement;
  public activeStream: MediaStream | null = null;
  public isUsingTestPattern = false;
  private testPatternCanvas: HTMLCanvasElement;
  private testPatternCtx: CanvasRenderingContext2D;

  constructor() {
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;

    this.testPatternCanvas = document.createElement('canvas');
    this.testPatternCanvas.width = 1280;
    this.testPatternCanvas.height = 720;
    this.testPatternCtx = this.testPatternCanvas.getContext('2d')!;
  }

  public async getAvailableCameras(): Promise<VideoDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [{ deviceId: 'test-pattern', label: 'Virtual Camera Test Pattern' }];
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));

      videoDevices.push({ deviceId: 'test-pattern', label: 'Synthetic Presenter Test Stream' });
      return videoDevices;
    } catch {
      return [{ deviceId: 'test-pattern', label: 'Synthetic Presenter Test Stream' }];
    }
  }

  public async startCamera(deviceId?: string, width = 1280, height = 720): Promise<boolean> {
    this.stopCamera();

    if (deviceId === 'test-pattern' || !navigator.mediaDevices?.getUserMedia) {
      this.isUsingTestPattern = true;
      return true;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: 60, min: 30 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.activeStream = stream;
      this.videoElement.srcObject = stream;
      await this.videoElement.play();
      this.isUsingTestPattern = false;
      return true;
    } catch (err) {
      console.warn("Could not access physical camera, activating synthetic presenter stream:", err);
      this.isUsingTestPattern = true;
      return true;
    }
  }

  public stopCamera(): void {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(t => t.stop());
      this.activeStream = null;
    }
    this.videoElement.srcObject = null;
  }

  public getVideoSource(now: number): CanvasImageSource {
    if (!this.isUsingTestPattern && this.videoElement.readyState >= 2) {
      return this.videoElement;
    }

    // Render Synthetic Presenter Stream
    const ctx = this.testPatternCtx;
    const w = this.testPatternCanvas.width;
    const h = this.testPatternCanvas.height;
    const t = now / 1000;

    // Dark Studio Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Subtle presenter silhouette
    const cx = w / 2 + Math.sin(t * 0.5) * 15;
    const cy = h / 2 + Math.cos(t * 0.8) * 8;

    // Studio backlight glow
    const glowGrad = ctx.createRadialGradient(cx, cy - 60, 20, cx, cy - 60, 300);
    glowGrad.addColorStop(0, 'rgba(0, 210, 255, 0.4)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // Presenter Silhouette Body
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 180, 220, 160, 0, 0, Math.PI * 2);
    ctx.fill();

    // Presenter Head
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(cx, cy - 50, 90, 0, Math.PI * 2);
    ctx.fill();

    // Presenter Face highlights / headset
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy - 50, 95, Math.PI * 0.9, Math.PI * 1.8);
    ctx.stroke();

    // Microphone Boom
    ctx.beginPath();
    ctx.moveTo(cx - 95, cy - 30);
    ctx.lineTo(cx - 30, cy + 10);
    ctx.stroke();

    // On-air indicator
    ctx.fillStyle = '#f87171';
    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillText('🔴 SYNTHETIC PRESENTER ACTIVE (NO HARDWARE WEBCAM)', 40, 60);

    return this.testPatternCanvas;
  }
}
