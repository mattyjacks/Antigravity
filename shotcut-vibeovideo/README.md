# 🎬 vibeoVideo - OpenAI AI Studio for Shotcut

**vibeoVideo** is a native AI plugin and companion suite for **Shotcut Video Editor**, bringing the power of **OpenAI GPT-4o, DALL-E 3, and Whisper** directly into your video editing workflow.

---

## ✨ Features at a Glance

| Feature | Powered By | Description |
| :--- | :--- | :--- |
| **Viral Titles & Hooks** | OpenAI GPT-4o / GPT-4o-mini | Generate high-converting YouTube titles and 3-second opening video hooks directly in your video timeline. |
| **Lower Thirds & Captions** | OpenAI GPT-4o | Create clean 2-line name/title lower thirds, scene summaries, and call-to-action (CTA) overlays. |
| **Instant Translation** | OpenAI GPT-4o | Translate video scripts, lower thirds, and captions into Spanish, French, German, Japanese, and more. |
| **B-Roll & Backgrounds** | OpenAI DALL-E 3 | Generate 16:9 cinematic widescreen, 9:16 vertical Shorts, or square concept images directly in the editor. |
| **Interactive Video Gizmo** | Shotcut `TextFilterVui` | On-screen interactive drag, drop, and resize handles right in the Shotcut video player window. |
| **Whisper Auto-Subtitles** | OpenAI Whisper-1 | Auto-transcribe audio/video speech into standard `.srt` subtitle files with millisecond timestamps. |
| **AI Voiceovers (TTS)** | OpenAI TTS (`tts-1`) | Generate crystal-clear AI narration tracks (`alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`) ready for your timeline. |
| **Secure Key Storage** | SQLite / LocalStorage | Your OpenAI API key is stored locally on your machine with masked inputs and connection testing. |

---

## 🚀 Quick Installation

### Option 1: Automatic 1-Click Install (Recommended)

Run the included PowerShell installer from the project directory:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

This automatically copies the plugin files into Shotcut's user extension directory:
`%LOCALAPPDATA%\Meltytech\Shotcut\extensions\filters\vibeo_video`

*(No administrator privileges required, and your plugin persists across Shotcut software updates!)*

### Option 2: Manual Installation

Copy the `filters/vibeo_video` folder to:
`%LOCALAPPDATA%\Meltytech\Shotcut\extensions\filters\vibeo_video`

*(If the `extensions\filters` folder does not exist, simply create it.)*

---

## 🎯 How to Use vibeoVideo in Shotcut

### Step 1: Open Shotcut & Add the Filter
1. Launch **Shotcut**.
2. Add any video clip, image, or transparent color clip (`Open Other > Color`) to your timeline.
3. Select the clip and click the **Filters** panel (`+` icon).
4. Search for **vibeoVideo** (located under the **Video** filter category).
5. Click to add it to your clip.

### Step 2: Set Your OpenAI API Key
1. In the vibeoVideo panel, switch to the **⚙️ Settings** tab.
2. Paste your OpenAI API Key (`sk-...`).
3. Click **⚡ Test Connection** to verify your key.
4. Click **💾 Save Key** to permanently store it for future editing sessions.

### Step 3: Generate AI Video Overlays
1. Switch to the **✍️ AI Text** tab.
2. Select your desired **Mode**:
   - 🔥 *Viral Video Title*
   - 🪝 *3-Second Opening Hook*
   - 🏷️ *Lower Third (Name & Role)*
   - 📝 *Scene Caption & Summary*
   - 📢 *Call to Action (CTA)*
   - 🌐 *Language Translator*
   - 💬 *Custom AI Prompt*
3. Enter your topic or scene context (e.g. *"Tech reviewer explaining battery lifespan"*).
4. Click **✨ Generate with vibeoVideo**.
5. The generated text is immediately rendered live onto your video preview!
6. Use the **📐 Style & Layout** tab to customize fonts, colors, background boxes, outlines, or use Shotcut's on-screen box to drag and position your graphic.

### Step 4: Generate DALL-E 3 B-Roll Images
1. Switch to the **🎨 DALL-E 3** tab.
2. Enter an image description (e.g. *"Cinematic wide drone shot of futuristic cyberpunk city with neon lights"*).
3. Choose a style preset and aspect ratio (**16:9 Landscape** for standard video, or **9:16** for TikTok/Shorts).
4. Click **🎨 Generate B-Roll Image**.
5. Preview the result and click **Open in Web Browser / Download** to save it and drop it directly onto your Shotcut timeline!

---

## 🎙️ vibeoVideo AI Companion (Whisper Subtitles & TTS Voiceovers)

For batch audio processing, subtitle generation, and text-to-speech, vibeoVideo includes a companion desktop app.

### Running the Companion Tool

Double-click `companion\run_companion.bat` or run via terminal:

```bash
python companion\vibeo_companion.py
```

### 1. Whisper Audio Transcriber (`.srt` subtitles)
1. Select any video or audio file (`.mp4`, `.mov`, `.mkv`, `.mp3`, `.wav`, `.m4a`).
2. The tool uses Shotcut's bundled `ffmpeg.exe` to isolate the dialogue track.
3. Transcribes speech using OpenAI Whisper (`whisper-1`) with timestamp precision.
4. Produces a standard `.srt` subtitle file ready to import into Shotcut's Subtitles track or open as a text source.

### 2. Text-to-Speech (TTS Voiceover Studio)
1. Paste your narration script.
2. Choose your voice: `alloy`, `echo`, `fable`, `onyx`, `nova`, or `shimmer`.
3. Select quality (`tts-1` or `tts-1-hd`).
4. Click **🎙️ Generate Voiceover Audio** to export a `.mp3` clip ready to drop on an audio track in Shotcut.

### CLI Mode (Scripting & Automation)

You can also run the companion tool headlessly from the command line:

```bash
# Auto-generate .srt subtitles from a video
python companion\vibeo_companion.py --transcribe video.mp4 --key sk-proj-...

# Generate a voiceover narration
python companion\vibeo_companion.py --tts "Welcome back to the channel! Today we explore quantum computing." --voice nova --key sk-proj-...
```

---

## 🏗️ Technical Architecture

```
shotcut-vibeovideo/
├── filters/
│   └── vibeo_video/
│       ├── meta.qml            # Filter manifest for Shotcut plugin loader
│       ├── ui.qml              # Qt 6 QML Filter UI (Tabs, Controls, Live Preview)
│       ├── vui.qml             # Video viewport interactive manipulation gizmo
│       ├── OpenAiClient.js     # Asynchronous OpenAI REST engine (XMLHttpRequest)
│       ├── vibeoStorage.js     # Persistent SQLite/LocalStorage manager
│       ├── icon.webp           # Shotcut filter list icon (128x128 WebP)
│       └── icon.png            # High-res icon asset
├── companion/
│   ├── vibeo_companion.py      # Desktop GUI & CLI for Whisper & TTS
│   ├── run_companion.bat       # Quick-launch launcher
│   └── requirements.txt        # Optional dependency documentation
├── install.ps1                 # Automated PowerShell installer
├── uninstall.ps1               # Clean uninstaller script
└── README.md                   # Full documentation
```

### Compatibility
- **Shotcut**: Shotcut 22.09, 23.x, 24.x, and newer (Qt 6 Quick architecture)
- **OS**: Windows 10/11, macOS, and Linux
- **OpenAI Models**: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`, `dall-e-3`, `whisper-1`, `tts-1`, `tts-1-hd`
