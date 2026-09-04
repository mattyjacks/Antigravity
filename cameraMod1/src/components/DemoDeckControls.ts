import { VideoCompositor } from '../pipeline/compositor.js';

export function setupDemoDeckControls(compositor: VideoCompositor): void {
  const gridContainer = document.getElementById('demoButtonsGrid');
  const soundToggle = document.getElementById('demoSoundToggle') as HTMLInputElement;
  const modeSelect = document.getElementById('demoDisplayMode') as HTMLSelectElement;

  if (soundToggle) {
    soundToggle.checked = compositor.demoDeck.soundEnabled;
    soundToggle.addEventListener('change', () => {
      compositor.demoDeck.soundEnabled = soundToggle.checked;
    });
  }

  if (modeSelect) {
    modeSelect.value = compositor.demoDeck.displayMode;
    modeSelect.addEventListener('change', () => {
      compositor.demoDeck.displayMode = modeSelect.value as any;
    });
  }

  if (gridContainer) {
    gridContainer.innerHTML = '';

    compositor.demoDeck.demos.forEach((demo, index) => {
      const hotkey = index + 1;
      const btn = document.createElement('div');
      btn.className = 'demo-card-btn';
      btn.id = `demo-btn-${demo.id}`;
      btn.innerHTML = `
        <div class="demo-btn-top">
          <span class="demo-category-tag">${demo.category}</span>
          <span class="demo-key-badge">KEY ${hotkey}</span>
        </div>
        <div class="demo-title">${demo.title}</div>
        <div class="demo-progress-bar" id="pbar-${demo.id}"></div>
      `;

      btn.addEventListener('click', () => {
        if (compositor.demoDeck.activeDemo?.id === demo.id) {
          compositor.demoDeck.stopDemo();
        } else {
          compositor.demoDeck.triggerDemo(demo.id);
        }
      });

      gridContainer.appendChild(btn);
    });
  }

  // Global Hotkey Listener (Keys 1-6)
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    const num = parseInt(e.key);
    if (!isNaN(num) && num >= 1 && num <= compositor.demoDeck.demos.length) {
      const demo = compositor.demoDeck.demos[num - 1];
      if (demo) {
        if (compositor.demoDeck.activeDemo?.id === demo.id) {
          compositor.demoDeck.stopDemo();
        } else {
          compositor.demoDeck.triggerDemo(demo.id);
        }
      }
    }
  });

  // Animation frame updater for button UI active states and progress bars
  function updateDemoUI() {
    const activeDemo = compositor.demoDeck.activeDemo;
    const now = performance.now();
    const { percent } = compositor.demoDeck.getProgress(now);

    compositor.demoDeck.demos.forEach(d => {
      const btn = document.getElementById(`demo-btn-${d.id}`);
      const pbar = document.getElementById(`pbar-${d.id}`);
      if (!btn || !pbar) return;

      if (activeDemo && activeDemo.id === d.id) {
        btn.classList.add('active-playing');
        pbar.style.width = `${100 - percent}%`;
      } else {
        btn.classList.remove('active-playing');
        pbar.style.width = '0%';
      }
    });

    requestAnimationFrame(updateDemoUI);
  }

  requestAnimationFrame(updateDemoUI);
}
