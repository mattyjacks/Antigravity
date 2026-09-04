import { VideoCompositor } from './pipeline/compositor.js';
import { setupMatrixControls } from './components/MatrixControls.js';
import { setupWatermarkControls } from './components/WatermarkControls.js';
import { setupTickerControls } from './components/TickerControls.js';
import { setupDemoDeckControls } from './components/DemoDeckControls.js';
import { setupDeviceControls } from './components/DeviceControls.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('compositorCanvas') as HTMLCanvasElement;
  if (!canvas) return;

  const compositor = new VideoCompositor(canvas);
  compositor.start();

  // Initialize UI controls
  setupMatrixControls(compositor);
  setupWatermarkControls(compositor);
  setupTickerControls(compositor);
  setupDemoDeckControls(compositor);
  await setupDeviceControls(compositor);

  // Tab Navigation Handling
  const tabButtons = document.querySelectorAll('.tab-nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      if (!targetId) return;

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Monitor Layer Toggle Buttons
  const layerButtons = document.querySelectorAll('.layer-btn');
  layerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const layerKey = btn.getAttribute('data-layer') as keyof typeof compositor.layers;
      if (layerKey && layerKey in compositor.layers) {
        compositor.layers[layerKey] = !compositor.layers[layerKey];
        btn.classList.toggle('active', compositor.layers[layerKey]);
      }
    });
  });

  // HUD Metrics live updater
  const hudFps = document.getElementById('hudFps');
  const hudRes = document.getElementById('hudRes');
  const hudLatency = document.getElementById('hudLatency');
  const headerStatus = document.getElementById('headerStatusText');

  function updateHUD() {
    if (hudFps) hudFps.textContent = `${compositor.currentFps} FPS`;
    if (hudRes) hudRes.textContent = `${compositor.width}x${compositor.height}`;
    if (hudLatency) hudLatency.textContent = `${compositor.frameLatencyMs.toFixed(1)} ms`;
    if (headerStatus) {
      headerStatus.textContent = `LIVE 60FPS • ${compositor.matrixEngine.config.charSet.toUpperCase()} MATRIX • MATTE ACTIVE`;
    }
    requestAnimationFrame(updateHUD);
  }
  requestAnimationFrame(updateHUD);

  // Broadcast composited frames to Projector Window via BroadcastChannel
  const broadcast = new BroadcastChannel('mattyjacks_stream');
  let lastBroadcast = 0;

  function broadcastLoop() {
    const now = performance.now();
    if (now - lastBroadcast >= 33) { // ~30-60 fps sync
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        broadcast.postMessage({ type: 'frame', dataUrl });
      } catch {}
      lastBroadcast = now;
    }
    requestAnimationFrame(broadcastLoop);
  }
  requestAnimationFrame(broadcastLoop);

  // Expose compositor globally for debug/scripts
  (window as any).__COMPOSITOR__ = compositor;
});
