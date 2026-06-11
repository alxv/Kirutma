mod engine;

pub use engine::{hit_test_world, CanvasEngine};

pub fn default_payload_with_size(width: u32, height: u32) -> CanvasSyncPayload {
    let mut payload = default_payload();
    payload.window_width = width.max(1);
    payload.window_height = height.max(1);
    payload
}

use kirutma_core::{CanvasSyncPayload, Point};
use parking_lot::Mutex;
use std::sync::Arc;

pub struct CanvasState {
    pub engine: Mutex<Option<CanvasEngine>>,
    pub payload: Mutex<CanvasSyncPayload>,
    pub previous_payload: Mutex<Option<CanvasSyncPayload>>,
    pub dirty: Mutex<bool>,
}

impl CanvasState {
    pub fn new() -> Self {
        Self {
            engine: Mutex::new(None),
            payload: Mutex::new(default_payload()),
            previous_payload: Mutex::new(None),
            dirty: Mutex::new(true),
        }
    }
}

fn default_payload() -> CanvasSyncPayload {
    CanvasSyncPayload {
        nodes: Vec::new(),
        camera: Default::default(),
        viewport: kirutma_core::ViewportRect {
            x: 0.0,
            y: 0.0,
            width: 1.0,
            height: 1.0,
        },
        selected_ids: Vec::new(),
        draft: None,
        marquee: None,
        snap_guides: Vec::new(),
        show_pixel_grid: false,
        show_handles: true,
        handles: None,
        selection_bounds: None,
        window_width: 1,
        window_height: 1,
    }
}

#[tauri::command]
pub fn canvas_sync(state: tauri::State<'_, Arc<CanvasState>>, payload: CanvasSyncPayload) {
    *state.payload.lock() = payload;
    *state.dirty.lock() = true;
}

#[tauri::command]
pub fn canvas_hit_test(
    state: tauri::State<'_, Arc<CanvasState>>,
    x: f64,
    y: f64,
) -> Option<String> {
    let payload = state.payload.lock();
    hit_test_world(&payload, Point { x, y })
}

#[tauri::command]
pub fn canvas_renderer_info() -> serde_json::Value {
    serde_json::json!({
        "name": "Kirutma",
        "version": "1.0.0",
        "phase": "1",
        "renderer": "vello-gpu",
        "tileSize": 256
    })
}

pub fn render_if_dirty(state: &Arc<CanvasState>) {
    if !*state.dirty.lock() {
        return;
    }

    let payload = state.payload.lock().clone();
    let mut previous = state.previous_payload.lock();
    let mut engine_guard = state.engine.lock();

    let Some(engine) = engine_guard.as_mut() else {
        return;
    };

    engine.frame.sync(&payload, previous.as_ref());
    if let Err(err) = engine.render(&payload) {
        log::warn!("GPU render failed: {err}");
        return;
    }

    *previous = Some(payload);
    *state.dirty.lock() = false;
}
