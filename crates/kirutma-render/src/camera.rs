use kirutma_core::{Camera, Point, ViewportRect};
use vello::kurbo::Affine;

pub fn world_to_screen(point: Point, camera: Camera, viewport: ViewportRect) -> Point {
    Point {
        x: viewport.x + point.x * camera.zoom + camera.x,
        y: viewport.y + point.y * camera.zoom + camera.y,
    }
}

pub fn screen_to_world(point: Point, camera: Camera, viewport: ViewportRect) -> Point {
    Point {
        x: (point.x - viewport.x - camera.x) / camera.zoom,
        y: (point.y - viewport.y - camera.y) / camera.zoom,
    }
}

pub fn camera_transform(camera: Camera, viewport: ViewportRect) -> Affine {
    Affine::translate((viewport.x + camera.x, viewport.y + camera.y)) * Affine::scale(camera.zoom)
}
