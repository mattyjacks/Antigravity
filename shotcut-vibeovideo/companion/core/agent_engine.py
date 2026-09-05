"""
agent_engine.py - Orchestrates single-agent and multi-agent execution with 50+ video tools.
"""

import os
import json
import re
import urllib.request
import urllib.error

import sys
from pathlib import Path

# Ensure companion and root directory are in sys.path
_current_dir = Path(__file__).resolve().parent
_companion_dir = _current_dir.parent
_root_dir = _companion_dir.parent
for _p in [str(_root_dir), str(_companion_dir), str(_current_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from companion.core.ffmpeg_utils import find_ffmpeg, count_conversation_tokens, prune_sliding_context
    from companion.core.commander import VibeoCommander
    from companion.tools.audio_tools import (
        tool_detect_silence, tool_fade_audio, tool_normalize_loudness,
        tool_audio_ducking, tool_denoise_audio, tool_remove_audio,
        tool_mux_audio_video, tool_audio_waveform, tool_mlt_set_gain,
        generate_tts_audio
    )
    from companion.tools.video_edit_tools import (
        tool_trim_video, tool_convert_vertical, tool_change_speed,
        tool_reverse_video, tool_loop_video, tool_speed_ramp,
        tool_change_framerate, tool_compress_video, tool_split_scenes,
        tool_detect_black_frames
    )
    from companion.tools.visual_fx_tools import (
        tool_add_watermark, tool_create_gif, tool_adjust_color,
        tool_blur_video, tool_color_lut, tool_flip_video,
        tool_rotate_video, tool_split_screen, tool_picture_in_picture,
        tool_render_progress_bar, tool_render_lower_third, tool_credits_roll,
        tool_slideshow_from_images, tool_concat_videos, tool_storyboard_grid,
        tool_extract_keyframes, tool_extract_thumbnail, tool_burn_timecode,
        generate_dalle_image
    )
    from companion.tools.mlt_tools import (
        tool_add_to_timeline, tool_modify_shotcut_mlt, tool_mlt_add_transition,
        tool_mlt_crop_filter, tool_mlt_blur_filter, tool_export_edl,
        tool_batch_rename, tool_calculate_stats, parse_mlt_project, tool_evaluate_timeline
    )
    from companion.tools.subtitles_tools import (
        extract_audio_for_whisper, transcribe_whisper,
        convert_whisper_to_srt, tool_burn_subtitles, tool_extract_transcript,
        tool_generate_chapters
    )
    from companion.tools.vision_tools import (
        tool_extract_frame_jpeg, tool_capture_shotcut_preview_jpeg,
        tool_analyze_frame_vision
    )
    from companion.tools.auto_director_tools import (
        tool_auto_roughcut, tool_extract_viral_short
    )
    from companion.tools.sfx_tools import tool_generate_sfx
    from companion.tools.element_tools import (
        tool_add_element_to_timeline, tool_auto_add_elements,
        list_shotcut_elements, resolve_shotcut_element
    )
    from companion.tools.multiverse_tools import (
        tool_create_multiverse_timelines, tool_branch_timeline_universe
    )
except ImportError:
    from core.ffmpeg_utils import find_ffmpeg, count_conversation_tokens, prune_sliding_context
    from core.commander import VibeoCommander
    from tools.audio_tools import (
        tool_detect_silence, tool_fade_audio, tool_normalize_loudness,
        tool_audio_ducking, tool_denoise_audio, tool_remove_audio,
        tool_mux_audio_video, tool_audio_waveform, tool_mlt_set_gain,
        generate_tts_audio
    )
    from tools.video_edit_tools import (
        tool_trim_video, tool_convert_vertical, tool_change_speed,
        tool_reverse_video, tool_loop_video, tool_speed_ramp,
        tool_change_framerate, tool_compress_video, tool_split_scenes,
        tool_detect_black_frames
    )
    from tools.visual_fx_tools import (
        tool_add_watermark, tool_create_gif, tool_adjust_color,
        tool_blur_video, tool_color_lut, tool_flip_video,
        tool_rotate_video, tool_split_screen, tool_picture_in_picture,
        tool_render_progress_bar, tool_render_lower_third, tool_credits_roll,
        tool_slideshow_from_images, tool_concat_videos, tool_storyboard_grid,
        tool_extract_keyframes, tool_extract_thumbnail, tool_burn_timecode,
        generate_dalle_image
    )
    from tools.mlt_tools import (
        tool_add_to_timeline, tool_modify_shotcut_mlt, tool_mlt_add_transition,
        tool_mlt_crop_filter, tool_mlt_blur_filter, tool_export_edl,
        tool_batch_rename, tool_calculate_stats, parse_mlt_project, tool_evaluate_timeline
    )
    from tools.subtitles_tools import (
        extract_audio_for_whisper, transcribe_whisper,
        convert_whisper_to_srt, tool_burn_subtitles, tool_extract_transcript,
        tool_generate_chapters
    )
    from tools.vision_tools import (
        tool_extract_frame_jpeg, tool_capture_shotcut_preview_jpeg,
        tool_analyze_frame_vision
    )
    from tools.auto_director_tools import (
        tool_auto_roughcut, tool_extract_viral_short
    )
    from tools.sfx_tools import tool_generate_sfx
    from tools.element_tools import (
        tool_add_element_to_timeline, tool_auto_add_elements,
        list_shotcut_elements, resolve_shotcut_element
    )
    from tools.multiverse_tools import (
        tool_create_multiverse_timelines, tool_branch_timeline_universe
    )

SYSTEM_PROMPT = (
    "You are vibeoVideo Agent, an expert autonomous AI video editor copilot for Shotcut.\n"
    "You remember the entire conversation history across all turns.\n"
    "You have direct execution access to 50+ video editing tools including:\n"
    "- add_to_timeline, create_multiverse_timelines, branch_timeline_universe, overlay_shotcut_element, auto_add_elements, list_shotcut_elements, trim_video, convert_vertical, extract_audio, burn_subtitles, change_speed, extract_thumbnail, compress_video, modify_mlt\n"
    "- detect_silence, fade_audio, normalize_loudness, reverse_video, loop_video, add_watermark, split_scenes, create_gif\n"
    "- adjust_color, blur_video, audio_ducking, generate_chapters, color_lut, flip_video, rotate_video, denoise_audio\n"
    "- extract_keyframes, speed_ramp, render_progress_bar, concat_videos, extract_transcript, mux_audio_video, remove_audio\n"
    "- audio_waveform, storyboard_grid, render_lower_third, split_screen, picture_in_picture, change_framerate, detect_black_frames\n"
    "- credits_roll, slideshow_from_images, mlt_add_transition, mlt_set_gain, mlt_crop_filter, mlt_blur_filter, export_edl, batch_rename, calculate_stats, burn_timecode\n"
    "- extract_frame, capture_timeline_preview, analyze_frame, generate_subtitles, generate_voiceover, generate_broll, auto_roughcut, extract_viral_short, generate_sfx\n\n"
    "Special Behaviors:\n"
    "1. When the user provides a video or media file path (without specifying an explicit action), your default action is to load it onto the Shotcut timeline using 'add_to_timeline' and present helpful recommended next editing options (e.g., auto_roughcut to cut silences, extract_viral_short for vertical TikTok/Reels, subtitles, or color LUTs).\n"
    "2. When the user requests to use elements from Shotcut's library (emojis, animated stickers, graphics, sounds, text, balloons, fireworks, confetti, halloween, subscribe, etc.), use 'overlay_shotcut_element' (to place an element at a timestamp on a dedicated V2 timeline track) or 'auto_add_elements' (to automatically distribute themed elements across the video on a dedicated timeline track).\n"
    "3. When the user asks for multi-versal timelines, multiple parallel cuts at once, or branching timelines, invoke 'create_multiverse_timelines' to generate 5 parallel universes simultaneously (Universe Alpha: Director's Cut, Universe Beta: Viral Fast Cut, Universe Gamma: Elements & Overlays, Universe Delta: Split-Screen A/B Matrix, and Universe Omega: All-in-One Multi-Track Master Stack).\n"
    "4. When the user asks you to edit, transform, or generate video assets, explain your plan clearly AND output a tool block:\n"
    "```json\n"
    "{\n"
    '  "tool": "tool_name",\n'
    '  "parameters": { ... }\n'
    "}\n"
    "```"
)


def execute_video_tool(tool_name: str, params: dict, ffmpeg: str = None, api_key: str = "", media_tracker=None) -> str:
    """Executes any of the 50+ video tools with automatic media tracking."""
    if not ffmpeg:
        ffmpeg = find_ffmpeg()
    out = None

    try:
        if tool_name == "add_to_timeline":
            inp = params.get("input_path") or params.get("video_path") or params.get("media_path", "")
            mlt = params.get("mlt_path", None)
            start = params.get("in_time") or params.get("start_time") or "00:00:00"
            end = params.get("out_time") or params.get("end_time") or None
            open_sc = bool(params.get("open_in_shotcut", True))
            out = tool_add_to_timeline(ffmpeg, inp, mlt_path=mlt, in_time=start, out_time=end,
                                      output_path=params.get("output_path"), open_in_shotcut=open_sc)
            sc_msg = " and opened in Shotcut" if open_sc else ""
            return f"✅ Added {os.path.basename(inp)} to Shotcut timeline{sc_msg} -> {out}"

        elif tool_name in ("overlay_shotcut_element", "add_element_to_timeline"):
            inp = params.get("input_path") or params.get("video_path") or params.get("media_path") or params.get("mlt_path", "")
            elem = params.get("element_name") or params.get("element") or params.get("query", "confetti")
            ts = str(params.get("timestamp") or "00:00:02")
            dur = float(params.get("duration_sec", 3.5))
            pos = params.get("position", "bottom_right")
            sc = float(params.get("scale", 1.0))
            sfx = params.get("sound_effect", None)
            open_sc = bool(params.get("open_in_shotcut", True))
            out = tool_add_element_to_timeline(
                ffmpeg=ffmpeg, input_video_or_mlt=inp, element_name=elem,
                timestamp=ts, duration_sec=dur, position=pos, scale=sc,
                sound_effect=sfx, output_path=params.get("output_path"),
                open_in_shotcut=open_sc
            )
            return f"✅ Shotcut library element '{elem}' placed on dedicated timeline track (V2) at {ts} -> {out}"

        elif tool_name == "auto_add_elements":
            inp = params.get("input_path") or params.get("video_path") or params.get("media_path") or params.get("mlt_path", "")
            theme = params.get("theme", "celebration")
            count = int(params.get("count", 4))
            interval = float(params.get("interval_sec", 0.0)) if params.get("interval_sec") else None
            pos = params.get("position", "bottom_right")
            snd = bool(params.get("sound_sync", True))
            open_sc = bool(params.get("open_in_shotcut", True))
            res = tool_auto_add_elements(
                ffmpeg=ffmpeg, input_video_or_mlt=inp, theme=theme,
                count=count, interval_sec=interval, position=pos,
                sound_sync=snd, output_path=params.get("output_path"),
                open_in_shotcut=open_sc
            )
            out = res["mlt_project"]
            return f"✅ Automatically placed {res['count']} '{theme}' Shotcut elements on dedicated timeline track (V2) -> {out}"

        elif tool_name == "list_shotcut_elements":
            cat = params.get("category", None)
            q = params.get("query", None)
            matches = list_shotcut_elements(category=cat, query=q)
            names = [m["name"] for m in matches[:25]]
            return f"✅ Found {len(matches)} Shotcut elements matching '{q or cat or 'all'}': {names}"

        elif tool_name in ("create_multiverse_timelines", "generate_multiverse_timelines", "multiverse_timelines"):
            inp = params.get("input_path") or params.get("video_path") or params.get("media_path", "")
            prim = params.get("primary_universe", "omega")
            open_sc = bool(params.get("open_in_shotcut", True))
            res = tool_create_multiverse_timelines(ffmpeg, inp, open_in_shotcut=open_sc, primary_universe=prim)
            lines = [f"🌌 Multi-Versal Timelines Created ({res['universes_count']} Parallel Universes at once):"]
            for u_key, u_val in res["universes"].items():
                lines.append(f"  • {u_val['name']} ({u_val['duration_sec']}s): {u_val['style']}")
                lines.append(f"    -> {u_val['file']}")
            lines.append(f"\n🚀 Active Universe Loaded into Shotcut: {res['active_file']}")
            return "\n".join(lines)

        elif tool_name == "branch_timeline_universe":
            mlt = params.get("mlt_path") or params.get("input_path", "")
            br = params.get("branch_name", "alternate_universe")
            mod = params.get("modification_type", "custom")
            open_sc = bool(params.get("open_in_shotcut", True))
            out = tool_branch_timeline_universe(mlt, br, modification_type=mod, open_in_shotcut=open_sc)
            return f"🌌 Branched new parallel timeline universe '{br}' -> {out}"

        elif tool_name in ("evaluate_timeline", "re_evaluate_timeline", "analyze_timeline"):
            mlt = params.get("mlt_path") or params.get("project_path") or params.get("input_path", "")
            prev = params.get("previous_clip_count", None)
            res = tool_evaluate_timeline(mlt, previous_clip_count=prev)
            return res.get("report", f"Evaluated timeline: {mlt}")

        elif tool_name == "trim_video":
            inp = params.get("input_path", "")
            start = params.get("start_time", "00:00:00")
            end = params.get("end_time", "00:00:10")
            out = tool_trim_video(ffmpeg, inp, start, end, params.get("output_path"))
            return f"✅ Video trimmed successfully -> {out}"

        elif tool_name == "convert_vertical":
            inp = params.get("input_path", "")
            blur_bg = bool(params.get("blur_background", True))
            out = tool_convert_vertical(ffmpeg, inp, blur_bg, params.get("output_path"))
            return f"✅ Converted to 9:16 vertical video -> {out}"

        elif tool_name == "change_speed":
            inp = params.get("input_path", "")
            spd = float(params.get("speed", 1.0))
            out = tool_change_speed(ffmpeg, inp, spd, params.get("output_path"))
            return f"✅ Video speed adjusted ({spd}x) -> {out}"

        elif tool_name == "extract_thumbnail":
            inp = params.get("input_path", "")
            ts = params.get("timestamp", "00:00:01")
            out = tool_extract_thumbnail(ffmpeg, inp, ts, params.get("output_path"))
            return f"✅ Video thumbnail extracted -> {out}"

        elif tool_name == "compress_video":
            inp = params.get("input_path", "")
            crf = int(params.get("crf", 28))
            out = tool_compress_video(ffmpeg, inp, crf, params.get("output_path"))
            return f"✅ Video compressed (CRF {crf}) -> {out}"

        elif tool_name == "modify_mlt":
            mlt = params.get("mlt_path", "")
            old_s = params.get("old_source", "")
            new_s = params.get("new_source", "")
            out = tool_modify_shotcut_mlt(mlt, old_s, new_s, params.get("output_path"))
            return f"✅ Shotcut project modified -> {out}"

        elif tool_name == "detect_silence":
            inp = params.get("input_path", "")
            db = float(params.get("noise_tolerance_db", -30.0))
            dur = float(params.get("min_silence_sec", 0.5))
            res = tool_detect_silence(ffmpeg, inp, db, dur)
            return f"✅ Detected {len(res)} silent intervals in audio."

        elif tool_name == "fade_audio":
            inp = params.get("input_path", "")
            fin = float(params.get("fade_in_sec", 2.0))
            fout = float(params.get("fade_out_sec", 2.0))
            out = tool_fade_audio(ffmpeg, inp, fin, fout, params.get("output_path"))
            return f"✅ Audio fade applied -> {out}"

        elif tool_name == "normalize_loudness":
            inp = params.get("input_path", "")
            target_lufs = float(params.get("target_lufs", -14.0))
            out = tool_normalize_loudness(ffmpeg, inp, target_lufs, params.get("output_path"))
            return f"✅ Loudness normalized to {target_lufs} LUFS -> {out}"

        elif tool_name == "reverse_video":
            inp = params.get("input_path", "")
            out = tool_reverse_video(ffmpeg, inp, params.get("output_path"))
            return f"✅ Video reversed -> {out}"

        elif tool_name == "loop_video":
            inp = params.get("input_path", "")
            loop_c = int(params.get("loop_count", 2))
            out = tool_loop_video(ffmpeg, inp, loop_c, params.get("output_path"))
            return f"✅ Video looped {loop_c}x -> {out}"

        elif tool_name == "add_watermark":
            vid = params.get("video_path", "")
            wm = params.get("watermark_image", "")
            pos = params.get("position", "bottom_right")
            out = tool_add_watermark(ffmpeg, vid, wm, pos, params.get("output_path"))
            return f"✅ Watermark added ({pos}) -> {out}"

        elif tool_name == "split_scenes":
            inp = params.get("input_path", "")
            thresh = float(params.get("threshold", 0.3))
            out_scenes = tool_split_scenes(ffmpeg, inp, thresh)
            return f"✅ Scene split completed: {len(out_scenes)} scenes detected."

        elif tool_name == "create_gif":
            inp = params.get("input_path", "")
            st = params.get("start_time", "00:00:00")
            dur = float(params.get("duration", 3.0))
            fps = int(params.get("fps", 12))
            w = int(params.get("width", 480))
            out = tool_create_gif(ffmpeg, inp, st, dur, fps, w, params.get("output_path"))
            return f"✅ Animated GIF created -> {out}"

        elif tool_name == "adjust_color":
            inp = params.get("input_path", "")
            b = float(params.get("brightness", 0.0))
            c = float(params.get("contrast", 1.0))
            s = float(params.get("saturation", 1.0))
            out = tool_adjust_color(ffmpeg, inp, b, c, s, params.get("output_path"))
            return f"✅ Color adjustments applied -> {out}"

        elif tool_name == "blur_video":
            inp = params.get("input_path", "")
            rad = int(params.get("blur_radius", 10))
            out = tool_blur_video(ffmpeg, inp, rad, params.get("output_path"))
            return f"✅ Box blur applied -> {out}"

        elif tool_name == "audio_ducking":
            bg = params.get("background_audio", "")
            v = params.get("voice_audio", "")
            out = tool_audio_ducking(ffmpeg, bg, v, params.get("output_path"))
            return f"✅ Audio ducking complete -> {out}"

        elif tool_name == "generate_chapters":
            inp = params.get("input_path", "")
            out = tool_generate_chapters(inp, params.get("output_path"))
            return f"✅ YouTube chapter timestamps generated -> {out}"

        elif tool_name == "color_lut":
            inp = params.get("input_path", "")
            lut = params.get("lut_name", "warm")
            out = tool_color_lut(ffmpeg, inp, lut, params.get("output_path"))
            return f"✅ Color LUT grading ({lut}) applied -> {out}"

        elif tool_name == "flip_video":
            inp = params.get("input_path", "")
            d = params.get("direction", "horizontal")
            out = tool_flip_video(ffmpeg, inp, d, params.get("output_path"))
            return f"✅ Video flipped {d} -> {out}"

        elif tool_name == "rotate_video":
            inp = params.get("input_path", "")
            deg = int(params.get("degrees", 90))
            out = tool_rotate_video(ffmpeg, inp, deg, params.get("output_path"))
            return f"✅ Video rotated {deg}° -> {out}"

        elif tool_name == "denoise_audio":
            inp = params.get("input_path", "")
            out = tool_denoise_audio(ffmpeg, inp, params.get("output_path"))
            return f"✅ Audio background noise reduced -> {out}"

        elif tool_name == "extract_keyframes":
            inp = params.get("input_path", "")
            out = tool_extract_keyframes(ffmpeg, inp, params.get("output_dir"))
            return f"✅ Keyframes / I-Frames extracted to: {out}"

        elif tool_name == "speed_ramp":
            inp = params.get("input_path", "")
            sp = float(params.get("speed_multiplier", 2.0))
            out = tool_speed_ramp(ffmpeg, inp, sp, params.get("output_path"))
            return f"✅ Speed ramp applied ({sp}x) -> {out}"

        elif tool_name == "render_progress_bar":
            inp = params.get("input_path", "")
            col = params.get("bar_color", "red")
            h = int(params.get("bar_height", 8))
            out = tool_render_progress_bar(ffmpeg, inp, col, h, params.get("output_path"))
            return f"✅ Video progress bar rendered -> {out}"

        elif tool_name == "concat_videos":
            vids = params.get("video_paths", [])
            out = tool_concat_videos(ffmpeg, vids, params.get("output_path"))
            return f"✅ Concatenated {len(vids)} clips -> {out}"

        elif tool_name == "extract_transcript":
            inp = params.get("media_path", "")
            out = tool_extract_transcript(inp, api_key, params.get("output_path"))
            return f"✅ Transcript generated (.txt) -> {out}"

        elif tool_name == "mux_audio_video":
            vid = params.get("video_path", "")
            aud = params.get("audio_path", "")
            out = tool_mux_audio_video(ffmpeg, vid, aud, params.get("output_path"))
            return f"✅ Audio stream remuxed into video -> {out}"

        elif tool_name == "remove_audio":
            inp = params.get("input_path", "")
            out = tool_remove_audio(ffmpeg, inp, params.get("output_path"))
            return f"✅ Video audio stripped -> {out}"

        elif tool_name == "audio_waveform":
            inp = params.get("input_path", "")
            col = params.get("color", "cyan")
            out = tool_audio_waveform(ffmpeg, inp, col, params.get("output_path"))
            return f"✅ Visual waveform animation generated -> {out}"

        elif tool_name == "storyboard_grid":
            inp = params.get("input_path", "")
            cols = int(params.get("columns", 4))
            rows = int(params.get("rows", 3))
            out = tool_storyboard_grid(ffmpeg, inp, cols, rows, params.get("output_path"))
            return f"✅ Storyboard contact sheet created -> {out}"

        elif tool_name == "render_lower_third":
            inp = params.get("input_path", "")
            t1 = params.get("title", "")
            t2 = params.get("subtitle", "")
            out = tool_render_lower_third(ffmpeg, inp, t1, t2, params.get("output_path"))
            return f"✅ Lower third title graphic rendered -> {out}"

        elif tool_name == "split_screen":
            v1 = params.get("video1_path", "")
            v2 = params.get("video2_path", "")
            mode = params.get("layout", "horizontal")
            out = tool_split_screen(ffmpeg, v1, v2, mode, params.get("output_path"))
            return f"✅ Split screen video composed ({mode}) -> {out}"

        elif tool_name == "picture_in_picture":
            bg = params.get("background_video", "")
            ov = params.get("overlay_video", "")
            pos = params.get("position", "bottom_right")
            sc = float(params.get("scale", 0.3))
            out = tool_picture_in_picture(ffmpeg, bg, ov, pos, sc, params.get("output_path"))
            return f"✅ Picture-in-Picture composition created -> {out}"

        elif tool_name == "change_framerate":
            inp = params.get("input_path", "")
            fps = int(params.get("target_fps", 60))
            out = tool_change_framerate(ffmpeg, inp, fps, params.get("output_path"))
            return f"✅ Video framerate converted to {fps}fps -> {out}"

        elif tool_name == "detect_black_frames":
            inp = params.get("input_path", "")
            out_black = tool_detect_black_frames(ffmpeg, inp)
            return f"✅ Black frame detection finished: {len(out_black)} segments found."

        elif tool_name == "credits_roll":
            txt = params.get("credits_text", "")
            dur = float(params.get("duration", 8.0))
            out = tool_credits_roll(ffmpeg, txt, dur, params.get("output_path"))
            return f"✅ End credits roll animation generated -> {out}"

        elif tool_name == "slideshow_from_images":
            imgs = params.get("image_paths", [])
            dur = float(params.get("slide_duration", 3.0))
            out = tool_slideshow_from_images(ffmpeg, imgs, dur, params.get("output_path"))
            return f"✅ Photo slideshow video created -> {out}"

        elif tool_name == "mlt_add_transition":
            mlt = params.get("mlt_path", "")
            ttype = params.get("transition_type", "dissolve")
            dur = int(params.get("duration_frames", 30))
            out = tool_mlt_add_transition(mlt, ttype, dur, params.get("output_path"))
            return f"✅ Shotcut transition inserted -> {out}"

        elif tool_name == "mlt_set_gain":
            mlt = params.get("mlt_path", "")
            gain_db = float(params.get("gain_db", 3.0))
            out = tool_mlt_set_gain(mlt, gain_db, params.get("output_path"))
            return f"✅ MLT audio gain filter inserted ({gain_db} dB) -> {out}"

        elif tool_name == "mlt_crop_filter":
            mlt = params.get("mlt_path", "")
            t = int(params.get("top", 0))
            b = int(params.get("bottom", 0))
            l = int(params.get("left", 0))
            r = int(params.get("right", 0))
            out = tool_mlt_crop_filter(mlt, t, b, l, r, params.get("output_path"))
            return f"✅ MLT crop filter inserted -> {out}"

        elif tool_name == "mlt_blur_filter":
            mlt = params.get("mlt_path", "")
            rad = float(params.get("radius", 0.2))
            out = tool_mlt_blur_filter(mlt, rad, params.get("output_path"))
            return f"✅ MLT blur filter inserted -> {out}"

        elif tool_name == "export_edl":
            mlt = params.get("mlt_path", "")
            out = tool_export_edl(mlt, params.get("output_path"))
            return f"✅ CMX 3600 EDL exported -> {out}"

        elif tool_name == "batch_rename":
            d = params.get("directory", "")
            pat = params.get("pattern", "clip_{idx}")
            ext = params.get("ext", ".mp4")
            out_renamed = tool_batch_rename(d, pat, ext)
            return f"✅ Batch renamed {len(out_renamed)} media files."

        elif tool_name == "calculate_stats":
            inp = params.get("input_path", "")
            st = tool_calculate_stats(ffmpeg, inp)
            return f"✅ Media metadata calculated: {json.dumps(st, indent=2)}"

        elif tool_name == "burn_timecode":
            inp = params.get("input_path", "")
            fps = int(params.get("fps", 30))
            out = tool_burn_timecode(ffmpeg, inp, fps, params.get("output_path"))
            return f"✅ SMPTE visual timecode burned into clip -> {out}"

        elif tool_name == "extract_frame":
            inp = params.get("input_path", "")
            ts = params.get("timestamp", "00:00:01")
            out = tool_extract_frame_jpeg(ffmpeg, inp, ts, params.get("output_path"))
            return f"✅ Frame JPEG extracted -> {out}"

        elif tool_name == "capture_timeline_preview":
            out = tool_capture_shotcut_preview_jpeg(params.get("output_path"))
            return f"✅ Captured live Shotcut timeline preview JPEG -> {out}"

        elif tool_name == "analyze_frame":
            inp = params.get("input_path", "")
            ts = params.get("timestamp", "00:00:01")
            user_pmt = params.get("prompt", "")
            ext = os.path.splitext(inp)[1].lower() if inp else ""
            if ext in [".jpg", ".jpeg", ".png", ".webp"]:
                target_jpeg = inp
            elif inp:
                target_jpeg = tool_extract_frame_jpeg(ffmpeg, inp, ts)
            else:
                target_jpeg = tool_capture_shotcut_preview_jpeg()

            vision_res = tool_analyze_frame_vision(api_key, target_jpeg, user_pmt)
            out = target_jpeg
            return f"✅ Frame Composition Analysis ({os.path.basename(target_jpeg)}):\n\n{vision_res.get('analysis')}"

        elif tool_name == "auto_roughcut":
            inp = params.get("input_path", "")
            db = float(params.get("noise_tolerance_db", -30.0))
            dur = float(params.get("min_silence_sec", 0.5))
            res = tool_auto_roughcut(ffmpeg, inp, db, dur, params.get("output_path"))
            out = res["mlt_project"]
            return f"✅ Auto-Roughcut MLT timeline generated: {res['clips_count']} clips ({res['seconds_saved']}s dead-air removed) -> {out}"

        elif tool_name == "extract_viral_short":
            inp = params.get("input_path", "")
            dur_sec = int(params.get("duration_sec", 35))
            out = tool_extract_viral_short(ffmpeg, inp, api_key, dur_sec, params.get("output_path"))
            return f"✅ Viral 9:16 vertical short generated with subtitles -> {out}"

        elif tool_name == "burn_subtitles":
            inp = params.get("video_path") or params.get("input_path", "")
            srt = params.get("srt_path", "")
            out = tool_burn_subtitles(ffmpeg, inp, srt, params.get("output_path"))
            return f"✅ Hardcoded subtitles burned into video -> {out}"

        elif tool_name == "generate_subtitles":
            inp = params.get("media_path") or params.get("input_path") or params.get("video_path", "")
            if not inp or not os.path.exists(inp):
                raise FileNotFoundError(f"Media file not found: {inp}")
            base, _ = os.path.splitext(inp)
            temp_mp3 = f"{base}_vibeo_whisper_tmp.mp3"
            out_srt = params.get("output_path") or f"{base}.srt"
            extract_audio_for_whisper(inp, temp_mp3, ffmpeg)
            w_data = transcribe_whisper(temp_mp3, api_key)
            if os.path.exists(temp_mp3):
                os.remove(temp_mp3)
            convert_whisper_to_srt(w_data, out_srt)
            out = out_srt
            return f"✅ Synchronized subtitles (.srt) generated -> {out}"

        elif tool_name == "generate_voiceover":
            txt = params.get("text", "")
            voice = params.get("voice", "alloy")
            out = generate_tts_audio(txt, voice, api_key, params.get("output_path"))
            return f"✅ Studio TTS voiceover synthesized ({voice}) -> {out}"

        elif tool_name == "generate_broll":
            pmt = params.get("prompt", "")
            sz = params.get("size", "1024x1024")
            out = generate_dalle_image(pmt, api_key, sz, params.get("output_path"))
            return f"✅ Visual B-Roll generated via DALL-E 3 -> {out}"

        elif tool_name == "generate_sfx":
            sfx_t = params.get("sfx_type", "whoosh")
            out = tool_generate_sfx(sfx_t, params.get("output_path"))
            return f"✅ Sound effect ({sfx_t}) synthesized -> {out}"

        else:
            return f"⚠️ Unknown tool requested: {tool_name}"
    except Exception as err:
        return f"❌ Tool execution failed: {err}"
    finally:
        if media_tracker:
            for k in ("input_path", "video_path", "media_path", "audio_path", "voice_path", "music_path", "background_video", "overlay_video", "video1_path", "video2_path"):
                if k in params and params[k]:
                    media_tracker.track_file(str(params[k]))
            if out and isinstance(out, str) and os.path.exists(out):
                media_tracker.track_file(out)
            media_tracker.record_action(tool_name, {"parameters": params, "result": str(out)})
