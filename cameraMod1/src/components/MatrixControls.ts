import { VideoCompositor } from '../pipeline/compositor.js';

export function setupMatrixControls(compositor: VideoCompositor): void {
  const charSetSelect = document.getElementById('matrixCharSet') as HTMLSelectElement;
  const speedSlider = document.getElementById('matrixSpeed') as HTMLInputElement;
  const speedVal = document.getElementById('matrixSpeedVal') as HTMLElement;
  const densitySlider = document.getElementById('matrixDensity') as HTMLInputElement;
  const densityVal = document.getElementById('matrixDensityVal') as HTMLElement;
  const fontSizeSlider = document.getElementById('matrixFontSize') as HTMLInputElement;
  const fontSizeVal = document.getElementById('matrixFontSizeVal') as HTMLElement;
  const glowSlider = document.getElementById('matrixGlow') as HTMLInputElement;
  const glowVal = document.getElementById('matrixGlowVal') as HTMLElement;
  const scanlinesToggle = document.getElementById('matrixScanlines') as HTMLInputElement;

  if (charSetSelect) {
    charSetSelect.value = compositor.matrixEngine.config.charSet;
    charSetSelect.addEventListener('change', () => {
      compositor.matrixEngine.config.charSet = charSetSelect.value as any;
    });
  }

  if (speedSlider && speedVal) {
    speedSlider.value = String(compositor.matrixEngine.config.speed);
    speedVal.textContent = `${compositor.matrixEngine.config.speed.toFixed(1)}x`;
    speedSlider.addEventListener('input', () => {
      const val = parseFloat(speedSlider.value);
      compositor.matrixEngine.config.speed = val;
      speedVal.textContent = `${val.toFixed(1)}x`;
    });
  }

  if (densitySlider && densityVal) {
    densitySlider.value = String(compositor.matrixEngine.config.density);
    densityVal.textContent = `${compositor.matrixEngine.config.density.toFixed(1)}x`;
    densitySlider.addEventListener('input', () => {
      const val = parseFloat(densitySlider.value);
      compositor.matrixEngine.config.density = val;
      densityVal.textContent = `${val.toFixed(1)}x`;
      compositor.matrixEngine.resize(compositor.width, compositor.height);
    });
  }

  if (fontSizeSlider && fontSizeVal) {
    fontSizeSlider.value = String(compositor.matrixEngine.config.fontSize);
    fontSizeVal.textContent = `${compositor.matrixEngine.config.fontSize}px`;
    fontSizeSlider.addEventListener('input', () => {
      const val = parseInt(fontSizeSlider.value);
      compositor.matrixEngine.config.fontSize = val;
      fontSizeVal.textContent = `${val}px`;
      compositor.matrixEngine.resize(compositor.width, compositor.height);
    });
  }

  if (glowSlider && glowVal) {
    glowSlider.value = String(compositor.matrixEngine.config.glowIntensity);
    glowVal.textContent = `${compositor.matrixEngine.config.glowIntensity}px`;
    glowSlider.addEventListener('input', () => {
      const val = parseInt(glowSlider.value);
      compositor.matrixEngine.config.glowIntensity = val;
      glowVal.textContent = `${val}px`;
    });
  }

  if (scanlinesToggle) {
    scanlinesToggle.checked = compositor.matrixEngine.config.scanlines;
    scanlinesToggle.addEventListener('change', () => {
      compositor.matrixEngine.config.scanlines = scanlinesToggle.checked;
    });
  }

  // Color Swatch Buttons
  const colorSwatches = document.querySelectorAll('.matrix-color-swatch');
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.getAttribute('data-color') || '#00ff66';
      compositor.matrixEngine.config.color = color;
      compositor.matrixEngine.config.glowColor = color;
      
      colorSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });
}
