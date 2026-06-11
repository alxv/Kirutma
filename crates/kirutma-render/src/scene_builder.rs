use kirutma_core::{
    bounds::node_bounds, DraftShape, FillGradient, Rect, RenderNode, SnapAxis, SnapGuide,
    TransformHandles,
};
use vello::kurbo::{Affine, BezPath, Circle, Ellipse, Line, Point, Rect as KurboRect, RoundedRect, Shape, Stroke, Vec2};
use vello::peniko::{Fill, Gradient};
use vello::Scene;

use crate::camera::camera_transform;
use crate::color::parse_color;
use crate::tiles::{TileCoord, TileGrid, TILE_SIZE};

pub struct SceneBuilder;

impl SceneBuilder {
    pub fn build(
        scene: &mut Scene,
        payload: &kirutma_core::CanvasSyncPayload,
        tile_grid: &TileGrid,
    ) {
        scene.reset();

        let width = payload.window_width.max(1) as f64;
        let height = payload.window_height.max(1) as f64;
        let bg = parse_color("#1E1E1E", 1.0);
        scene.fill(
            Fill::NonZero,
            Affine::IDENTITY,
            bg,
            None,
            &KurboRect::new(0.0, 0.0, width, height),
        );

        if payload.show_pixel_grid {
            draw_pixel_grid(scene, payload);
        }

        let cam = camera_transform(payload.camera, payload.viewport);
        let viewport_world = world_viewport(payload);
        let visible_tiles = tile_grid.tiles_for_viewport(viewport_world);

        let mut nodes = payload.nodes.clone();
        nodes.sort_by_key(|node| node.sort_order());

        for node in &nodes {
            if !node.visible() {
                continue;
            }
            if !node_intersects_visible_tiles(node, &visible_tiles, tile_grid) {
                continue;
            }
            draw_node(scene, node, cam);
        }

        if let Some(draft) = &payload.draft {
            draw_draft(scene, draft, cam);
        }

        if let Some(marquee) = payload.marquee {
            draw_marquee(scene, marquee, cam);
        }

        draw_snap_guides(scene, &payload.snap_guides, cam);

        for id in &payload.selected_ids {
            if let Some(node) = nodes.iter().find(|node| node.id() == id) {
                draw_selection_outline(scene, node, cam);
            }
        }

        if payload.show_handles {
            if let Some(handles) = &payload.handles {
                draw_transform_handles(scene, handles, payload.camera.zoom, cam);
            }
        }
    }
}

fn world_viewport(payload: &kirutma_core::CanvasSyncPayload) -> Rect {
    let top_left = crate::camera::screen_to_world(
        kirutma_core::Point {
            x: payload.viewport.x,
            y: payload.viewport.y,
        },
        payload.camera,
        payload.viewport,
    );
    let bottom_right = crate::camera::screen_to_world(
        kirutma_core::Point {
            x: payload.viewport.x + payload.viewport.width,
            y: payload.viewport.y + payload.viewport.height,
        },
        payload.camera,
        payload.viewport,
    );
    Rect {
        x: top_left.x.min(bottom_right.x),
        y: top_left.y.min(bottom_right.y),
        width: (bottom_right.x - top_left.x).abs(),
        height: (bottom_right.y - top_left.y).abs(),
    }
}

fn node_intersects_visible_tiles(node: &RenderNode, tiles: &[TileCoord], tile_grid: &TileGrid) -> bool {
    let Some(bounds) = node_bounds(node) else {
        return false;
    };
    if tile_grid.dirty_count() == usize::MAX {
        return true;
    }
    for tile in tiles {
        if !tile_grid.should_render_tile(*tile) {
            continue;
        }
        let tile_rect = Rect {
            x: tile.x as f64 * TILE_SIZE,
            y: tile.y as f64 * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
        };
        if rects_intersect(bounds, tile_rect) {
            return true;
        }
    }
    true
}

