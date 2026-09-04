use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VCamDriverStatus {
    pub os: String,
    pub is_virtual_cam_installed: bool,
    pub driver_name: String,
    pub installation_guide: String,
    pub active_loopback_device: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemCapabilities {
    pub os_name: String,
    pub arch: String,
    pub supports_directshow: bool,
    pub supports_v4l2: bool,
    pub supports_cmio: bool,
}

pub fn detect_vcam_driver() -> VCamDriverStatus {
    let _os = std::env::consts::OS.to_string();

    #[cfg(target_os = "windows")]
    {
        // On Windows, check for OBS Virtual Camera or UnityCapture / AkVirtualCamera DirectShow filters in Registry
        let obs_cam_exists = check_windows_obs_vcam();
        VCamDriverStatus {
            os: "windows".into(),
            is_virtual_cam_installed: obs_cam_exists,
            driver_name: if obs_cam_exists {
                "OBS Virtual Camera / DirectShow Filter".into()
            } else {
                "Not Installed (UnityCapture / OBS VirtualCam available)".into()
            },
            installation_guide: "Install OBS Studio Virtual Camera or AkVirtualCamera driver for native Windows DirectShow loopback.".into(),
            active_loopback_device: if obs_cam_exists { Some("OBS Virtual Camera".into()) } else { None },
        }
    }

    #[cfg(target_os = "macos")]
    {
        let cmio_exists = std::path::Path::new("/Library/CoreMediaIO/Plug-Ins/DAL/obs-mac-virtualcam.plugin").exists();
        VCamDriverStatus {
            os: "macos".into(),
            is_virtual_cam_installed: cmio_exists,
            driver_name: if cmio_exists {
                "CoreMediaIO DAL Virtual Cam".into()
            } else {
                "CoreMediaIO DAL Extension required".into()
            },
            installation_guide: "Install OBS macOS Virtual Camera DAL plugin or CMIO Extension for macOS system-wide virtual camera output.".into(),
            active_loopback_device: if cmio_exists { Some("OBS Virtual Camera".into()) } else { None },
        }
    }

    #[cfg(target_os = "linux")]
    {
        let v4l2_exists = std::path::Path::new("/dev/video0").exists() || std::path::Path::new("/sys/module/v4l2loopback").exists();
        VCamDriverStatus {
            os: "linux".into(),
            is_virtual_cam_installed: v4l2_exists,
            driver_name: if v4l2_exists {
                "v4l2loopback Device Sink".into()
            } else {
                "v4l2loopback kernel module required".into()
            },
            installation_guide: "Run: sudo modprobe v4l2loopback devices=1 video_nr=10 card_label='MattyJacks Virtual Cam' exclusive_caps=1".into(),
            active_loopback_device: if v4l2_exists { Some("/dev/video10".into()) } else { None },
        }
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        VCamDriverStatus {
            os,
            is_virtual_cam_installed: false,
            driver_name: "Generic WebRTC / Window Projector".into(),
            installation_guide: "Use the Studio Window Projector or WebRTC Stream mode.".into(),
            active_loopback_device: None,
        }
    }
}

#[cfg(target_os = "windows")]
fn check_windows_obs_vcam() -> bool {
    // Check common installation paths or DLLs
    let common_paths = [
        r"C:\Program Files\obs-studio\data\obs-plugins\win-dshow\virtualcam-module64.dll",
        r"C:\Program Files (x86)\obs-studio\data\obs-plugins\win-dshow\virtualcam-module32.dll",
    ];
    common_paths.iter().any(|p| std::path::Path::new(p).exists())
}

pub fn get_system_capabilities() -> SystemCapabilities {
    SystemCapabilities {
        os_name: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        supports_directshow: cfg!(target_os = "windows"),
        supports_v4l2: cfg!(target_os = "linux"),
        supports_cmio: cfg!(target_os = "macos"),
    }
}
