import { VideoCompositor } from '../pipeline/compositor.js';

export async function setupDeviceControls(compositor: VideoCompositor): Promise<void> {
  const cameraSelect = document.getElementById('cameraDeviceSelect') as HTMLSelectElement;
  const resSelect = document.getElementById('resSelect') as HTMLSelectElement;
  const aiMatteToggle = document.getElementById('aiMatteToggle') as HTMLInputElement;
  const flipToggle = document.getElementById('flipCameraToggle') as HTMLInputElement;
  const edgeGlowToggle = document.getElementById('edgeGlowToggle') as HTMLInputElement;
  const glowColorSelect = document.getElementById('edgeGlowColor') as HTMLSelectElement;

  const btnOpenProjector = document.getElementById('btnOpenProjector') as HTMLButtonElement;
  const vcamStatusText = document.getElementById('vcamStatusText') as HTMLElement;
  const vcamGuideText = document.getElementById('vcamGuideText') as HTMLElement;

  // Populate cameras
  if (cameraSelect) {
    const cameras = await compositor.cameraInput.getAvailableCameras();
    cameraSelect.innerHTML = '';
    cameras.forEach(cam => {
      const opt = document.createElement('option');
      opt.value = cam.deviceId;
      opt.textContent = cam.label;
      cameraSelect.appendChild(opt);
    });

    cameraSelect.addEventListener('change', async () => {
      await compositor.cameraInput.startCamera(cameraSelect.value, compositor.width, compositor.height);
    });

    // Start initial camera stream
    if (cameras.length > 0) {
      await compositor.cameraInput.startCamera(cameras[0].deviceId, compositor.width, compositor.height);
    }
  }

  // Resolution
  if (resSelect) {
    resSelect.value = `${compositor.width}x${compositor.height}`;
    resSelect.addEventListener('change', async () => {
      const [w, h] = resSelect.value.split('x').map(Number);
      compositor.setResolution(w, h);
      await compositor.cameraInput.startCamera(cameraSelect?.value, w, h);
    });
  }

  // AI Matte Toggles
  if (aiMatteToggle) {
    aiMatteToggle.checked = compositor.layers.aiMatte;
    aiMatteToggle.addEventListener('change', () => {
      compositor.layers.aiMatte = aiMatteToggle.checked;
    });
  }

  if (flipToggle) {
    flipToggle.checked = compositor.segmenter.config.flipHorizontal;
    flipToggle.addEventListener('change', () => {
      compositor.segmenter.config.flipHorizontal = flipToggle.checked;
    });
  }

  const shapeSelect = document.getElementById('matteShapeSelect') as HTMLSelectElement;
  const scaleSlider = document.getElementById('matteScale') as HTMLInputElement;
  const scaleVal = document.getElementById('matteScaleVal') as HTMLElement;
  const offsetSlider = document.getElementById('matteOffsetY') as HTMLInputElement;
  const offsetVal = document.getElementById('matteOffsetYVal') as HTMLElement;

  if (shapeSelect) {
    shapeSelect.value = compositor.segmenter.config.shapeMode;
    shapeSelect.addEventListener('change', () => {
      compositor.segmenter.config.shapeMode = shapeSelect.value as any;
    });
  }

  if (scaleSlider && scaleVal) {
    scaleSlider.value = String(compositor.segmenter.config.scale);
    scaleVal.textContent = `${compositor.segmenter.config.scale.toFixed(2)}x`;
    scaleSlider.addEventListener('input', () => {
      const val = parseFloat(scaleSlider.value);
      compositor.segmenter.config.scale = val;
      scaleVal.textContent = `${val.toFixed(2)}x`;
    });
  }

  if (offsetSlider && offsetVal) {
    offsetSlider.value = String(compositor.segmenter.config.offsetY);
    offsetVal.textContent = `${compositor.segmenter.config.offsetY}px`;
    offsetSlider.addEventListener('input', () => {
      const val = parseInt(offsetSlider.value);
      compositor.segmenter.config.offsetY = val;
      offsetVal.textContent = `${val}px`;
    });
  }

  if (edgeGlowToggle) {
    edgeGlowToggle.checked = compositor.segmenter.config.edgeGlow;
    edgeGlowToggle.addEventListener('change', () => {
      compositor.segmenter.config.edgeGlow = edgeGlowToggle.checked;
    });
  }

  if (glowColorSelect) {
    glowColorSelect.value = compositor.segmenter.config.edgeGlowColor;
    glowColorSelect.addEventListener('change', () => {
      compositor.segmenter.config.edgeGlowColor = glowColorSelect.value;
    });
  }

  // Check Tauri VCam Status if running in Tauri
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const status: any = await invoke('get_vcam_status');
    if (vcamStatusText && status) {
      vcamStatusText.textContent = status.is_virtual_cam_installed 
        ? `🟢 ${status.driver_name} (Ready)`
        : `🟡 ${status.driver_name}`;
    }
    if (vcamGuideText && status) {
      vcamGuideText.textContent = status.installation_guide;
    }
  } catch {
    if (vcamStatusText) {
      vcamStatusText.textContent = `🟢 WebRTC / Window Projector Mode Active`;
    }
    if (vcamGuideText) {
      vcamGuideText.textContent = `You can share the Studio Projector Window or stream directly to Zoom, Meet, Teams, or OBS!`;
    }
  }

  // Launch Projector Window
  if (btnOpenProjector) {
    btnOpenProjector.addEventListener('click', async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('open_projector_window');
      } catch {
        // Fallback: open popup browser window for stream projection
        const projWin = window.open('projector.html', 'MattyJacksProjector', 'width=1280,height=720,menubar=no,toolbar=no');
        if (projWin) projWin.focus();
      }
    });
  }
}
