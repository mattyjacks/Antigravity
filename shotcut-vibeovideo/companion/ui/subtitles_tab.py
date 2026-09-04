"""
subtitles_tab.py - Subtitle Studio tab for Whisper speech-to-text generation.
"""

import os
import threading
import tkinter as tk
from tkinter import filedialog, messagebox
try:
    from companion.vibeo_tools import extract_audio_for_whisper, transcribe_whisper, convert_whisper_to_srt
except ImportError:
    from vibeo_tools import extract_audio_for_whisper, transcribe_whisper, convert_whisper_to_srt


def setup_subtitles_tab(parent_frame, app):
    frame = tk.Frame(parent_frame, bg="#0f172a", padx=16, pady=16)
    frame.pack(fill=tk.BOTH, expand=True)

    tk.Label(frame, text="🎙️ Whisper Speech-to-Text Subtitle Generator", font=("Segoe UI", 13, "bold"), fg="#ffffff", bg="#0f172a").pack(anchor=tk.W)
    tk.Label(frame, text="Select any media clip from your Shotcut project to generate synced .srt subtitles.", font=("Segoe UI", 9), fg="#94a3b8", bg="#0f172a").pack(anchor=tk.W, pady=(2, 10))

    row1 = tk.Frame(frame, bg="#0f172a")
    row1.pack(fill=tk.X, pady=6)
    app.sub_file_entry = tk.Entry(row1, font=("Segoe UI", 10), bg="#1e293b", fg="#ffffff")
    app.sub_file_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 8), ipady=4)

    def browse_sub_file():
        fn = filedialog.askopenfilename(filetypes=[("Media Files", "*.mp4 *.mov *.mkv *.mp3 *.wav *.m4a *.aac *.flac")])
        if fn:
            app.sub_file_entry.delete(0, tk.END)
            app.sub_file_entry.insert(0, fn)

    tk.Button(row1, text="Browse Media...", font=("Segoe UI", 9, "bold"), command=browse_sub_file).pack(side=tk.LEFT)

    def run_whisper_tab():
        key = app.settings.get("api_key", "").strip()
        if not key:
            messagebox.showerror("Key Required", "Enter your OpenAI API key in Settings.")
            return
        media = app.sub_file_entry.get().strip()
        if not media or not os.path.exists(media):
            messagebox.showerror("File Error", "Please choose a valid media file.")
            return

        app.sub_log.delete(1.0, tk.END)
        app.sub_log.insert(tk.END, f"Extracting audio from {os.path.basename(media)}...\n")
        app.status_var.set("Extracting audio and calling Whisper API...")

        def _do():
            base, _ = os.path.splitext(media)
            temp_mp3 = base + "_vibeo_tmp.mp3"
            out_srt = base + ".srt"
            try:
                extract_audio_for_whisper(media, temp_mp3, app.ffmpeg_path)
                app.sub_log.insert(tk.END, "Transcribing with OpenAI Whisper API...\n")
                res = transcribe_whisper(temp_mp3, key)
                convert_whisper_to_srt(res, out_srt)
                if os.path.exists(temp_mp3):
                    os.remove(temp_mp3)
                app.sub_log.insert(tk.END, f"✨ Done! Created subtitle file:\n{out_srt}\n\n")
                with open(out_srt, "r", encoding="utf-8") as f:
                    app.sub_log.insert(tk.END, "".join(f.readlines()[:15]) + "...\n")
                app.status_var.set(f"Subtitles ready: {os.path.basename(out_srt)}")
                if hasattr(app, "media_tracker") and app.media_tracker:
                    app.media_tracker.track_file(out_srt, role="subtitles")
                messagebox.showinfo("Success", f"Subtitles generated:\n{out_srt}\n\nDrag this .srt file into Shotcut's subtitle track!")
            except Exception as e:
                if os.path.exists(temp_mp3):
                    os.remove(temp_mp3)
                app.sub_log.insert(tk.END, f"\nError: {e}\n")
                app.status_var.set("Subtitle transcription failed.")

        threading.Thread(target=_do, daemon=True).start()

    tk.Button(frame, text="🚀 Transcribe & Create .SRT Subtitles", font=("Segoe UI", 11, "bold"), bg="#10b981", fg="#ffffff", relief=tk.FLAT, pady=8, command=run_whisper_tab).pack(fill=tk.X, pady=12)

    app.sub_log = tk.Text(frame, height=10, bg="#1e293b", fg="#f1f5f9", font=("Consolas", 9), relief=tk.FLAT, padx=8, pady=8)
    app.sub_log.pack(fill=tk.BOTH, expand=True)
