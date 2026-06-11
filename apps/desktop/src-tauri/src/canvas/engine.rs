use std::num::NonZeroUsize;
use std::sync::Arc;

use kirutma_core::{CanvasSyncPayload, Point, SpatialIndex};
use kirutma_render::FrameRenderer;
use kirutma_render::camera::screen_to_world;
use tauri::WebviewWindow;
use vello::util::{RenderContext, RenderSurface};
use vello::wgpu;
use vello::{Renderer, RendererOptions};

pub struct CanvasEngine {
    pub context: RenderContext,
    pub surface: RenderSurface<'static>,
    pub renderer: Renderer,
    pub frame: FrameRenderer,
    _window: Arc<WebviewWindow>,
}

pub fn hit_test_world(payload: &CanvasSyncPayload, screen: Point) -> Option<String> {
    let world = screen_to_world(screen, payload.camera, payload.viewport);
    let spatial = SpatialIndex::from_nodes(&payload.nodes);
    spatial.hit_test(world, &payload.nodes)
}

impl CanvasEngine {
    pub fn new(window: WebviewWindow, width: u32, height: u32) -> Result<Self, String> {
        let window = Arc::new(window);
        let mut context = RenderContext::new();
        let surface = pollster::block_on(context.create_surface(
            window.clone(),
            width.max(1),
            height.max(1),
            wgpu::PresentMode::AutoVsync,
        ))
        .map_err(|err| err.to_string())?;

        let dev_id = surface.dev_id;
        let device = &context.devices[dev_id].device;
        let renderer = Renderer::new(
            device,
            RendererOptions {
                antialiasing_support: vello::AaSupport::all(),
                num_init_threads: NonZeroUsize::new(1),
                ..Default::default()
            },
        )
        .map_err(|err| err.to_string())?;

        Ok(Self {
            context,
            surface,
            renderer,
    frame: FrameRenderer::default(),
    _window: window,
        })
    }

    pub fn resize(&mut self, width: u32, height: u32) {
        self.context
            .resize_surface(&mut self.surface, width.max(1), height.max(1));
        self.frame.tiles.mark_all_dirty();
    }

    pub fn render(&mut self, payload: &CanvasSyncPayload) -> Result<(), String> {
        let dev_id = self.surface.dev_id;
        let device = &self.context.devices[dev_id].device;
        let queue = &self.context.devices[dev_id].queue;
        let configure = |surface: &RenderSurface<'_>| self.context.configure_surface(surface);
        self.frame.render(
            device,
            queue,
            &mut self.renderer,
            &mut self.surface,
            &configure,
            payload,
        )
    }
}
