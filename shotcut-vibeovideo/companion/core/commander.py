"""
commander.py - Hierarchical Sub-Agent Swarm Orchestrator and Consensus Synthesizer.
"""

import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed


class VibeoCommander:
    """Orchestrates multiple specialized AI sub-agents in parallel and synthesizes consensus."""
    def __init__(self, api_key: str, model: str = "gpt-5.6-luna"):
        self.api_key = api_key
        self.model = model
        self.url = "https://api.openai.com/v1/chat/completions"

    def _call_sub_agent(self, agent_name: str, system_role: str, user_prompt: str) -> dict:
        messages = [
            {"role": "system", "content": system_role},
            {"role": "user", "content": user_prompt}
        ]
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.6,
            "max_tokens": 500
        }
        try:
            req = urllib.request.Request(
                self.url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            )
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data["choices"][0]["message"]["content"].strip()
                return {"name": agent_name, "content": content, "status": "success"}
        except Exception as e:
            return {"name": agent_name, "content": f"Sub-agent error: {e}", "status": "error"}

    def orchestrate(self, user_msg: str, chat_history: list = None, status_callback=None) -> dict:
        """Runs sub-agents concurrently, collects reports, and synthesizes final edit directives."""
        sub_agents = {
            "ScriptAgent": "You are ScriptAgent, expert video narrative designer and dialogue editor. Analyze viral retention, hook structure, and script subtitles.",
            "TimelineAgent": "You are TimelineAgent, expert video cutter and MLT timeline pacing engineer. Analyze scene cuts, trim timestamps, transitions, and speed curves.",
            "StylistAgent": "You are StylistAgent, creative visual colorist and graphic artist. Recommend aspect ratios (16:9 vs 9:16 vertical), lower-thirds, LUTs, and DALL-E 3 B-Roll.",
            "AudioAgent": "You are AudioAgent, sound engineer and voice director. Focus on loudness normalization (-14 LUFS), audio ducking, background noise reduction, and TTS voiceover.",
            "ReviewerAgent": "You are ReviewerAgent, film QC inspector. Audit file format compatibility, black frame transitions, and subtitle sync accuracy."
        }

        reports = {}
        if status_callback:
            status_callback("Launching parallel sub-agent swarm...")

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(self._call_sub_agent, name, prompt, user_msg): name
                for name, prompt in sub_agents.items()
            }
            for future in as_completed(futures):
                name = futures[future]
                try:
                    res = future.result()
                    reports[name] = res.get("content", "")
                    if status_callback:
                        status_callback(f"Sub-agent '{name}' completed report.")
                except Exception as e:
                    reports[name] = f"Error: {e}"

        # Executive Commander Synthesis
        if status_callback:
            status_callback("Commander synthesizing multi-agent consensus...")

        synth_prompt = (
            f"User Instruction: {user_msg}\n\n"
            "Sub-Agent Expert Reports:\n"
            + "\n\n".join([f"--- {k} ---\n{v}" for k, v in reports.items()])
            + "\n\nSynthesize these recommendations into an executive production plan. "
            "If an executable video tool is required, include the exact JSON tool block."
        )

        synth_messages = [
            {"role": "system", "content": "You are vibeoVideo Commander, Supreme Director of the Multi-Agent Video Swarm."},
            {"role": "user", "content": synth_prompt}
        ]

        try:
            req = urllib.request.Request(
                self.url,
                data=json.dumps({
                    "model": self.model,
                    "messages": synth_messages,
                    "temperature": 0.7,
                    "max_tokens": 1200
                }).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                synthesis_text = data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            synthesis_text = f"Commander synthesis completed with local summary:\n" + "\n".join([f"• {k}: {v[:100]}..." for k, v in reports.items()])

        return {
            "synthesis": synthesis_text,
            "sub_agent_reports": reports,
            "suggested_tool": None
        }
