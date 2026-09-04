import { VideoCompositor } from '../pipeline/compositor.js';

export function setupTickerControls(compositor: VideoCompositor): void {
  const tickerTextInput = document.getElementById('tickerTextInput') as HTMLTextAreaElement;
  const speedSlider = document.getElementById('tickerSpeed') as HTMLInputElement;
  const speedVal = document.getElementById('tickerSpeedVal') as HTMLElement;
  const fontSizeSlider = document.getElementById('tickerFontSize') as HTMLInputElement;
  const fontSizeVal = document.getElementById('tickerFontSizeVal') as HTMLElement;
  const addTagButtons = document.querySelectorAll('.ticker-quick-tag');

  if (tickerTextInput) {
    tickerTextInput.value = compositor.ticker.config.items.join('\n');
    tickerTextInput.addEventListener('input', () => {
      const lines = tickerTextInput.value.split('\n').map(l => l.trim()).filter(Boolean);
      compositor.ticker.setItems(lines.length > 0 ? lines : ['MATTY JACKS • Real-Time AI Camera Mod']);
    });
  }

  if (speedSlider && speedVal) {
    speedSlider.value = String(compositor.ticker.config.speed);
    speedVal.textContent = `${compositor.ticker.config.speed.toFixed(1)}x`;
    speedSlider.addEventListener('input', () => {
      const val = parseFloat(speedSlider.value);
      compositor.ticker.config.speed = val;
      speedVal.textContent = `${val.toFixed(1)}x`;
    });
  }

  if (fontSizeSlider && fontSizeVal) {
    fontSizeSlider.value = String(compositor.ticker.config.fontSize);
    fontSizeVal.textContent = `${compositor.ticker.config.fontSize}px`;
    fontSizeSlider.addEventListener('input', () => {
      const val = parseInt(fontSizeSlider.value);
      compositor.ticker.config.fontSize = val;
      fontSizeVal.textContent = `${val}px`;
    });
  }

  addTagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tagText = btn.getAttribute('data-tag');
      if (tagText && tickerTextInput) {
        const current = tickerTextInput.value.trim();
        tickerTextInput.value = current ? `${current}\n${tagText}` : tagText;
        const lines = tickerTextInput.value.split('\n').map(l => l.trim()).filter(Boolean);
        compositor.ticker.setItems(lines);
      }
    });
  });
}
