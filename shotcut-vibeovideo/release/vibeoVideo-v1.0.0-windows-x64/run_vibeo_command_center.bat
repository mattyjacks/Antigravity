@echo off
title vibeoVideo - Agentic AI Command Center
if exist "%~dp0vibeo_command_center.exe" (
    start "" "%~dp0vibeo_command_center.exe" %*
    exit
)
if exist "%~dp0dist\vibeo_command_center.exe" (
    start "" "%~dp0dist\vibeo_command_center.exe" %*
    exit
)
start "" pythonw "%~dp0companion\vibeo_agent_center.py" %*
if %ERRORLEVEL% NEQ 0 (
    start "" python "%~dp0companion\vibeo_agent_center.py" %*
)
exit
