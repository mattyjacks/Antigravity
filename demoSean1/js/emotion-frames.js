/**
 * 256x256px Stop-Motion AI Emotion Frame Generator
 * Generates dynamic 256x256 pixel animated emotion reaction frames (stop-motion video effect)
 * for AI persona visual reactions.
 */

export class EmotionFrameGenerator {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Generates a 256x256px Data URL frame for a specific persona and emotion state
   * @param {Object} profile - Gamer persona object
   * @param {String} emotionStr - Emotion string (e.g. "Purging Heretics ⚔️", "Flustered 😳")
   * @param {Number} frameIndex - Current stop-motion step index (0-7)
   */
  generateFrame(profile, emotionStr = "Neutral 😊", frameIndex = 0) {
    const w = 256;
    const h = 256;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // 1. Background Cyber Glow Gradient based on profile theme color
    const themeColor = profile.color || '#00f0ff';
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 140);
    grad.addColorStop(0, '#101424');
    grad.addColorStop(0.7, '#070914');
    grad.addColorStop(1, '#020308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 2. Animated Background Cyber Grid (Stop-motion offset)
    ctx.strokeStyle = themeColor;
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 1;
    const offset = (frameIndex * 4) % 16;
    for (let x = offset; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = offset; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // 3. Emotion Aura Pulsing Ring (Stop-motion scaling)
    const scalePulse = 1.0 + Math.sin((frameIndex / 8) * Math.PI * 2) * 0.06;
    ctx.save();
    ctx.translate(128, 110);
    ctx.scale(scalePulse, scalePulse);

    ctx.shadowColor = themeColor;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4. Central Persona Avatar Symbol / Emoji / Text
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(profile.avatar || '🎮', 128, 110 + Math.sin(frameIndex) * 3);

    // 5. Emotion Particle Overlay (Hearts, Lightning, Embers, Coffee)
    this.drawEmotionParticles(ctx, emotionStr, frameIndex);

    // 6. Stop-Motion Cyber HUD Frame Border
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    // HUD Corner Accents
    const cornerLen = 14;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';

    // Top-Left Corner
    ctx.beginPath();
    ctx.moveTo(4, 4 + cornerLen); ctx.lineTo(4, 4); ctx.lineTo(4 + cornerLen, 4);
    ctx.stroke();
    // Top-Right Corner
    ctx.beginPath();
    ctx.moveTo(w - 4 - cornerLen, 4); ctx.lineTo(w - 4, 4); ctx.lineTo(w - 4, 4 + cornerLen);
    ctx.stroke();

    // 7. Bottom Emotion Status Banner Pill (256x256 badge)
    ctx.fillStyle = 'rgba(8, 10, 18, 0.9)';
    ctx.fillRect(16, h - 48, w - 32, 34);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, h - 48, w - 32, 34);

    ctx.font = 'bold 11px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(emotionStr.toUpperCase(), 128, h - 30);

    // Return 256x256 Data URL
    return this.canvas.toDataURL('image/png');
  }

  drawEmotionParticles(ctx, emotionStr, frameIndex) {
    const time = frameIndex * 0.4;
    
    if (emotionStr.includes('Purge') || emotionStr.includes('Heretics') || emotionStr.includes('Angry')) {
      // Fire Embers
      for (let i = 0; i < 6; i++) {
        const px = 60 + (i * 30 + time * 12) % 140;
        const py = 180 - ((i * 25 + time * 20) % 120);
        ctx.fillStyle = i % 2 === 0 ? '#ff3300' : '#ffd700';
        ctx.fillRect(px, py, 4, 4);
      }
    } else if (emotionStr.includes('Flustered') || emotionStr.includes('Love') || emotionStr.includes('Blush')) {
      // Floating Hearts
      ctx.font = '16px sans-serif';
      const hearts = ['💖', '✨', '💕'];
      for (let i = 0; i < 4; i++) {
        const hx = 50 + (i * 45 + Math.sin(time + i) * 10);
        const hy = 160 - ((time * 15 + i * 30) % 100);
        ctx.fillText(hearts[i % hearts.length], hx, hy);
      }
    } else if (emotionStr.includes('Hyped') || emotionStr.includes('Competitive')) {
      // Electric Sparks
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const sx = 50 + Math.random() * 150;
        const sy = 40 + Math.random() * 140;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (Math.random() - 0.5) * 20, sy + (Math.random() - 0.5) * 20);
        ctx.stroke();
      }
    }
  }

  /**
   * Starts a stop-motion 256x256 image sequence loop (8 fps) inside an <img> or <div> element
   * @param {HTMLElement} targetImgElem - Target HTML <img> element to update with 256x256 frames
   * @param {Object} profile - Gamer persona
   * @param {String} emotionStr - Emotion state
   */
  startStopMotionSequence(targetImgElem, profile, emotionStr = "Neutral 😊") {
    if (!targetImgElem) return;

    if (targetImgElem._stopMotionTimer) {
      clearInterval(targetImgElem._stopMotionTimer);
    }

    let frame = 0;
    const update = () => {
      const dataUrl = this.generateFrame(profile, emotionStr, frame);
      targetImgElem.src = dataUrl;
      frame = (frame + 1) % 8;
    };

    update();
    targetImgElem._stopMotionTimer = setInterval(update, 125); // 8 FPS Stop-Motion Video Feel!
  }

  stopSequence(targetImgElem) {
    if (targetImgElem && targetImgElem._stopMotionTimer) {
      clearInterval(targetImgElem._stopMotionTimer);
      targetImgElem._stopMotionTimer = null;
    }
  }
}

export const emotionFrameGen = new EmotionFrameGenerator();
