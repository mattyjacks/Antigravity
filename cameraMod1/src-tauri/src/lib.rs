pub mod demos;
pub mod vcam;

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn get_vcam_status() -> vcam::VCamDriverStatus {
    vcam::detect_vcam_driver()
}

#[tauri::command]
fn get_system_capabilities() -> vcam::SystemCapabilities {
    vcam::get_system_capabilities()
}

#[tauri::command]
fn get_demo_clips() -> Vec<demos::DemoClip> {
    demos::get_default_demos()
}

#[tauri::command]
async fn open_projector_window(app: AppHandle) -> Result<(), String> {
    if let Some(existing_window) = app.get_webview_window("projector") {
        let _ = existing_window.show();
        let _ = existing_window.set_focus();
        return Ok(());
    }

    let _window = WebviewWindowBuilder::new(&app, "projector", WebviewUrl::App("projector.html".into()))
        .title("Matty Jacks CameraMod1 - Output Stream Projector")
        .inner_size(1280.0, 720.0)
        .min_inner_size(640.0, 360.0)
        .resizable(true)
        .decorations(true)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_vcam_status,
            get_system_capabilities,
            get_demo_clips,
            open_projector_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running Matty Jacks CameraMod1");
}
