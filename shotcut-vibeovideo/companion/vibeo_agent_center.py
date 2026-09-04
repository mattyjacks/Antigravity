"""
vibeoVideo Agentic AI Command Center for Shotcut
- Pinned "Open vibeoVideo" option at the top of the screen right next to "Help"
- Agentic AI Assistant window with 50+ tool capabilities (Whisper, TTS, DALL-E 3, MLT inspection, Vision AI)
- Multi-Agent Commander Swarm & Collaborative Pack Exporter
- Modular architecture with clean subcomponents in core, tools, and ui
"""

import os
import sys
import json
import re
import shutil
import subprocess
import threading
import urllib.request
import urllib.error
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# Support running directly or as a package
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from companion.vibeo_tools import (
        MediaLibraryTracker, VibeoCommander, SYSTEM_PROMPT, execute_video_tool,
        find_ffmpeg, find_shotcut_exe, find_shotcut_window,
        count_conversation_tokens, prune_sliding_context,
        extract_audio, transcribe_whisper, convert_whisper_to_srt,
        generate_tts_audio, generate_dalle_image
    )
    from companion.ui import (
        VibeoTopBarButton, setup_remote_bar,
        setup_agent_tab, setup_subtitles_tab, setup_voiceover_tab, setup_broll_tab,
        setup_inspector_tab, setup_vision_tab, setup_collab_tab, setup_settings_tab,
        setup_director_tab, setup_sfx_tab
    )
except ImportError:
    from vibeo_tools import (
        MediaLibraryTracker, VibeoCommander, SYSTEM_PROMPT, execute_video_tool,
        find_ffmpeg, find_shotcut_exe, find_shotcut_window,
        count_conversation_tokens, prune_sliding_context,
        extract_audio, transcribe_whisper, convert_whisper_to_srt,
        generate_tts_audio, generate_dalle_image
    )
    from ui import (
        VibeoTopBarButton, setup_remote_bar,
        setup_agent_tab, setup_subtitles_tab, setup_voiceover_tab, setup_broll_tab,
        setup_inspector_tab, setup_vision_tab, setup_collab_tab, setup_settings_tab,
        setup_director_tab, setup_sfx_tab
    )


