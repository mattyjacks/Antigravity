"""
ffmpeg_utils.py - Core utility functions for media path discovery, token estimation, and window inspection.
"""

import os
import shutil
import subprocess
import ctypes
from ctypes import wintypes
try:
    import winreg
except ImportError:
    winreg = None

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32


def find_ffmpeg() -> str:
    """Locate the ffmpeg binary on the system."""
    paths = [
        r"C:\Program Files\Shotcut\ffmpeg.exe",
        r"C:\Program Files (x86)\Shotcut\ffmpeg.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Shotcut\ffmpeg.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Shotcut\ffmpeg.exe"),
    ]
    for p in paths:
        if os.path.exists(p):
            return p
    try:
        res = subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode == 0:
            return "ffmpeg"
    except Exception:
        pass
    return None


def find_melt() -> str:
    """Find the MLT Melt engine binary for headless Shotcut .mlt timeline rendering."""
    paths = [
        r"C:\Program Files\Shotcut\melt.exe",
        r"C:\Program Files (x86)\Shotcut\melt.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Shotcut\melt.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Shotcut\melt.exe"),
    ]
    for p in paths:
        if os.path.exists(p):
            return p
    try:
        res = subprocess.run(["melt", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode == 0:
            return "melt"
    except Exception:
        pass
    return None


def find_shotcut_exe() -> str:
    """Find the path to Shotcut executable on the system."""
    candidates = [
        r"C:\Program Files\Shotcut\shotcut.exe",
        r"C:\Program Files (x86)\Shotcut\shotcut.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Shotcut\shotcut.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Shotcut\shotcut.exe"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c

    if winreg:
        for root_key in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
            try:
                with winreg.OpenKey(root_key, r"Software\Microsoft\Windows\CurrentVersion\App Paths\shotcut.exe") as k:
                    val, _ = winreg.QueryValueEx(k, "")
                    if val and os.path.exists(val):
                        return val
            except Exception:
                pass

    p = shutil.which("shotcut.exe") or shutil.which("shotcut")
    if p and os.path.exists(p):
        return p

    return None


def find_shotcut_window():
    """Find Shotcut main window HWND and title."""
    found = None
    def enum_cb(hwnd, _):
        nonlocal found
        if user32.IsWindowVisible(hwnd):
            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buff = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buff, length + 1)
                title = buff.value
                if "shotcut" in title.lower():
                    rect = wintypes.RECT()
                    user32.GetWindowRect(hwnd, ctypes.byref(rect))
                    if (rect.right - rect.left > 400) and (rect.bottom - rect.top > 300):
                        found = (hwnd, title, rect)
                        return False
        return True

    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
    return found


def format_timestamp(seconds: float) -> str:
    """Format seconds into HH:MM:SS,mmm timestamp for subtitles."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def extract_audio(input_media: str, output_audio: str, ffmpeg_path: str = None) -> bool:
    """Extract lightweight audio from video for speech recognition."""
    if not ffmpeg_path:
        ffmpeg_path = find_ffmpeg()
    if not ffmpeg_path:
        raise RuntimeError("FFmpeg not found! Please ensure Shotcut is installed.")
    cmd = [
        ffmpeg_path, "-y", "-i", input_media,
        "-vn", "-ar", "16000", "-ac", "1", "-b:a", "64k",
        output_audio
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return res.returncode == 0


def estimate_tokens(text: str) -> int:
    """Approximates token count for string."""
    if not text:
        return 0
    return max(1, int(len(text) / 3.8))


def count_conversation_tokens(messages: list) -> int:
    """Estimates total tokens across message stack."""
    total = 0
    for m in messages:
        total += 4 + estimate_tokens(m.get("content", ""))
    return total + 3


def prune_sliding_context(messages: list, max_tokens: int) -> list:
    """Sliding context window: drops oldest user/assistant turns while preserving system prompt."""
    if len(messages) <= 1:
        return messages[:]
    limit = max(1000, max_tokens)
    pruned = messages[:]
    curr = count_conversation_tokens(pruned)
    while curr > limit and len(pruned) > 2:
        pruned.pop(1)
        curr = count_conversation_tokens(pruned)
    return pruned
