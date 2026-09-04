<#
.SYNOPSIS
    Installs the vibeoVideo AI Plugin for Shotcut.
.DESCRIPTION
    Copies the vibeoVideo QML filter files into Shotcut's user extension directory:
    %LOCALAPPDATA%\Meltytech\Shotcut\extensions\filters\vibeo_video
#>

param (
    [switch]$SystemWide
)

$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "        vibeoVideo - Shotcut AI Studio Installer    " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $scriptDir "filters\vibeo_video"

if (-not (Test-Path $sourceDir)) {
    Write-Error "Source filter directory not found at '$sourceDir'!"
    exit 1
}

# Determine target directory
if ($SystemWide) {
    $shotcutProg = "C:\Program Files\Shotcut\share\shotcut\qml\filters"
    if (-not (Test-Path $shotcutProg)) {
        Write-Error "System-wide Shotcut filter directory '$shotcutProg' was not found!"
        exit 1
    }
    $targetDir = Join-Path $shotcutProg "vibeo_video"
    Write-Host "[*] Installing system-wide to: $targetDir" -ForegroundColor Yellow
} else {
    $appData = Join-Path $env:LOCALAPPDATA "Meltytech\Shotcut\extensions\filters"
    $targetDir = Join-Path $appData "vibeo_video"
    Write-Host "[*] Installing to User AppData (Recommended): $targetDir" -ForegroundColor Green
}

# Create target directory
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "[+] Created plugin directory: $targetDir" -ForegroundColor Gray
}

# Copy files
$filesToCopy = @(
    "meta.qml",
    "ui.qml",
    "vui.qml",
    "OpenAiClient.js",
    "vibeoStorage.js",
    "icon.webp",
    "icon.png"
)

foreach ($f in $filesToCopy) {
    $srcPath = Join-Path $sourceDir $f
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination $targetDir -Force
        Write-Host "  -> Installed $f" -ForegroundColor DarkGray
    } else {
        Write-Warning "File '$f' not found in source!"
    }
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "✨ vibeoVideo installed successfully!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "How to use vibeoVideo in Shotcut:" -ForegroundColor Yellow
Write-Host "1. (Re)Start Shotcut if it is currently open."
Write-Host "2. Add any video clip, image, or transparent color clip to the Timeline."
Write-Host "3. Click the 'Filters' tab and click '+' to add a filter."
Write-Host "4. Search for 'vibeoVideo' under the Video filters."
Write-Host "5. In the filter panel, click 'Settings', paste your OpenAI API Key, and click 'Save Key'."
Write-Host "6. Switch to 'AI Text' to generate titles, hooks, lower thirds, or 'DALL-E 3' for B-roll!"
Write-Host ""
Write-Host "To run the Whisper Subtitle & Voiceover Companion tool:" -ForegroundColor Cyan
Write-Host "  Run '$scriptDir\companion\run_companion.bat'"
Write-Host ""