class VibeoAgenticCenter:
    """Main application controller coordinating UI tabs, agent workflows, and Shotcut integration."""
    def __init__(self, root):
        self.root = root
        self.root.title("vibeoVideo - Agentic AI Command Center")
        self.root.geometry("820x680")
        self.root.minsize(720, 540)
        self.root.configure(bg="#0f172a")

        self.style = ttk.Style()
        self.style.theme_use("clam")

        try:
            ico_path = os.path.join(current_dir, "vibeo_icon.ico")
            if os.path.exists(ico_path):
                self.root.iconbitmap(ico_path)
        except Exception:
            pass

        self.ffmpeg_path = find_ffmpeg()
        self.load_settings()
        self.conversation_history = []
        self.media_tracker = MediaLibraryTracker() if MediaLibraryTracker else None

        self.setup_ui()

        # Initialize top-bar docked overlay button
        self.top_bar_btn = VibeoTopBarButton(self)

        # Start dynamic Shotcut status checking loop
        self.update_shotcut_status()

    def load_settings(self):
        self.settings_file = os.path.join(os.path.expanduser("~"), ".vibeovideo_companion.json")
        self.settings = {
            "api_key": "",
            "model": "gpt-5.6-luna",
            "menu_x_offset": 0,
            "menu_y_offset": 0,
            "shotcut_exe_path": find_shotcut_exe() or "",
            "dangerous_mode": False,
            "max_context_tokens": 8192,
            "max_output_tokens": 800
        }
        if os.path.exists(self.settings_file):
            try:
                with open(self.settings_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.settings.update(data)
                    if self.settings.get("menu_x_offset") == 245:
                        self.settings["menu_x_offset"] = 0
                    if self.settings.get("menu_y_offset") == 32:
                        self.settings["menu_y_offset"] = 0
            except Exception:
                pass

    def save_settings(self, silent=False):
        try:
            self.settings["api_key"] = self.key_entry.get().strip()
            self.settings["model"] = self.model_combo.get()
            raw_x = self.offset_x_entry.get().strip()
            self.settings["menu_x_offset"] = int(raw_x) if (raw_x.isdigit() and int(raw_x) != 245) else 0
            raw_y = self.offset_y_entry.get().strip()
            self.settings["menu_y_offset"] = int(raw_y) if (raw_y.isdigit() and int(raw_y) != 32) else 0
            if hasattr(self, "shotcut_path_entry"):
                self.settings["shotcut_exe_path"] = self.shotcut_path_entry.get().strip()
            if hasattr(self, "dangerous_var"):
                self.settings["dangerous_mode"] = self.dangerous_var.get()
            if hasattr(self, "ctx_tokens_entry"):
                self.settings["max_context_tokens"] = int(self.ctx_tokens_entry.get().strip() or "8192")
            if hasattr(self, "out_tokens_entry"):
                self.settings["max_output_tokens"] = int(self.out_tokens_entry.get().strip() or "800")
            with open(self.settings_file, "w", encoding="utf-8") as f:
                json.dump(self.settings, f, indent=2)
            if not silent:
                messagebox.showinfo("Saved", "Settings updated successfully!")
        except Exception as e:
            if not silent:
                messagebox.showerror("Error", f"Failed to save settings: {e}")

    def is_shotcut_running(self):
        if find_shotcut_window():
            return True
        try:
            res = subprocess.run(["tasklist", "/FI", "IMAGENAME eq shotcut.exe"],
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 text=True, creationflags=0x08000000)
            if "shotcut.exe" in res.stdout.lower():
                return True
        except Exception:
            pass
        return False

    def update_shotcut_status(self):
        is_running = self.is_shotcut_running()
        if is_running:
            self.badge.config(text="● Shotcut Linked", fg="#34d399", bg="#064e3b")
            self.launch_shotcut_btn.pack_forget()
        else:
            self.badge.config(text="● Shotcut Not Running", fg="#f87171", bg="#450a0a")
            self.launch_shotcut_btn.pack(side=tk.RIGHT, padx=(0, 6))
        self.root.after(1500, self.update_shotcut_status)

    def launch_shotcut(self):
        exe_path = self.settings.get("shotcut_exe_path", "") or find_shotcut_exe()
        if not exe_path or not os.path.exists(exe_path):
            exe_path = filedialog.askopenfilename(
                title="Locate Shotcut Executable (shotcut.exe)",
                filetypes=[("Shotcut Executable", "shotcut.exe"), ("All Executables", "*.exe"), ("All Files", "*.*")]
            )
            if exe_path and os.path.exists(exe_path):
                self.settings["shotcut_exe_path"] = exe_path
                self.save_settings(silent=True)

        if exe_path and os.path.exists(exe_path):
            try:
                subprocess.Popen([exe_path], creationflags=0x00000008 | 0x00000200)
                self.status_var.set("Launching Shotcut...")
                self.badge.config(text="● Launching Shotcut...", fg="#fbbf24", bg="#451a03")
                self.root.after(1200, self.update_shotcut_status)
            except Exception as e:
                messagebox.showerror("Launch Error", f"Failed to launch Shotcut:\n{e}")
        else:
            messagebox.showwarning("Not Found", "Could not locate shotcut.exe. Set its path in Settings.")

    def show_window(self):
        self.root.deiconify()
        self.root.lift()
        self.root.focus_force()

    def setup_ui(self):
        # 1. Header Bar
        header = tk.Frame(self.root, bg="#1e1b4b", height=70, padx=16, pady=10)
        header.pack(fill=tk.X)

        title_box = tk.Frame(header, bg="#1e1b4b")
        title_box.pack(side=tk.LEFT)

        self.logo_img = None
        try:
            from PIL import Image, ImageTk
            icon_png = os.path.join(current_dir, "vibeo_logo_icon.png")
            if os.path.exists(icon_png):
                pim = Image.open(icon_png).resize((40, 40), Image.Resampling.LANCZOS)
                self.logo_img = ImageTk.PhotoImage(pim)
                logo_lbl = tk.Label(title_box, image=self.logo_img, bg="#1e1b4b")
                logo_lbl.pack(side=tk.LEFT, padx=(0, 10))
        except Exception:
            pass

        text_sub_box = tk.Frame(title_box, bg="#1e1b4b")
        text_sub_box.pack(side=tk.LEFT)

        title = tk.Label(text_sub_box, text="vibeoVideo AI Command Center", font=("Segoe UI", 16, "bold"), fg="#ffffff", bg="#1e1b4b")
        title.pack(anchor=tk.W)

        sub = tk.Label(text_sub_box, text="Agentic AI Copilot for Shotcut Video Editor (GPT-5.6 Luna, Whisper, DALL-E 3)", font=("Segoe UI", 9), fg="#a5b4fc", bg="#1e1b4b")
        sub.pack(anchor=tk.W)

        self.header_actions = tk.Frame(header, bg="#1e1b4b")
        self.header_actions.pack(side=tk.RIGHT)

        self.launch_shotcut_btn = tk.Button(
            self.header_actions, text="🚀 Launch Shotcut", font=("Segoe UI", 10, "bold"),
            bg="#10b981", fg="#ffffff", activebackground="#059669", activeforeground="#ffffff",
            relief=tk.FLAT, padx=12, pady=4, cursor="hand2", command=self.launch_shotcut
        )

        self.badge = tk.Label(self.header_actions, text="● Checking Shotcut...", font=("Segoe UI", 9, "bold"), fg="#fbbf24", bg="#451a03", padx=10, pady=4)
        self.badge.pack(side=tk.RIGHT, padx=(6, 0))

        # Interactive Timeline Remote Controller Bar
        setup_remote_bar(self.root, self)

        # 2. Main Notebook Tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=12, pady=(4, 10))

        # Tab 1: Agent Console
        self.tab_agent = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_agent, text="🤖 AI Agent Console")
        setup_agent_tab(self.tab_agent, self)

        # Tab 2: 🎬 Auto-Director & Shorts
        self.tab_director = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_director, text="🎬 Auto-Director & Shorts")
        setup_director_tab(self.tab_director, self)

        # Tab 3: 🔊 SFX & Sound Designer
        self.tab_sfx = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_sfx, text="🔊 SFX & Sound Design")
        setup_sfx_tab(self.tab_sfx, self)

        # Tab 4: Subtitles Studio
        self.tab_subtitles = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_subtitles, text="🎙️ Subtitle Studio (.srt)")
        setup_subtitles_tab(self.tab_subtitles, self)

        # Tab 5: Voiceover Studio
        self.tab_voiceover = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_voiceover, text="🗣️ Voiceover Studio (TTS)")
        setup_voiceover_tab(self.tab_voiceover, self)

        # Tab 6: B-Roll Studio
        self.tab_broll = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_broll, text="🎨 DALL-E 3 B-Roll")
        setup_broll_tab(self.tab_broll, self)

        # Tab 7: Shotcut Project Inspector
        self.tab_inspector = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_inspector, text="📁 Shotcut Projects")
        setup_inspector_tab(self.tab_inspector, self)

        # Tab 8: Frame Vision & Composition
        self.tab_vision = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_vision, text="🖼️ Vision & Composition")
        setup_vision_tab(self.tab_vision, self)

        # Tab 9: Video Editor Collaboration & Export Packs
        self.tab_collab = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_collab, text="🤝 Collaboration & Packs")
        setup_collab_tab(self.tab_collab, self)

        # Tab 10: Settings
        self.tab_settings = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(self.tab_settings, text="⚙️ Settings & Dock")
        setup_settings_tab(self.tab_settings, self)

        # Footer Status
        self.status_var = tk.StringVar(value="Agent ready. Click 'Open vibeoVideo' next to Help anytime to activate.")
        footer = tk.Label(self.root, textvariable=self.status_var, font=("Segoe UI", 9), fg="#94a3b8", bg="#0f172a", anchor=tk.W, padx=14, pady=4)
        footer.pack(fill=tk.X)

    # ---------------------------------------------------------------------
    # AGENT CONSOLE METHODS
    # ---------------------------------------------------------------------
    def clear_agent_memory(self):
        self.conversation_history = []
        self._update_agent_token_label(0)
        self.agent_chat.insert(tk.END, "🧹 Conversation memory cleared.\n\n")
        self.agent_chat.see(tk.END)
        self.status_var.set("Conversation memory reset.")

    def _update_agent_token_label(self, token_count: int):
        dangerous = self.settings.get("dangerous_mode", False)
        limit = self.settings.get("max_context_tokens", 65536 if dangerous else 8192)
        turns = max(0, len(self.conversation_history) - 1) if self.conversation_history else 0
        if dangerous:
            self.agent_token_label.config(
                text=f"⚠️ Unlocked: ~{token_count} / {limit} tokens ({turns} msgs)",
                fg="#fca5a5", bg="#350c0c"
            )
        else:
            self.agent_token_label.config(
                text=f"🧠 Memory: ~{token_count} / {limit} tokens ({turns} msgs)",
                fg="#c7d2fe", bg="#1e1b4b"
            )

    def on_agent_submit(self):
        text = self.agent_input.get().strip()
        if text:
            self.agent_input.delete(0, tk.END)
            self.send_agent_prompt(text)

    def send_agent_prompt(self, user_msg):
        api_key = self.settings.get("api_key", "").strip()
        if not api_key:
            messagebox.showerror("Missing Key", "Please configure your OpenAI API Key in Settings.")
            self.notebook.select(self.tab_settings)
            return

        self.agent_chat.insert(tk.END, f"\n👤 You: {user_msg}\n")
        self.agent_chat.insert(tk.END, "🤖 vibeoVideo: Orchestrating video tools and processing...\n")
        self.agent_chat.see(tk.END)
        self.status_var.set("Agent executing prompt...")

        threading.Thread(target=self._run_agent_thread, args=(user_msg, api_key), daemon=True).start()

    def _execute_video_tool(self, tool_name: str, params: dict) -> str:
        ffmpeg = self.ffmpeg_path or find_ffmpeg()
        api_key = self.settings.get("api_key", "").strip()
        res = execute_video_tool(tool_name, params, ffmpeg=ffmpeg, api_key=api_key, media_tracker=self.media_tracker)
        if hasattr(self, "refresh_media_table"):
            self.root.after(0, self.refresh_media_table)
        return res

    def _run_agent_thread(self, user_msg, api_key):
        model = self.settings.get("model", "gpt-5.6-luna")

        # Multi-Agent Commander Swarm Architecture
        if hasattr(self, "commander_mode_var") and self.commander_mode_var.get() and VibeoCommander:
            self.root.after(0, lambda: self.agent_chat.insert(tk.END, "🎖️ [Commander AI] Initializing Sub-Agent Swarm...\n"))
            self.status_var.set("Commander AI orchestrating sub-agent swarm...")

            def status_cb(msg):
                self.root.after(0, lambda m=msg: self.status_var.set(m))
                self.root.after(0, lambda m=msg: self.agent_chat.insert(tk.END, f"  ⚡ {m}\n"))
                self.root.after(0, self.agent_chat.see, tk.END)

            try:
                commander = VibeoCommander(api_key, model=model)
                res = commander.orchestrate(user_msg, chat_history=self.conversation_history, status_callback=status_cb)
                synth = res.get("synthesis", "")
                reports = res.get("sub_agent_reports", {})

                self.root.after(0, lambda: self.agent_chat.insert(tk.END, "\n📋 Sub-Agent Consensus Achieved:\n"))
                for agent_name, report in reports.items():
                    first_line = report.strip().split("\n")[0][:90]
                    self.root.after(0, lambda an=agent_name, fl=first_line: self.agent_chat.insert(tk.END, f"  • {an}: {fl}...\n"))

                self.conversation_history.append({"role": "user", "content": user_msg})
                self.conversation_history.append({"role": "assistant", "content": synth})
                tok_count = count_conversation_tokens(self.conversation_history)
                self.root.after(0, self._update_agent_token_label, tok_count)
                self.root.after(0, self._update_agent_reply, synth)

                tool_call = res.get("suggested_tool")
                if not tool_call:
                    tool_match = re.search(r'```json\s*(\{[\s\S]*?"tool"[\s\S]*?\})\s*```', synth) or re.search(r'(\{[\s\S]*?"tool"\s*:\s*"[^"]+"[\s\S]*?\})', synth)
                    if tool_match:
                        try:
                            tool_call = json.loads(tool_match.group(1))
                        except Exception:
                            pass

                if tool_call and isinstance(tool_call, dict):
                    t_name = tool_call.get("tool")
                    t_params = tool_call.get("parameters", {})
                    if t_name:
                        self.root.after(0, lambda n=t_name: self.agent_chat.insert(tk.END, f"⚙️ Commander Executing Video Capability: {n}...\n"))
                        exec_res = self._execute_video_tool(t_name, t_params)
                        self.root.after(0, lambda r=exec_res: self.agent_chat.insert(tk.END, f"{r}\n\n"))
                        self.root.after(0, self.agent_chat.see, tk.END)
                return
            except Exception as ce:
                self.root.after(0, lambda e=ce: self.agent_chat.insert(tk.END, f"⚠️ Commander swarm fallback to single agent: {e}\n"))

        # Single-Agent fallback mode
        url = "https://api.openai.com/v1/chat/completions"
        if not self.conversation_history:
            self.conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]
        self.conversation_history.append({"role": "user", "content": user_msg})

        dangerous = self.settings.get("dangerous_mode", False)
        ctx_limit = int(self.settings.get("max_context_tokens", 65536 if dangerous else 8192))
        out_limit = int(self.settings.get("max_output_tokens", 4096 if dangerous else 800))

        pruned_msgs = prune_sliding_context(self.conversation_history, ctx_limit)
        payload = {
            "model": model,
            "messages": pruned_msgs,
            "temperature": 0.7,
            "max_tokens": out_limit
        }

        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            })
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                reply = data["choices"][0]["message"]["content"].strip()
                self.conversation_history = pruned_msgs[:]
                self.conversation_history.append({"role": "assistant", "content": reply})

                tok_count = data.get("usage", {}).get("total_tokens", count_conversation_tokens(self.conversation_history))
                self.root.after(0, self._update_agent_token_label, tok_count)
                self.root.after(0, self._update_agent_reply, reply)

                tool_match = re.search(r'```json\s*(\{[\s\S]*?"tool"[\s\S]*?\})\s*```', reply) or re.search(r'(\{[\s\S]*?"tool"\s*:\s*"[^"]+"[\s\S]*?\})', reply)
                if tool_match:
                    try:
                        tool_data = json.loads(tool_match.group(1))
                        tool_name = tool_data.get("tool")
                        tool_params = tool_data.get("parameters", {})
                        if tool_name:
                            self.root.after(0, lambda: self.agent_chat.insert(tk.END, f"⚙️ Executing video modification: {tool_name}...\n"))
                            res = self._execute_video_tool(tool_name, tool_params)
                            self.root.after(0, lambda r=res: self.agent_chat.insert(tk.END, f"{r}\n\n"))
                            self.root.after(0, self.agent_chat.see, tk.END)
                    except Exception as te:
                        self.root.after(0, lambda e=te: self.agent_chat.insert(tk.END, f"⚠️ Tool execution error: {e}\n\n"))
        except Exception as e:
            if self.conversation_history and self.conversation_history[-1]["role"] == "user":
                self.conversation_history.pop()
            self.root.after(0, self._update_agent_reply, f"Error: {e}")

    def _update_agent_reply(self, reply):
        self.agent_chat.insert(tk.END, f"🤖 vibeoVideo:\n{reply}\n\n")
        self.agent_chat.see(tk.END)
        self.status_var.set("Agent response completed.")

    # ---------------------------------------------------------------------
    # SUBTITLES, VOICEOVER & B-ROLL STUDIOS HANDLERS
    # ---------------------------------------------------------------------
    def browse_sub_file(self):
        fn = filedialog.askopenfilename(filetypes=[("Media Files", "*.mp4 *.mov *.mkv *.mp3 *.wav *.m4a *.aac *.flac")])
        if fn:
            self.sub_file_entry.delete(0, tk.END)
            self.sub_file_entry.insert(0, fn)

    def run_whisper_tab(self):
        key = self.settings.get("api_key", "").strip()
        if not key:
            messagebox.showerror("Key Required", "Enter your OpenAI API key in Settings.")
            return
        media = self.sub_file_entry.get().strip()
        if not media or not os.path.exists(media):
            messagebox.showerror("File Error", "Please choose a valid media file.")
            return

        self.sub_log.delete(1.0, tk.END)
        self.sub_log.insert(tk.END, f"Extracting audio from {os.path.basename(media)}...\n")
        self.status_var.set("Extracting audio and calling Whisper API...")

        def _do():
            base, _ = os.path.splitext(media)
            temp_mp3 = base + "_vibeo_tmp.mp3"
            out_srt = base + ".srt"
            try:
                extract_audio(media, temp_mp3, self.ffmpeg_path)
                self.sub_log.insert(tk.END, "Transcribing with OpenAI Whisper API...\n")
                res = transcribe_whisper(temp_mp3, key)
                convert_whisper_to_srt(res, out_srt)
                if os.path.exists(temp_mp3):
                    os.remove(temp_mp3)
                if self.media_tracker:
                    self.media_tracker.track_file(out_srt, role="subtitles")
                self.sub_log.insert(tk.END, f"✨ Done! Created subtitle file:\n{out_srt}\n\n")
                with open(out_srt, "r", encoding="utf-8") as f:
                    self.sub_log.insert(tk.END, "".join(f.readlines()[:15]) + "...\n")
                self.status_var.set(f"Subtitles ready: {os.path.basename(out_srt)}")
                messagebox.showinfo("Success", f"Subtitles generated:\n{out_srt}\n\nDrag this .srt file into Shotcut's subtitle track!")
            except Exception as e:
                if os.path.exists(temp_mp3):
                    os.remove(temp_mp3)
                self.sub_log.insert(tk.END, f"\nError: {e}\n")
                self.status_var.set("Subtitle transcription failed.")

        threading.Thread(target=_do, daemon=True).start()

    def run_tts_tab(self):
        key = self.settings.get("api_key", "").strip()
        if not key:
            messagebox.showerror("Key Required", "Enter your OpenAI API key in Settings.")
            return
        text = self.tts_text.get(1.0, tk.END).strip()
        if not text:
            messagebox.showerror("Empty Text", "Please enter script text to narrate.")
            return

        out_path = filedialog.asksaveasfilename(defaultextension=".mp3", filetypes=[("MP3 Audio", "*.mp3")], initialfile="vibeo_voiceover.mp3")
        if not out_path:
            return

        voice = self.tts_voice.get()
        model = "tts-1-hd" if "hd" in self.tts_quality.get().lower() else "tts-1"
        self.status_var.set("Synthesizing voiceover audio with OpenAI TTS...")

        def _do():
            try:
                generate_tts_audio(text, out_path, voice, key, model)
                if self.media_tracker:
                    self.media_tracker.track_file(out_path, role="voiceover")
                self.status_var.set(f"Voiceover saved: {os.path.basename(out_path)}")
                messagebox.showinfo("Saved", f"Voiceover generated successfully!\n\nSaved to:\n{out_path}\n\nYou can now drop this audio onto your Shotcut audio track!")
            except Exception as e:
                messagebox.showerror("TTS Error", str(e))
                self.status_var.set("Voiceover generation failed.")

        threading.Thread(target=_do, daemon=True).start()

    def run_broll_tab(self):
        key = self.settings.get("api_key", "").strip()
        if not key:
            messagebox.showerror("Key Required", "Enter your OpenAI API key in Settings.")
            return
        prompt = self.broll_prompt.get().strip()
        if not prompt:
            messagebox.showerror("Empty Prompt", "Please enter an image prompt.")
            return

        out_path = filedialog.asksaveasfilename(defaultextension=".png", filetypes=[("PNG Image", "*.png")], initialfile="vibeo_broll.png")
        if not out_path:
            return

        raw_ratio = self.broll_ratio.get().split()[0]
        self.status_var.set("Generating DALL-E 3 visual (~20s)...")
        self.broll_status.config(text="Generating image with DALL-E 3... please wait.")

        def _do():
            try:
                generate_dalle_image(prompt, out_path, key, raw_ratio)
                if self.media_tracker:
                    self.media_tracker.track_file(out_path, role="broll_image")
                self.broll_status.config(text=f"✓ Saved image: {os.path.basename(out_path)}")
                self.status_var.set(f"Image saved to: {out_path}")
                messagebox.showinfo("Success", f"DALL-E 3 image saved:\n{out_path}\n\nYou can now drag this image straight onto the Shotcut timeline!")
            except Exception as e:
                self.broll_status.config(text=f"✗ Error: {e}")
                self.status_var.set("DALL-E generation failed.")
                messagebox.showerror("DALL-E Error", str(e))

        threading.Thread(target=_do, daemon=True).start()


def main():
    root = tk.Tk()
    app = VibeoAgenticCenter(root)
    root.mainloop()


if __name__ == "__main__":
    main()
