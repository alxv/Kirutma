use kirutma_core::CanvasSyncPayload;
use vello::peniko::Color;
use vello::util::RenderSurface;
use vello::wgpu::{self, CurrentSurfaceTexture, Device, Queue};
use vello::{AaConfig, Renderer, Scene};

use crate::scene_builder::SceneBuilder;
use crate::tiles::TileGrid;

pub struct FrameRenderer {
    pub scene: Scene,
    pub tiles: TileGrid,
}

impl Default for FrameRenderer {
    fn default() -> Self {
        Self {
            scene: Scene::new(),
            tiles: TileGrid::default(),
        }
    }
}

impl FrameRenderer {
    pub fn sync(&mut self, payload: &CanvasSyncPayload, previous: Option<&CanvasSyncPayload>) {
        self.tiles.mark_nodes_dirty(&payload.nodes);
        if let Some(prev) = previous {
            if payload.camera != prev.camera || payload.viewport != prev.viewport {
                self.tiles.mark_all_dirty();
            }
        } else {
            self.tiles.mark_all_dirty();
        }
    }

    pub fn render(
        &mut self,
        device: &Device,
        queue: &Queue,
        renderer: &mut Renderer,
        surface: &mut RenderSurface<'_>,
        configure_surface: &dyn Fn(&RenderSurface<'_>),
        payload: &CanvasSyncPayload,
    ) -> Result<(), String> {
        SceneBuilder::build(&mut self.scene, payload, &self.tiles);

        let width = payload.window_width.max(1);
        let height = payload.window_height.max(1);

        renderer
            .render_to_texture(
                device,
                queue,
                &self.scene,
                &surface.target_view,
                &vello::RenderParams {
                    base_color: Color::from_rgba8(30, 30, 30, 255),
                    width,
                    height,
                    antialiasing_method: AaConfig::Area,
                },
            )
            .map_err(|err| err.to_string())?;

        let surface_texture = match surface.surface.get_current_texture() {
            CurrentSurfaceTexture::Success(texture) => texture,
            CurrentSurfaceTexture::Outdated | CurrentSurfaceTexture::Suboptimal(_) => {
                configure_surface(surface);
                return Ok(());
            }
            CurrentSurfaceTexture::Occluded | CurrentSurfaceTexture::Timeout => return Ok(()),
            CurrentSurfaceTexture::Lost => return Err("GPU surface lost".into()),
            CurrentSurfaceTexture::Validation => return Err("GPU surface validation error".into()),
        };

        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("Kirutma surface blit"),
        });
        surface.blitter.copy(
            device,
            &mut encoder,
            &surface.target_view,
            &surface_texture
                .texture
                .create_view(&wgpu::TextureViewDescriptor::default()),
        );
        queue.submit([encoder.finish()]);
        surface_texture.present();
        device.poll(wgpu::PollType::Poll).map_err(|err| err.to_string())?;

        self.tiles.clear_dirty();
        Ok(())
    }
}
