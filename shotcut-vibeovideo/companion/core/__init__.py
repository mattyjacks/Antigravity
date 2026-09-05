"""
core module for vibeoVideo companion
"""
from .ffmpeg_utils import (
    find_ffmpeg, find_melt, find_shotcut_exe, find_shotcut_window,
    format_timestamp, extract_audio, get_media_duration_seconds,
    estimate_tokens, count_conversation_tokens, prune_sliding_context
)
from .media_tracker import MediaLibraryTracker
from .commander import VibeoCommander
from .shotcut_remote import (
    remote_play_pause, remote_split_clip, remote_ripple_delete,
    remote_step_frame_backward, remote_step_frame_forward, remote_undo,
    bring_shotcut_to_front
)


def __getattr__(name):
    if name in ("SYSTEM_PROMPT", "execute_video_tool"):
        from .agent_engine import SYSTEM_PROMPT, execute_video_tool
        if name == "SYSTEM_PROMPT":
            return SYSTEM_PROMPT
        return execute_video_tool
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
