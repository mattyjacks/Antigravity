@echo off
if exist "%~dp0vibeo_command_center.exe" (
    start "" "%~dp0vibeo_command_center.exe"
    exit
)
start "" pythonw "%~dp0companion\vibeo_agent_center.py"
exit
