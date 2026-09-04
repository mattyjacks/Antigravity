import tkinter as tk
from tkinter import ttk, filedialog
try:
    from companion.vibeo_tools import find_shotcut_exe
except ImportError:
    from vibeo_tools import find_shotcut_exe

def setup_settings_tab(parent_frame, app):
    """Sets up the Settings tab in the vibeoVideo Command Center."""
    frame = tk.Frame(parent_frame, bg="#0f172a", padx=20, pady=20)
    frame.pack(fill=tk.BOTH, expand=True)

    tk.Label(frame, text="⚙️ vibeoVideo Configuration", font=("Segoe UI", 14, "bold"), fg="#ffffff", bg="#0f172a").pack(anchor=tk.W)

    tk.Label(frame, text="OpenAI API Key:", font=("Segoe UI", 10, "bold"), fg="#e2e8f0", bg="#0f172a").pack(anchor=tk.W, pady=(12, 2))
    app.key_entry = tk.Entry(frame, font=("Consolas", 10), bg="#1e293b", fg="#ffffff", width=55, show="*")
    app.key_entry.pack(anchor=tk.W, fill=tk.X, pady=4, ipady=4)
    app.key_entry.insert(0, app.settings.get("api_key", ""))

    tk.Label(frame, text="Default AI Model:", font=("Segoe UI", 10, "bold"), fg="#e2e8f0", bg="#0f172a").pack(anchor=tk.W, pady=(8, 2))
    app.model_combo = ttk.Combobox(frame, values=["gpt-5.6-luna", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"], state="readonly", width=30)
    app.model_combo.set(app.settings.get("model", "gpt-5.6-luna"))
    app.model_combo.pack(anchor=tk.W, pady=4)

    tk.Label(frame, text="Shotcut Executable Path:", font=("Segoe UI", 10, "bold"), fg="#e2e8f0", bg="#0f172a").pack(anchor=tk.W, pady=(12, 2))
    sc_frame = tk.Frame(frame, bg="#0f172a")
    sc_frame.pack(fill=tk.X, pady=4)
    app.shotcut_path_entry = tk.Entry(sc_frame, font=("Segoe UI", 9), bg="#1e293b", fg="#ffffff")
    app.shotcut_path_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 8), ipady=3)
    app.shotcut_path_entry.insert(0, app.settings.get("shotcut_exe_path", find_shotcut_exe() or ""))

    def browse_shotcut_path():
        fn = filedialog.askopenfilename(
            title="Select Shotcut Executable",
            filetypes=[("Shotcut Executable", "shotcut.exe"), ("Executable Files", "*.exe"), ("All Files", "*.*")]
        )
        if fn:
            app.shotcut_path_entry.delete(0, tk.END)
            app.shotcut_path_entry.insert(0, fn)

    app.browse_shotcut_path = browse_shotcut_path
    tk.Button(sc_frame, text="Browse...", font=("Segoe UI", 9), command=browse_shotcut_path).pack(side=tk.LEFT)

    tk.Label(frame, text="Top Bar Menu Item Alignment (pixels from menu bar start):", font=("Segoe UI", 10, "bold"), fg="#e2e8f0", bg="#0f172a").pack(anchor=tk.W, pady=(14, 2))
    sub_info = tk.Label(frame, text="Aligns the 'vibeoVideo' item right next to 'Help' on Shotcut's menu bar (0 = Auto-calculated with DPI scale).", font=("Segoe UI", 8), fg="#94a3b8", bg="#0f172a")
    sub_info.pack(anchor=tk.W)

    pos_frame = tk.Frame(frame, bg="#0f172a")
    pos_frame.pack(anchor=tk.W, pady=6)

    tk.Label(pos_frame, text="X Offset (0 = Auto ~218px):", fg="#ffffff", bg="#0f172a").pack(side=tk.LEFT, padx=(0, 4))
    app.offset_x_entry = tk.Entry(pos_frame, width=8, font=("Segoe UI", 9))
    app.offset_x_entry.insert(0, str(app.settings.get("menu_x_offset", 0)))
    app.offset_x_entry.pack(side=tk.LEFT, padx=(0, 16))

    tk.Label(pos_frame, text="Y Offset (0 = Auto ~2px):", fg="#ffffff", bg="#0f172a").pack(side=tk.LEFT, padx=(0, 4))
    app.offset_y_entry = tk.Entry(pos_frame, width=8, font=("Segoe UI", 9))
    app.offset_y_entry.insert(0, str(app.settings.get("menu_y_offset", 0)))
    app.offset_y_entry.pack(side=tk.LEFT)

    # DANGEROUS HIGH-TOKEN MODE
    danger_box = tk.Frame(frame, bg="#350c0c", padx=12, pady=10, relief=tk.GROOVE, bd=1)
    danger_box.pack(fill=tk.X, pady=(14, 8))

    app.dangerous_var = tk.BooleanVar(value=app.settings.get("dangerous_mode", False))
    tk.Checkbutton(
        danger_box,
        text="⚠️ Unlock High-Token Dangerous Mode",
        variable=app.dangerous_var,
        font=("Segoe UI", 10, "bold"),
        fg="#fca5a5",
        bg="#350c0c",
        selectcolor="#1e1b4b",
        activebackground="#350c0c",
        activeforeground="#fca5a5"
    ).pack(anchor=tk.W)

    warn_msg = (
        "DANGEROUS OPTION: By default, the AI limits context to ~8,192 tokens and 800 output tokens.\n"
        "Enabling Dangerous Mode expands context memory up to 128,000 tokens and responses up to 8,192 tokens,\n"
        "allowing vast conversational memory across long sessions. CAUTION: May consume OpenAI API credits rapidly!"
    )
    tk.Label(danger_box, text=warn_msg, font=("Segoe UI", 8), fg="#f87171", bg="#350c0c", justify=tk.LEFT).pack(anchor=tk.W, pady=(4, 8))

    tokens_row = tk.Frame(danger_box, bg="#350c0c")
    tokens_row.pack(fill=tk.X)

    tk.Label(tokens_row, text="Max Context Tokens:", font=("Segoe UI", 9, "bold"), fg="#ffffff", bg="#350c0c").pack(side=tk.LEFT, padx=(0, 4))
    app.ctx_tokens_entry = tk.Entry(tokens_row, width=10, font=("Segoe UI", 9))
    app.ctx_tokens_entry.insert(0, str(app.settings.get("max_context_tokens", 65536 if app.settings.get("dangerous_mode") else 8192)))
    app.ctx_tokens_entry.pack(side=tk.LEFT, padx=(0, 16))

    tk.Label(tokens_row, text="Max Output Tokens:", font=("Segoe UI", 9, "bold"), fg="#ffffff", bg="#350c0c").pack(side=tk.LEFT, padx=(0, 4))
    app.out_tokens_entry = tk.Entry(tokens_row, width=10, font=("Segoe UI", 9))
    app.out_tokens_entry.insert(0, str(app.settings.get("max_output_tokens", 4096 if app.settings.get("dangerous_mode") else 800)))
    app.out_tokens_entry.pack(side=tk.LEFT)

    tk.Button(frame, text="💾 Save Settings", font=("Segoe UI", 10, "bold"), bg="#10b981", fg="#ffffff", relief=tk.FLAT, padx=16, pady=6,
              command=app.save_settings).pack(anchor=tk.W, pady=16)
