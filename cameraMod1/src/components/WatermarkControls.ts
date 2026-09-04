import { VideoCompositor } from '../pipeline/compositor.js';

export function setupWatermarkControls(compositor: VideoCompositor): void {
  const nameInput = document.getElementById('wmName') as HTMLInputElement;
  const roleInput = document.getElementById('wmRole') as HTMLInputElement;
  const statusInput = document.getElementById('wmStatus') as HTMLInputElement;
  const positionSelect = document.getElementById('wmPosition') as HTMLSelectElement;
  const scaleSlider = document.getElementById('wmScale') as HTMLInputElement;
  const scaleVal = document.getElementById('wmScaleVal') as HTMLElement;
  const opacitySlider = document.getElementById('wmOpacity') as HTMLInputElement;
  const opacityVal = document.getElementById('wmOpacityVal') as HTMLElement;

  if (nameInput) {
    nameInput.value = compositor.watermark.config.name;
    nameInput.addEventListener('input', () => {
      compositor.watermark.config.name = nameInput.value || 'MATTY JACKS';
    });
  }

  if (roleInput) {
    roleInput.value = compositor.watermark.config.role;
    roleInput.addEventListener('input', () => {
      compositor.watermark.config.role = roleInput.value;
    });
  }

  if (statusInput) {
    statusInput.value = compositor.watermark.config.statusBadge;
    statusInput.addEventListener('input', () => {
      compositor.watermark.config.statusBadge = statusInput.value;
    });
  }

  if (positionSelect) {
    positionSelect.value = compositor.watermark.config.position;
    positionSelect.addEventListener('change', () => {
      compositor.watermark.config.position = positionSelect.value as any;
    });
  }

  if (scaleSlider && scaleVal) {
    scaleSlider.value = String(compositor.watermark.config.scale);
    scaleVal.textContent = `${compositor.watermark.config.scale.toFixed(1)}x`;
    scaleSlider.addEventListener('input', () => {
      const val = parseFloat(scaleSlider.value);
      compositor.watermark.config.scale = val;
      scaleVal.textContent = `${val.toFixed(1)}x`;
    });
  }

  if (opacitySlider && opacityVal) {
    opacitySlider.value = String(compositor.watermark.config.cardOpacity);
    opacityVal.textContent = `${Math.round(compositor.watermark.config.cardOpacity * 100)}%`;
    opacitySlider.addEventListener('input', () => {
      const val = parseFloat(opacitySlider.value);
      compositor.watermark.config.cardOpacity = val;
      opacityVal.textContent = `${Math.round(val * 100)}%`;
    });
  }
}
