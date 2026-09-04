"""
mlt_tools.py - Shotcut MLT project XML manipulation, transitions, filters, and EDL export.
"""

import os
import time
import shutil
import subprocess
import xml.etree.ElementTree as ET


def tool_modify_shotcut_mlt(mlt_path: str, filter_type: str, params: dict = None, output_path: str = None) -> str:
    """Inject a filter directly into Shotcut's MLT XML structure."""
    if not os.path.exists(mlt_path):
        raise FileNotFoundError(f"MLT file not found: {mlt_path}")
    if not output_path:
        base, ext = os.path.splitext(mlt_path)
        output_path = f"{base}_vibeo{ext}"
    params = params or {}
    tree = ET.parse(mlt_path)
    root = tree.getroot()

    tractor = root.find(".//tractor")
    parent = tractor if tractor is not None else root

    filter_elem = ET.SubElement(parent, "filter")
    filter_elem.set("id", f"vibeo_{filter_type}_{int(time.time())}")

    ET.SubElement(filter_elem, "property", name="mlt_service").text = filter_type
    for k, v in params.items():
        ET.SubElement(filter_elem, "property", name=k).text = str(v)

    tree.write(output_path, encoding="utf-8", xml_declaration=True)
    return output_path


def tool_mlt_add_transition(mlt_path: str, transition_type: str = "luma", duration_frames: int = 30, output_path: str = None) -> str:
    """Add transition into Shotcut .mlt XML."""
    output_path = output_path or f"{os.path.splitext(mlt_path)[0]}_transition.mlt"
    tree = ET.parse(mlt_path)
    root = tree.getroot()
    tractor = root.find(".//tractor")
    parent = tractor if tractor is not None else root
    trans = ET.SubElement(parent, "transition")
    trans.set("id", f"trans_{int(time.time())}")
    ET.SubElement(trans, "property", name="mlt_service").text = transition_type
    ET.SubElement(trans, "property", name="in").text = "0"
    ET.SubElement(trans, "property", name="out").text = str(duration_frames)
    tree.write(output_path, encoding="utf-8", xml_declaration=True)
    return output_path


def tool_mlt_crop_filter(mlt_path: str, top: int = 0, bottom: int = 0, left: int = 0, right: int = 0, output_path: str = None) -> str:
    """Insert crop filter into Shotcut .mlt XML."""
    output_path = output_path or f"{os.path.splitext(mlt_path)[0]}_cropped.mlt"
    tree = ET.parse(mlt_path)
    root = tree.getroot()
    tractor = root.find(".//tractor")
    parent = tractor if tractor is not None else root
    filt = ET.SubElement(parent, "filter")
    filt.set("id", f"crop_{int(time.time())}")
    ET.SubElement(filt, "property", name="mlt_service").text = "crop"
    ET.SubElement(filt, "property", name="top").text = str(top)
    ET.SubElement(filt, "property", name="bottom").text = str(bottom)
    ET.SubElement(filt, "property", name="left").text = str(left)
    ET.SubElement(filt, "property", name="right").text = str(right)
    tree.write(output_path, encoding="utf-8", xml_declaration=True)
    return output_path


def tool_mlt_blur_filter(mlt_path: str, blur_radius: float = 0.2, output_path: str = None) -> str:
    """Add blur filter into Shotcut .mlt XML."""
    output_path = output_path or f"{os.path.splitext(mlt_path)[0]}_blurred.mlt"
    tree = ET.parse(mlt_path)
    root = tree.getroot()
    tractor = root.find(".//tractor")
    parent = tractor if tractor is not None else root
    filt = ET.SubElement(parent, "filter")
    filt.set("id", f"blur_{int(time.time())}")
    ET.SubElement(filt, "property", name="mlt_service").text = "boxblur"
    ET.SubElement(filt, "property", name="radius").text = str(blur_radius)
    tree.write(output_path, encoding="utf-8", xml_declaration=True)
    return output_path


def tool_export_edl(mlt_path: str, output_edl_path: str = None) -> str:
    """Export Edit Decision List (EDL) CMX 3600 from MLT project."""
    output_edl_path = output_edl_path or f"{os.path.splitext(mlt_path)[0]}.edl"
    tree = ET.parse(mlt_path)
    root = tree.getroot()
    edl_lines = ["TITLE: SHOTCUT_PROJECT", "FCM: NON-DROP FRAME\n"]
    idx = 1
    for clip in root.findall(".//producer"):
        src = clip.find("property[@name='resource']")
        if src is not None and src.text:
            fn = os.path.basename(src.text)
            edl_lines.append(f"{idx:03d}  AX       V     C        00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00")
            edl_lines.append(f"* FROM CLIP NAME: {fn}\n")
            idx += 1
    with open(output_edl_path, "w", encoding="utf-8") as f:
        f.write("\n".join(edl_lines))
    return output_edl_path


def tool_batch_rename(folder_path: str, pattern: str = "{index:03d}_{name}", dry_run: bool = False) -> list:
    """Batch rename files with numbering pattern."""
    files = sorted([f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))])
    renamed = []
    for idx, fn in enumerate(files, 1):
        b, ext = os.path.splitext(fn)
        new_name = pattern.format(index=idx, name=b) + ext
        old_full = os.path.join(folder_path, fn)
        new_full = os.path.join(folder_path, new_name)
        if not dry_run and old_full != new_full:
            shutil.move(old_full, new_full)
        renamed.append({"old": fn, "new": new_name})
    return renamed


def tool_calculate_stats(ffmpeg: str, video_path: str) -> dict:
    """Calculate duration, dimensions, bitrates, and streams."""
    cmd = [ffmpeg, "-i", video_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stats = {"file": os.path.basename(video_path), "size_mb": round(os.path.getsize(video_path)/(1024*1024), 2)}
    for l in res.stderr.splitlines():
        if "Duration:" in l:
            stats["duration"] = l.split("Duration:")[1].split(",")[0].strip()
            stats["bitrate"] = l.split("bitrate:")[1].strip() if "bitrate:" in l else "unknown"
        elif "Stream #" in l and "Video:" in l:
            stats["video_stream"] = l.split("Video:")[1].strip()
        elif "Stream #" in l and "Audio:" in l:
            stats["audio_stream"] = l.split("Audio:")[1].strip()
    return stats


def parse_mlt_project(mlt_file: str) -> dict:
    """Parse Shotcut .mlt file to inspect tracks, media files, and filters."""
    tree = ET.parse(mlt_file)
    root = tree.getroot()
    producers = []
    for p in root.findall(".//producer"):
        pid = p.attrib.get("id", "")
        res = p.find("property[@name='resource']")
        length = p.find("property[@name='length']")
        if res is not None and res.text:
            producers.append({
                "id": pid,
                "source": res.text,
                "length": length.text if length is not None else "unknown"
            })
    return {
        "file": mlt_file,
        "producers_count": len(producers),
        "producers": producers
    }
