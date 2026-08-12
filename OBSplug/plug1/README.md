# OBSplug / plug1 - Modular AI OBS Plugin Suite

A next-generation, high-performance modular plugin architecture for **OBS Studio** designed specifically for Twitch streamers. 

## Key Features

1. **Local AI Background Removal (Green-screen-less)**
   - GPU (Direct3D/WebGL) or CPU (SIMD Multi-threaded) intelligent human segmentation.
   - Requires zero physical green screens.
2. **Modular Edge Contour Effects**
   - Fire Aura 🔥, Cyberpunk Neon ⚡, Electric Arcs, Rainbow Glow, and Glitch Borders dynamically attached to the boundary of the segmented streamer silhouette.
3. **Interactive Chat-Driven GPU/CPU Effects**
   - Twitch chat integration triggers visual and audio effects when keywords or emojis are typed in chat (e.g. `"fire"`, `"🔥"`, `"shake"`, `"glitch"`, `"boom"`).
4. **Twitch Chat Overlay Engine**
   - Multiple overlay presentation modes: Floating Speech Bubbles, Cyberpunk Terminal HUD, Bottom News Ticker, and Glassmorphism Cards.
5. **"Present Premade Video" Scene Mode**
   - Queue sponsorship banners and video ads with auto-ducking streamer microphone audio.
6. **Sub-Plugin Ecosystem Architecture**
   - Extensible C++ and Web API lifecycle interface (`ISubPlugin`) supporting dynamically loaded sub-plugins (Emote Rain, Soundboard, Hype Meters).

---

## Directory Structure

```
c:\GitHub5\Antigravity\OBSplug\plug1\
├── CMakeLists.txt              # CMake configuration for libobs build
├── README.md                   # Plugin documentation
├── src/
│   ├── core/                   # Plugin main entry & SubPlugin Ecosystem Manager
│   │   ├── plugin_main.cpp
│   │   ├── subplugin_manager.hpp
│   │   └── subplugin_manager.cpp
│   ├── ai_greenscreen/         # Local AI segmentation & edge contour FX
│   │   ├── ai_segmenter.hpp
│   │   └── ai_segmenter.cpp
│   ├── reactive_fx/            # Chat-driven GPU/CPU visual & audio effects engine
│   │   ├── effect_trigger_engine.hpp
│   │   └── effect_trigger_engine.cpp
│   └── media_presenter/        # Sponsor video presentation & auto-duck scene source
│       ├── video_presenter_source.hpp
│       └── video_presenter_source.cpp
└── web_ui/                     # Interactive OBS Dock & Real-time Visual Simulator
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## Quick Start & UI Simulator

Launch `web_ui/index.html` in any browser or embed directly as a custom OBS Browser Dock to interact with the real-time AI background removal simulator, test chat trigger keywords like `fire 🔥`, switch sub-plugins, and control the video presenter queue!