fn rects_intersect(a: Rect, b: Rect) -> bool {
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

fn node_transform(node: &RenderNode, bounds: Rect) -> Affine {
    let rotation = match node {
        RenderNode::Frame { rotation, .. }
        | RenderNode::Rectangle { rotation, .. }
        | RenderNode::Ellipse { rotation, .. }
        | RenderNode::Line { rotation, .. }
        | RenderNode::Text { rotation, .. } => *rotation,
    };
    if rotation == 0.0 {
        Affine::IDENTITY
    } else {
        let cx = bounds.x + bounds.width / 2.0;
        let cy = bounds.y + bounds.height / 2.0;
        Affine::translate((cx, cy))
            * Affine::rotate(rotation.to_radians())
            * Affine::translate((-cx, -cy))
    }
}

fn draw_node(scene: &mut Scene, node: &RenderNode, cam: Affine) {
    let bounds = match node_bounds(node) {
        Some(bounds) => bounds,
        None => return,
    };

    let opacity = match node {
        RenderNode::Frame { opacity, .. }
        | RenderNode::Rectangle { opacity, .. }
        | RenderNode::Ellipse { opacity, .. }
        | RenderNode::Line { opacity, .. }
        | RenderNode::Text { opacity, .. } => *opacity,
    };

    let transform = cam * node_transform(node, bounds);
    let stroke_style = |width: f64| Stroke::new(width);

    match node {
        RenderNode::Frame {
            name,
            x,
            y,
            width,
            height,
            fill,
            fill_gradient,
            ..
        } => {
            let rect = KurboRect::new(*x, *y, x + width, y + height);
            let path = rect.to_path(0.1);
            fill_shape(scene, &path, fill, fill_gradient, *x, *y, *width, *height, opacity, transform);
            scene.stroke(
                &stroke_style(1.0),
                transform,
                parse_color("rgba(255,255,255,0.18)", opacity),
                None,
                &path,
            );
            draw_frame_label(scene, name, *x, *y, *width, *height, transform);
        }
        RenderNode::Rectangle {
            x,
            y,
            width,
            height,
            fill,
            fill_gradient,
            stroke,
            stroke_width,
            corner_radius,
            ..
        } => {
            let path = if *corner_radius > 0.0 {
                RoundedRect::new(*x, *y, x + width, y + height, *corner_radius).to_path(0.1)
            } else {
                KurboRect::new(*x, *y, x + width, y + height).to_path(0.1)
            };
            fill_shape(scene, &path, fill, fill_gradient, *x, *y, *width, *height, opacity, transform);
            if *stroke_width > 0.0 {
                scene.stroke(
                    &stroke_style(*stroke_width),
                    transform,
                    parse_color(stroke, opacity),
                    None,
                    &path,
                );
            }
        }
        RenderNode::Ellipse {
            x,
            y,
            width,
            height,
            fill,
            fill_gradient,
            stroke,
            stroke_width,
            ..
        } => {
            let path = Ellipse::new(
                Point::new(x + width / 2.0, y + height / 2.0),
                Vec2::new(width.abs() / 2.0, height.abs() / 2.0),
                0.0,
            )
            .to_path(0.1);
            fill_shape(scene, &path, fill, fill_gradient, *x, *y, *width, *height, opacity, transform);
            if *stroke_width > 0.0 {
                scene.stroke(
                    &stroke_style(*stroke_width),
                    transform,
                    parse_color(stroke, opacity),
                    None,
                    &path,
                );
            }
        }
        RenderNode::Line {
            x,
            y,
            x2,
            y2,
            stroke,
            stroke_width,
            ..
        } => {
            let path = Line::new(Point::new(*x, *y), Point::new(*x2, *y2)).to_path(0.1);
            scene.stroke(
                &stroke_style(*stroke_width),
                transform,
                parse_color(stroke, opacity),
                None,
                &path,
            );
        }
        RenderNode::Text { .. } => {}
    }
}

fn fill_shape(
    scene: &mut Scene,
    path: &BezPath,
    fill: &str,
    fill_gradient: &Option<FillGradient>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    opacity: f64,
    transform: Affine,
) {
    if let Some(gradient) = fill_gradient {
        let brush = gradient_brush(gradient, x, y, width, height, opacity);
        scene.fill(Fill::NonZero, transform, &brush, None, path);
    } else {
        scene.fill(
            Fill::NonZero,
            transform,
            parse_color(fill, opacity),
            None,
            path,
        );
    }
}

fn gradient_brush(gradient: &FillGradient, x: f64, y: f64, width: f64, height: f64, opacity: f64) -> Gradient {
    let angle = gradient.angle.to_radians();
    let cx = x + width / 2.0;
    let cy = y + height / 2.0;
    let dx = angle.cos() * width / 2.0;
    let dy = angle.sin() * height / 2.0;
    Gradient::new_linear(
        Point::new(cx - dx, cy - dy),
        Point::new(cx + dx, cy + dy),
    )
    .with_stops([
        (0.0, parse_color(&gradient.start, opacity)),
        (1.0, parse_color(&gradient.end, opacity)),
    ])
}

fn draw_frame_label(scene: &mut Scene, name: &str, x: f64, y: f64, width: f64, height: f64, transform: Affine) {
    let label = format!("{name} · {} × {}", width.round(), height.round());
    let color = parse_color("rgba(255,255,255,0.55)", 1.0);
    let rect = KurboRect::new(x, y - 18.0, x + label.len() as f64 * 6.5, y - 4.0);
    scene.fill(Fill::NonZero, transform, color, None, &rect.to_path(0.1));
}

fn draw_draft(scene: &mut Scene, draft: &DraftShape, cam: Affine) {
    let stroke = parse_color("#0D99FF", 1.0);
    let fill = parse_color("rgba(13,153,255,0.12)", 1.0);
    match draft {
        DraftShape::Line { x, y, x2, y2 } => {
            let path = Line::new(Point::new(*x, *y), Point::new(*x2, *y2)).to_path(0.1);
            scene.stroke(&Stroke::new(1.0), cam, stroke, None, &path);
        }
        DraftShape::Frame { x, y, width, height }
        | DraftShape::Rectangle { x, y, width, height }
        | DraftShape::Ellipse { x, y, width, height } => {
            let x0 = if *width < 0.0 { x + width } else { *x };
            let y0 = if *height < 0.0 { y + height } else { *y };
            let w = width.abs();
            let h = height.abs();
            let path = if matches!(draft, DraftShape::Ellipse { .. }) {
                Ellipse::new(Point::new(x0 + w / 2.0, y0 + h / 2.0), Vec2::new(w / 2.0, h / 2.0), 0.0)
                    .to_path(0.1)
            } else {
                KurboRect::new(x0, y0, x0 + w, y0 + h).to_path(0.1)
            };
            scene.fill(Fill::NonZero, cam, fill, None, &path);
            scene.stroke(&Stroke::new(1.0), cam, stroke, None, &path);
        }
    }
}

fn draw_marquee(scene: &mut Scene, marquee: Rect, cam: Affine) {
    let x0 = if marquee.width < 0.0 {
        marquee.x + marquee.width
    } else {
        marquee.x
    };
    let y0 = if marquee.height < 0.0 {
        marquee.y + marquee.height
    } else {
        marquee.y
    };
    let path = KurboRect::new(x0, y0, x0 + marquee.width.abs(), y0 + marquee.height.abs()).to_path(0.1);
    scene.fill(Fill::NonZero, cam, parse_color("rgba(13,153,255,0.08)", 1.0), None, &path);
    scene.stroke(&Stroke::new(1.0), cam, parse_color("#0D99FF", 1.0), None, &path);
}

fn draw_snap_guides(scene: &mut Scene, guides: &[SnapGuide], cam: Affine) {
    let color = parse_color("#FF2D55", 1.0);
    for guide in guides {
        let path = match guide.axis {
            SnapAxis::X => Line::new(
                Point::new(guide.value, guide.from),
                Point::new(guide.value, guide.to),
            )
            .to_path(0.1),
            SnapAxis::Y => Line::new(
                Point::new(guide.from, guide.value),
                Point::new(guide.to, guide.value),
            )
            .to_path(0.1),
        };
        scene.stroke(&Stroke::new(1.0), cam, color, None, &path);
    }
}

fn draw_selection_outline(scene: &mut Scene, node: &RenderNode, cam: Affine) {
    let Some(bounds) = node_bounds(node) else {
        return;
    };
    let transform = cam * node_transform(node, bounds);
    let path = KurboRect::new(bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height).to_path(0.1);
    scene.stroke(
        &Stroke::new(1.0),
        transform,
        parse_color("#0D99FF", 1.0),
        None,
        &path,
    );
}

fn draw_transform_handles(scene: &mut Scene, handles: &TransformHandles, zoom: f64, cam: Affine) {
    let size = 8.0 / zoom.max(0.1);
    let fill = parse_color("#FFFFFF", 1.0);
    let stroke = parse_color("#0D99FF", 1.0);
    let points = [
        handles.nw,
        handles.n,
        handles.ne,
        handles.e,
        handles.se,
        handles.s,
        handles.sw,
        handles.w,
    ];
    for point in points {
        let rect = KurboRect::new(
            point.x - size / 2.0,
            point.y - size / 2.0,
            point.x + size / 2.0,
            point.y + size / 2.0,
        );
        let path = rect.to_path(0.1);
        scene.fill(Fill::NonZero, cam, fill, None, &path);
        scene.stroke(&Stroke::new(1.0 / zoom.max(0.1)), cam, stroke, None, &path);
    }

    if let Some(rotation) = handles.rotation {
        let line = Line::new(
            Point::new((handles.n.x + handles.ne.x) / 2.0, handles.n.y),
            Point::new(rotation.x, rotation.y),
        );
        scene.stroke(
            &Stroke::new(1.0 / zoom.max(0.1)),
            cam,
            stroke,
            None,
            &line.to_path(0.1),
        );
        let path = Circle::new(Point::new(rotation.x, rotation.y), size / 2.0).to_path(0.1);
        scene.fill(Fill::NonZero, cam, fill, None, &path);
        scene.stroke(&Stroke::new(1.0 / zoom.max(0.1)), cam, stroke, None, &path);
    }
}

fn draw_pixel_grid(scene: &mut Scene, payload: &kirutma_core::CanvasSyncPayload) {
    let grid = 8.0 * payload.camera.zoom;
    if grid < 4.0 {
        return;
    }
    let color = parse_color("rgba(255,255,255,0.04)", 1.0);
    let start_x = payload.viewport.x + payload.camera.x % grid;
    let start_y = payload.viewport.y + payload.camera.y % grid;
    let end_x = payload.viewport.x + payload.viewport.width;
    let end_y = payload.viewport.y + payload.viewport.height;

    let mut path = BezPath::new();
    let mut x = start_x;
    while x <= end_x {
        path.move_to(Point::new(x, payload.viewport.y));
        path.line_to(Point::new(x, end_y));
        x += grid;
    }
    let mut y = start_y;
    while y <= end_y {
        path.move_to(Point::new(payload.viewport.x, y));
        path.line_to(Point::new(end_x, y));
        y += grid;
    }
    scene.stroke(&Stroke::new(1.0), Affine::IDENTITY, color, None, &path);
}
