"""
subtitles_tools.py - Whisper AI transcription, SRT generation, and subtitle burn-in.
"""

import os
import json
import urllib.request
import urllib.error
import subprocess
from ..core.ffmpeg_utils import format_timestamp, extract_audio


def extract_audio_for_whisper(input_video: str, output_audio: str, ffmpeg_path: str = None) -> bool:
    """Extract audio stream converted to 16kHz mono MP3 for OpenAI Whisper."""
    return extract_audio(input_video, output_audio, ffmpeg_path)


def transcribe_whisper(audio_path: str, api_key: str) -> dict:
    """Send audio file to OpenAI Whisper API."""
    url = "https://api.openai.com/v1/audio/transcriptions"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    with open(audio_path, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(audio_path)
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"))
    body.extend(b"Content-Type: audio/mpeg\r\n\r\n")
    body.extend(file_bytes)
    body.extend(b"\r\n")

    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="model"\r\n\r\n')
    body.extend(b"whisper-1\r\n")

    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="response_format"\r\n\r\n')
    body.extend(b"verbose_json\r\n")

    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\n')
    body.extend(b"segment\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(url, data=bytes(body))
    req.add_header("Authorization", f"Bearer {api_key.strip()}")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Whisper API error: {err_msg}")


def convert_whisper_to_srt(whisper_data: dict, output_srt: str):
    """Convert Whisper JSON output with timestamps to standard SubRip (.srt) file."""
    segments = whisper_data.get("segments", [])
    lines = []
    for idx, seg in enumerate(segments, 1):
        start_ts = format_timestamp(seg.get("start", 0.0))
        end_ts = format_timestamp(seg.get("end", 0.0))
        text = seg.get("text", "").strip()

        lines.append(f"{idx}")
        lines.append(f"{start_ts} --> {end_ts}")
        lines.append(text)
        lines.append("")

    with open(output_srt, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def tool_burn_subtitles(ffmpeg: str, video_path: str, srt_path: str, output_path: str = None) -> str:
    """Burn .srt subtitles directly onto video frames."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
    if not os.path.exists(srt_path):
        raise FileNotFoundError(f"Subtitle file not found: {srt_path}")
    if not output_path:
        base, ext = os.path.splitext(video_path)
        output_path = f"{base}_subtitled{ext}"
    escaped_srt = srt_path.replace("\\", "/").replace(":", "\\:")
    cmd = [
        ffmpeg, "-y", "-i", video_path,
        "-vf", f"subtitles='{escaped_srt}':force_style='FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3'",
        "-c:v", "libx264", "-crf", "20", "-c:a", "copy",
        output_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg burn subtitles error: {res.stderr.decode('utf-8', errors='ignore')}")
    return output_path


def tool_extract_transcript(media_path: str, api_key: str, output_txt: str = None) -> str:
    """Transcribe media to readable narrative text transcript."""
    if not output_txt:
        b, _ = os.path.splitext(media_path)
        output_txt = f"{b}_transcript.txt"
    tmp_audio = f"{os.path.splitext(media_path)[0]}_trans_tmp.mp3"
    from ..core.ffmpeg_utils import find_ffmpeg
    ffmpeg = find_ffmpeg()
    extract_audio(media_path, tmp_audio, ffmpeg)
    try:
        data = transcribe_whisper(tmp_audio, api_key)
        text = data.get("text", "")
        with open(output_txt, "w", encoding="utf-8") as f:
            f.write(text)
    finally:
        if os.path.exists(tmp_audio):
            try:
                os.remove(tmp_audio)
            except Exception:
                pass
    return output_txt


def tool_generate_chapters(srt_path: str, output_path: str = None) -> str:
    """Generate YouTube/Vimeo chapters list from an SRT subtitle file."""
    if not output_path:
        b, _ = os.path.splitext(srt_path)
        output_path = f"{b}_youtube_chapters.txt"
    with open(srt_path, "r", encoding="utf-8") as f:
        content = f.read()
    blocks = content.strip().split("\n\n")
    chapters = ["00:00 Intro"]
    last_sec = 0
    for block in blocks:
        lines = block.splitlines()
        if len(lines) >= 3 and "-->" in lines[1]:
            ts = lines[1].split("-->")[0].strip().split(",")[0]
            h, m, s = ts.split(":")
            sec = int(h) * 3600 + int(m) * 60 + int(s)
            if sec - last_sec >= 30:  # new chapter every 30+ seconds
                text = " ".join(lines[2:])[:40]
                formatted = f"{m}:{s} {text}" if int(h) == 0 else f"{h}:{m}:{s} {text}"
                chapters.append(formatted)
                last_sec = sec
    res = "\n".join(chapters)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(res)
    return output_path
