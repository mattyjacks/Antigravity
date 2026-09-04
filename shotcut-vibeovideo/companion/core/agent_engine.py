"""
agent_engine.py - Orchestrates single-agent and multi-agent execution with 50+ video tools.
"""

import os
import json
import re
import urllib.request
import urllib.error

try:
    from .ffmpeg_utils import find_ffmpeg, count_conversation_tokens, prune_sliding_context
    from .commander import VibeoCommander
    from ..tools import (
        tool_trim_video, tool_convert_vertical, tool_change_speed,
        tool_reverse_video, tool_loop_video, tool_speed_ramp,
        tool_change_framerate, tool_compress_video, tool_split_scenes,
        tool_detect_black_frames, tool_detect_silence, tool_fade_audio,
        tool_normalize_loudness, tool_audio_ducking, tool_denoise_audio,
        tool_remove_audio, tool_mux_audio_video, tool_audio_waveform,
        tool_mlt_set_gain, generate_tts_audio, tool_add_watermark,
        tool_create_gif, tool_adjust_color, tool_blur_video,
        tool_color_lut, tool_flip_video, tool_rotate_video,
        tool_split_screen, tool_picture_in_picture, tool_render_progress_bar,
        tool_render_lower_third, tool_credits_roll, tool_slideshow_from_images,
        tool_concat_videos, tool_storyboard_grid, tool_extract_keyframes,
        tool_extract_thumbnail, tool_burn_timecode, generate_dalle_image,
        tool_modify_shotcut_mlt, tool_mlt_add_transition, tool_mlt_crop_filter,
        tool_mlt_blur_filter, tool_export_edl, tool_batch_rename,
        tool_calculate_stats, extract_audio_for_whisper, transcribe_whisper,
        convert_whisper_to_srt, tool_burn_subtitles, tool_extract_transcript,
        tool_generate_chapters, tool_extract_frame_jpeg,
        tool_capture_shotcut_preview_jpeg, tool_analyze_frame_vision,
        tool_auto_roughcut, tool_extract_viral_short, tool_generate_sfx
    )
except ImportError:
    from companion.core.ffmpeg_utils import find_ffmpeg, count_conversation_tokens, prune_sliding_context
    from companion.core.commander import VibeoCommander
    from companion.tools import (
        tool_trim_video, tool_convert_vertical, tool_change_speed,
        tool_reverse_video, tool_loop_video, tool_speed_ramp,
        tool_change_framerate, tool_compress_video, tool_split_scenes,
        tool_detect_black_frames, tool_detect_silence, tool_fade_audio,
        tool_normalize_loudness, tool_audio_ducking, tool_denoise_audio,
        tool_remove_audio, tool_mux_audio_video, tool_audio_waveform,
        tool_mlt_set_gain, generate_tts_audio, tool_add_watermark,
        tool_create_gif, tool_adjust_color, tool_blur_video,
        tool_color_lut, tool_flip_video, tool_rotate_video,
        tool_split_screen, tool_picture_in_picture, tool_render_progress_bar,
        tool_render_lower_third, tool_credits_roll, tool_slideshow_from_images,
        tool_concat_videos, tool_storyboard_grid, tool_extract_keyframes,
        tool_extract_thumbnail, tool_burn_timecode, generate_dalle_image,
        tool_modify_shotcut_mlt, tool_mlt_add_transition, tool_mlt_crop_filter,
        tool_mlt_blur_filter, tool_export_edl, tool_batch_rename,
        tool_calculate_stats, extract_audio_for_whisper, transcribe_whisper,
        convert_whisper_to_srt, tool_burn_subtitles, tool_extract_transcript,
        tool_generate_chapters, tool_extract_frame_jpeg,
        tool_capture_shotcut_preview_jpeg, tool_analyze_frame_vision,
        tool_auto_roughcut, tool_extract_viral_short, tool_generate_sfx
    )

SYSTEM_PROMPT = (
    "You are vibeoVideo Agent, an expert autonomous AI video editor copilot for Shotcut.\n"
    "You remember the entire conversation history across all turns.\n"
    "You have direct execution access to 50+ video editing tools including:\n"
    "- trim_video, convert_vertical, extract_audio, burn_subtitles, change_speed, extract_thumbnail, compress_video, modify_mlt\n"
    "- detect_silence, fade_audio, normalize_loudness, reverse_video, loop_video, add_watermark, split_scenes, create_gif\n"
    "- adjust_color, blur_video, audio_ducking, generate_chapters, color_lut, flip_video, rotate_video, denoise_audio\n"
    "- extract_keyframes, speed_ramp, render_progress_bar, concat_videos, extract_transcript, mux_audio_video, remove_audio\n"
    "- audio_waveform, storyboard_grid, render_lower_third, split_screen, picture_in_picture, change_framerate, detect_black_frames\n"
    "- credits_roll, slideshow_from_images, mlt_add_transition, mlt_set_gain, mlt_crop_filter, mlt_blur_filter, export_edl, batch_rename, calculate_stats, burn_timecode\n"
    "- extract_frame, capture_timeline_preview, analyze_frame, generate_subtitles, generate_voiceover, generate_broll\n\n"
    "When the user asks you to edit, transform, or generate video assets, explain your plan clearly AND output a tool block:\n"
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
        if tool_name == "trim_video":
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
