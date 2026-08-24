/**
 * CarryMe Dynamic Voice-to-Voice Engine
 * Powered by OpenAI Audio Speech API + Web Speech Recognition (STT) + Web Audio Canvas Spectrum
 */

export class VoiceTalkEngine {
  constructor() {
    this.recognition = null;
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.currentAudio = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.vizAnimId = null;
    this.vizCanvas = null;
    this.vizCtx = null;

    this.initSpeechRecognition();
  }

  // Check if browser supports Web Speech API STT
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  isSTTSupported() {
    return !!this.recognition;
  }

  // Start listening for user voice input
  startListening(onTranscript, onEnd) {
    if (!this.recognition) {
      console.warn("Speech Recognition not supported in this browser.");
      if (onEnd) onEnd(new Error("STT Not Supported"));
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.isListening = true;

    this.recognition.onspeechstart = () => {
      // Voice Barge-in Interruption: Stop AI speaking immediately if user begins talking!
      if (this.isSpeaking) {
        console.log("⚡ User speech detected! Interrupting AI voice...");
        this.stopSpeaking();
        if (typeof this.onInterruptCallback === 'function') {
          this.onInterruptCallback();
        }
      }
    };

    this.recognition.onresult = (event) => {
      // Double check barge-in interruption on result frame
      if (this.isSpeaking) {
        this.stopSpeaking();
        if (typeof this.onInterruptCallback === 'function') {
          this.onInterruptCallback();
        }
      }

      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (typeof onTranscript === 'function') {
        onTranscript(transcript, event.results[0].isFinal);
      }
    };

    this.recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
      this.isListening = false;
      if (typeof onEnd === 'function') onEnd(err);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (typeof onEnd === 'function') onEnd();
    };

    this.recognition.start();
    return true;
  }

  // Register callback for when user voice interrupts AI speech
  onInterrupt(callback) {
    if (typeof callback === 'function') {
      this.onInterruptCallback = callback;
    }
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Speak AI text using OpenAI TTS or Web Speech Synthesis fallback
  async speak(text, characterName = 'Default', onStart, onEnded) {
    // Stop previous audio if playing
    this.stopSpeaking();

    this.isSpeaking = true;
    if (typeof onStart === 'function') onStart();

    const ttsEndpoint = window.location.protocol === 'file:'
      ? 'http://localhost:3000/api/tts'
      : '/api/tts';

    try {
      const response = await fetch(ttsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, characterName })
      });

      const contentType = response.headers.get('content-type');

      if (response.ok && contentType && contentType.includes('audio/mpeg')) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);

        this.currentAudio = new Audio(audioUrl);
        this.setupAudioAnalyser(this.currentAudio);

        this.currentAudio.onended = () => {
          this.isSpeaking = false;
          if (typeof onEnded === 'function') onEnded();
        };

        this.currentAudio.onerror = (err) => {
          console.warn("Audio playback error, falling back to Web Speech:", err);
          this.fallbackWebSpeech(text, characterName, onEnded);
        };

        await this.currentAudio.play();
        return;
      } else {
        // Fallback to browser SpeechSynthesis
        this.fallbackWebSpeech(text, characterName, onEnded);
      }
    } catch (err) {
      console.warn("OpenAI TTS endpoint failed, using local browser Web Speech:", err);
      this.fallbackWebSpeech(text, characterName, onEnded);
    }
  }

  // Fallback using browser window.speechSynthesis
  fallbackWebSpeech(text, characterName, onEnded) {
    if (!('speechSynthesis' in window)) {
      this.isSpeaking = false;
      if (typeof onEnded === 'function') onEnded();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Custom voice tuning per character
    if (characterName === 'Aura_Jett') {
      utterance.pitch = 1.2;
      utterance.rate = 1.1;
    } else if (characterName === 'CozyCat') {
      utterance.pitch = 1.3;
      utterance.rate = 0.95;
    } else if (characterName === 'EldenSlayer') {
      utterance.pitch = 0.7;
      utterance.rate = 0.9;
    } else if (characterName === 'NukeTactics') {
      utterance.pitch = 0.8;
      utterance.rate = 1.05;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      if (typeof onEnded === 'function') onEnded();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (typeof onEnded === 'function') onEnded();
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  // Connect Audio Element to Web Audio API Analyser for canvas visualizer
  setupAudioAnalyser(audioElement) {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;

      this.source = this.audioCtx.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn("Could not attach audio analyzer:", e);
    }
  }

  // Start real-time audio spectrum canvas visualizer
  bindVisualizerCanvas(canvasElement) {
    this.vizCanvas = canvasElement;
    if (!canvasElement) return;

    this.vizCtx = canvasElement.getContext('2d');
    this.startVisualizerLoop();
  }

  startVisualizerLoop() {
    if (!this.vizCanvas || !this.vizCtx) return;

    const render = () => {
      const w = this.vizCanvas.width || 200;
      const h = this.vizCanvas.height || 40;
      this.vizCanvas.width = w;
      this.vizCanvas.height = h;

      this.vizCtx.clearRect(0, 0, w, h);

      if (this.analyser && (this.isSpeaking || this.isListening)) {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        const barWidth = (w / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h;

          const grad = this.vizCtx.createLinearGradient(0, h, 0, 0);
          grad.addColorStop(0, '#00f0ff');
          grad.addColorStop(1, '#ff007f');

          this.vizCtx.fillStyle = grad;
          this.vizCtx.fillRect(x, h - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }
      } else {
        // Draw idle pulse wave
        this.vizCtx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        this.vizCtx.lineWidth = 2;
        this.vizCtx.beginPath();
        const time = Date.now() * 0.003;
        for (let x = 0; x < w; x += 4) {
          const y = h / 2 + Math.sin(x * 0.05 + time) * (this.isSpeaking ? 12 : 3);
          if (x === 0) this.vizCtx.moveTo(x, y);
          else this.vizCtx.lineTo(x, y);
        }
        this.vizCtx.stroke();
      }

      this.vizAnimId = requestAnimationFrame(render);
    };

    render();
  }
}
