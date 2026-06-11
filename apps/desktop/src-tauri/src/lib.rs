mod canvas;

use std::sync::Arc;

use canvas::{CanvasState, canvas_hit_test, canvas_renderer_info, canvas_sync};
use tauri::{RunEvent, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let canvas_state = Arc::new(CanvasState::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(canvas_state.clone())
        .setup(|_app| Ok(()))
        .invoke_handler(tauri::generate_handler![
            greet,
            app_info,
            canvas_sync,
            canvas_hit_test,
            canvas_renderer_info
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app_handle, event| {
            match event {
                RunEvent::WindowEvent {
                    event: WindowEvent::Resized(size),
                    ..
                } => {
                    if let Some(engine) = canvas_state.engine.lock().as_mut() {
                        engine.resize(size.width, size.height);
                        canvas_state.payload.lock().window_width = size.width.max(1);
                        canvas_state.payload.lock().window_height = size.height.max(1);
                        *canvas_state.dirty.lock() = true;
                    }
                }
                _ => {}
            }
        });
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! Kirutma GPU canvas is ready.")
}

#[tauri::command]
fn app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "Kirutma",
        "version": "1.0.0",
        "phase": "1",
        "renderer": "vello-gpu"
    })
}
