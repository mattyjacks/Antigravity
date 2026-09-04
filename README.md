# 🚀 Antigravity — Next-Gen AI & WebXR Media Suite

**Antigravity** is a high-performance suite of interactive AI video plugins, cross-platform virtual camera tools, spatial 3D WebXR experiences, and custom client showcases built for **MattyJacks**.

---

## 🌟 Key Components

### 1. 🎬 `shotcut-vibeovideo` — OpenAI AI Studio for Shotcut Video Editor
A native AI plugin suite and standalone agentic companion for [Shotcut Video Editor](https://www.shotcut.org/).
- **Native Qt 6 QML Filter**: Integrated video overlay generator powered by OpenAI **GPT-5.6 Luna**, **DALL-E 3**, **Whisper**, and **TTS**.
- **Agentic AI Command Center & Dock**: Includes a Windows menu-dock button (`vibeoVideo`) positioned right next to Shotcut's top-of-screen **Help** menu.
- **🎖️ Commander Multi-Agent Swarm**: 5 specialized AI instances (`ScriptAgent`, `TimelineAgent`, `StylistAgent`, `AudioAgent`, `ReviewerAgent`) running concurrently under an orchestrating Commander AI.
- **🤝 Video Editor Collaboration Hub**: Export single-file action histories, ultra-lightweight project packs (`.zip`) with system links (`file:///...`) and NO heavy media for instant Discord/Slack sharing, or turnkey master archives.
- **⚡ 50+ Autonomous Video Manipulation Capabilities**: Physical video operations executed directly via FFmpeg & MLT XML (trimming, 9:16 vertical crop, silence detection, loudness normalization, audio ducking, speed ramping, color LUTs, transitions, etc.).
- **Whisper Subtitles & TTS Narration**: Auto-transcribes video speech to `.srt` subtitle tracks and generates studio-quality AI narration (`alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`).
- **Automated Installer**: 1-click install via `install.ps1` to `%LOCALAPPDATA%\Meltytech\Shotcut\extensions\filters\vibeo_video`.

### 2. 🎥 `cameraMod1` — Cross-Platform Virtual Camera Studio
A live presentation and streaming engine built with **Tauri 2.0 (Rust + WebGL + TypeScript)** for Windows, macOS, and Linux.
- **Real-Time AI Background Removal**: Hardware-accelerated person segmentation without a physical green screen.
- **Procedural Matrix Rain Engine**: Customizable falling matrix rain with Katakana, Hex, Binary, and MattyJacks brand glyphs, bloom glow, scanlines, and color palettes.
- **Matty Jacks Network Watermark & Marquee Ticker**: Animated glassmorphic presenter badge (`🟢 LIVE NETWORKING`) and continuous news marquee.
- **8-Second Demo Soundboard (Hotkeys 1-6)**: Triggerable high-impact showcase overlays with PiP, split-screen modes, audio chimes, and automatic timers.
- **Universal Borderless Stream Projector**: One-click output projector window readable by Zoom, Microsoft Teams, Google Meet, and OBS Studio.

### 3. 🌐 3D WebXR & Client Showcases
Interactive 3D spatial web experiences and custom brand web apps configured for high-performance delivery (glTF `.glb` models, nosniff headers, CORS via Vercel).
- **Client Demos**: `demoWally1`, `demoWally2`, `mattyjackslandscaping`, `panoramicplumbing`, `demoApr1`, `demoEst1`, `demoFair1`, `demoJustin1`, `demoKim1`, `demoRan1-5`, `demoRin1`, `demoSai1`, `demoSean1`, `demoZai1`.
- **OBS Studio Suite**: `OBSplug` integration utilities.

---

## 📁 Repository Structure

```
Antigravity/
├── shotcut-vibeovideo/          # OpenAI AI Studio & Native QML Filter for Shotcut
│   ├── filters/vibeo_video/     # QML UI, interactive VUI gizmo, and OpenAI API client
│   ├── companion/               # Whisper subtitle transcriber, TTS voiceover app & tools
│   │   ├── vibeo_agent_center.py# Agentic Command Center with Commander & Collab Hub
│   │   └── vibeo_tools.py       # 50+ video tools, Commander Swarm & Media Tracker
│   ├── SKILL.md                 # Full vibeoVideo AI capability & workflow documentation
│   ├── run_vibeo_command_center.bat  # Win32 top-dock launcher
│   └── install.ps1              # 1-Click Shotcut filter installer
├── cameraMod1/                  # Tauri 2.0 Virtual Camera Studio (Rust + WebGL)
│   ├── src-tauri/               # Native Rust core & IPC bridge
│   ├── src/                     # WebGL compositor, AI segmentation, Matrix rain
│   └── package.json             # Vite & Tauri development scripts
├── demoWally1/                  # Interactive 3D WebXR spatial application
├── mattyjackslandscaping/       # Modern web app showcase
├── panoramicplumbing/           # Interactive client showcase engine
├── OBSplug/                     # OBS Studio integration tools
└── vercel.json                  # Production header, CORS, and glTF 3D model asset config
```

---

## ⚡ Quick Start

### Shotcut vibeoVideo Plugin
```powershell
cd shotcut-vibeovideo
powershell -ExecutionPolicy Bypass -File .\install.ps1
```
*Then open Shotcut, select a clip, and add the **vibeoVideo** filter!*

### CameraMod1 Virtual Camera Studio
```bash
cd cameraMod1
npm install
npm run dev           # Web browser dev mode at http://localhost:1420
npm run tauri dev     # Native desktop app mode
```

---

## 🛠️ Technology Stack

- **Core & Desktop**: Rust (Tauri 2.0), Qt 6 QML, Python 3, Win32 / Native API Bridges
- **Frontend & Graphics**: TypeScript, WebGL, Vite, Canvas API, HTML5/CSS3 (Glassmorphism & Cyberpunk Design System)
- **AI Integrations**: OpenAI GPT-5.6 Luna, DALL-E 3, Whisper (`whisper-1`), Text-to-Speech (`tts-1` / `tts-1-hd`)
- **3D & Deployment**: Three.js, glTF / GLB 3D Asset Pipelines, Vercel

---

## 📄 License & Credits

Developed for **MattyJacks** / **Antigravity**. All rights reserved.
