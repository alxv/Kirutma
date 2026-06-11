use crate::{Point, Rect, RenderNode};

pub fn node_bounds(node: &RenderNode) -> Option<Rect> {
    match node {
        RenderNode::Frame {
            x,
            y,
            width,
            height,
            ..
        }
        | RenderNode::Rectangle {
            x,
            y,
            width,
            height,
            ..
        }
        | RenderNode::Ellipse {
            x,
            y,
            width,
            height,
            ..
        } => Some(Rect {
            x: *x,
            y: *y,
            width: *width,
            height: *height,
        }),
        RenderNode::Line { x, y, x2, y2, .. } => {
            let min_x = x.min(*x2);
            let min_y = y.min(*y2);
            Some(Rect {
                x: min_x,
                y: min_y,
                width: (x2 - x).abs().max(1.0),
                height: (y2 - y).abs().max(1.0),
            })
        }
        RenderNode::Text {
            x,
            y,
            width,
            height,
            ..
        } => Some(Rect {
            x: *x,
            y: *y,
            width: width.max(80.0),
            height: height.max(16.0),
        }),
    }
}

pub fn selection_bounds(nodes: &[RenderNode], selected_ids: &[String]) -> Option<Rect> {
    let mut bounds: Option<Rect> = None;
    for id in selected_ids {
        let node = nodes.iter().find(|node| node.id() == id)?;
        let node_bounds = node_bounds(node)?;
        bounds = Some(match bounds {
            Some(current) => Rect::union(current, node_bounds),
            None => node_bounds,
        });
    }
    bounds
}

pub fn hit_test_node(node: &RenderNode, world: Point) -> bool {
    if !node.visible() || node.locked() {
        return false;
    }

    let Some(bounds) = node_bounds(node) else {
        return false;
    };

    match node {
        RenderNode::Ellipse { .. } => {
            let cx = bounds.x + bounds.width / 2.0;
            let cy = bounds.y + bounds.height / 2.0;
            let rx = bounds.width / 2.0;
            let ry = bounds.height / 2.0;
            if rx == 0.0 || ry == 0.0 {
                return false;
            }
            let dx = (world.x - cx) / rx;
            let dy = (world.y - cy) / ry;
            dx * dx + dy * dy <= 1.0
        }
        RenderNode::Line { x, y, x2, y2, .. } => {
            distance_to_segment(world, Point { x: *x, y: *y }, Point { x: *x2, y: *y2 }) <= 6.0
        }
        _ => bounds.contains(world),
    }
}

fn distance_to_segment(point: Point, a: Point, b: Point) -> f64 {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    if dx == 0.0 && dy == 0.0 {
        return ((point.x - a.x).powi(2) + (point.y - a.y).powi(2)).sqrt();
    }
    let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy);
    let t = t.clamp(0.0, 1.0);
    let proj_x = a.x + t * dx;
    let proj_y = a.y + t * dy;
    ((point.x - proj_x).powi(2) + (point.y - proj_y).powi(2)).sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ellipse_hit_test() {
        let node = RenderNode::Ellipse {
            id: "e1".into(),
            visible: true,
            locked: false,
            sort_order: 0,
            x: 0.0,
            y: 0.0,
            width: 100.0,
            height: 50.0,
            rotation: 0.0,
            opacity: 1.0,
            fill: "#ffffff".into(),
            fill_gradient: None,
            stroke: "#000000".into(),
            stroke_width: 0.0,
        };
        assert!(hit_test_node(&node, Point { x: 50.0, y: 25.0 }));
        assert!(!hit_test_node(&node, Point { x: 0.0, y: 0.0 }));
    }
}
