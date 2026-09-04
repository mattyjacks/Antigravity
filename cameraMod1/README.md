# Matty Jacks CameraMod1 - Cross-Platform Virtual Camera Studio

A desktop virtual camera and live networking presentation engine built with **Tauri 2.0 (Rust + WebGL + TypeScript)**. It takes webcam input, performs real-time AI background removal (green-screen-less segmentation), composites an adjustable Matrix digital rain background, overlays Matty Jacks networking branding, displays a live scrolling ticker, and allows instant 8-second interactive demo video showcases.

Targeted for **Windows, macOS, and Ubuntu Linux**.

---

## Key Features

1. **Procedural Matrix Digital Rain Engine (Adjustable)**
   - **Character Sets**: Japanese Katakana, Movie Matrix Cipher, Matty Jacks Custom Brand text, Binary (`0101`), and Hexadecimal (`0-F`).
   - **Color Themes**: Classic Cyber Green (`#00ff66`), Cyber Cyan (`#00d2ff`), Amber Gold (`#ffb800`), Synthwave Purple (`#b026ff`), and Crimson Red (`#ff2a5f`).
   - **Live Adjustments**: Rain Fall Speed, Column Density, Glyph Font Size, Phosphor Glow / Bloom Intensity, Trail Decay, and CRT Scanlines.

2. **Real-time AI Background Removal (Zero Physical Green-Screen)**
   - Hardware-accelerated person matte segmentation at 60 FPS.
   - Customizable edge feathering and Cyberpunk edge glow aura around presenter silhouette.
   - Synthetic presenter test stream fallback for headless / development environments.

3. **Matty Jacks Networking Watermark & Brand Badge**
   - Glassmorphic presenter card with animated live beacon (`🟢 LIVE NETWORKING`).
   - Customizable name, professional title, position presets (Top-Right, Top-Left, Bottom-Right, Bottom-Left), and opacity.

4. **Live Scrolling News Ticker**
   - Smooth horizontal marquee displaying elevator pitches, skill sets, and contact announcements.
   - One-click skill preset tags and customizable scroll speed.

5. **8-Second Interactive Demo Action Deck (Soundboard & Hotkeys 1-6)**
   - Triggerable 8-second high-impact showcase animations or custom MP4 videos.
   - Hotkeys `1` through `6` for instant live demos during networking conversations.
   - Real-time countdown progress bar, auto-dismiss, and Web Audio synthesizer chimes.
   - Picture-in-Picture (PiP) and Split-Screen layout modes.

6. **Cross-Platform Virtual Camera Output & Projector**
   - Direct integration with OS Virtual Camera drivers:
     - **Windows**: DirectShow / MediaFoundation virtual camera sink (`akvcam` / `v4l2loopback-win` / OBS Virtual Cam filter).
     - **macOS**: CoreMediaIO DAL plugin (`CMIOExtension`).
     - **Ubuntu Linux**: `v4l2loopback` kernel module (`/dev/videoX`).
   - **Universal Output Projector**: One-click borderless output window that can be shared or captured in Zoom, Teams, Meet, or OBS without driver installations.

---

## Project Structure

```
cameraMod1/
├── src-tauri/                     # Tauri 2.0 Rust Core
│   ├── Cargo.toml                 # Rust dependencies
│   ├── tauri.conf.json            # Tauri multi-platform configuration
│   ├── build.rs                   # Tauri build script
│   └── src/
│       ├── main.rs                # Desktop binary entry point
│       ├── lib.rs                 # Tauri IPC command handlers
│       ├── vcam.rs                # Virtual camera loopback driver interface
│       └── demos.rs               # Demo showcase library management
├── src/                           # Studio Frontend (TypeScript + CSS3)
│   ├── index.html                 # Main Studio GUI layout
│   ├── projector.html             # Dedicated borderless stream projector
│   ├── main.ts                    # Main orchestrator
│   ├── styles/
│   │   └── main.css               # Cyberpunk glassmorphism design system
│   ├── pipeline/
│   │   ├── compositor.ts          # 60 FPS multi-layer video compositor
│   │   ├── camera_input.ts        # Webcam capture & synthetic stream fallback
│   │   ├── ai_segmentation.ts     # Real-time person matte segmentation
│   │   ├── matrix_rain.ts         # Adjustable Matrix digital rain engine
│   │   ├── watermark.ts           # Matty Jacks branded card overlay
│   │   ├── ticker.ts              # Infinite scrolling text ticker
│   │   └── demo_deck.ts           # 8-second interactive demo soundboard
│   └── components/
│       ├── MatrixControls.ts      # Matrix Rain slider & palette bindings
│       ├── WatermarkControls.ts   # Watermark positioning & text bindings
│       ├── TickerControls.ts      # Ticker editor & quick tag inserts
│       ├── DemoDeckControls.ts    # Demo grid, hotkeys & countdown timers
│       └── DeviceControls.ts      # Camera select & VCam projector launcher
├── package.json                   # Vite & Tauri CLI scripts
└── vite.config.ts                 # Vite bundler config
```

---

## Quick Start & Development

### 1. Run in Web / Browser Mode
```bash
cd cameraMod1
npm install
npm run dev
```
Open `http://localhost:1420` in your browser.

### 2. Run as Native Desktop Application (Tauri)
```bash
npm run tauri dev
```

### 3. Build for Production (Windows / macOS / Linux)
```bash
npm run tauri build
```
The compiled binaries and installers (`.msi` / `.exe` on Windows, `.dmg` / `.app` on macOS, `.deb` / `.AppImage` on Linux) will be generated in `src-tauri/target/release/bundle/`.
