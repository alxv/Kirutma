use rstar::{RTree, RTreeObject, AABB};

use crate::{bounds::hit_test_node, bounds::node_bounds, Point, Rect, RenderNode};

#[derive(Debug, Clone)]
struct SpatialEntry {
    id: String,
    bounds: Rect,
    sort_order: i32,
    is_container: bool,
}

impl RTreeObject for SpatialEntry {
    type Envelope = AABB<[f64; 2]>;

    fn envelope(&self) -> Self::Envelope {
        AABB::from_corners(
            [self.bounds.x, self.bounds.y],
            [
                self.bounds.x + self.bounds.width,
                self.bounds.y + self.bounds.height,
            ],
        )
    }
}

#[derive(Default)]
pub struct SpatialIndex {
    tree: RTree<SpatialEntry>,
}

impl SpatialIndex {
    pub fn rebuild(nodes: &[RenderNode]) {
        let _ = nodes;
    }

    pub fn from_nodes(nodes: &[RenderNode]) -> Self {
        let entries = nodes
            .iter()
            .filter(|node| node.visible() && !node.locked())
            .filter_map(|node| {
                let bounds = node_bounds(node)?;
                Some(SpatialEntry {
                    id: node.id().to_string(),
                    bounds,
                    sort_order: node.sort_order(),
                    is_container: matches!(node, RenderNode::Frame { .. }),
                })
            })
            .collect();
        Self {
            tree: RTree::bulk_load(entries),
        }
    }

    pub fn hit_test(&self, world: Point, nodes: &[RenderNode]) -> Option<String> {
        let envelope = AABB::from_point([world.x, world.y]);
        let candidates: Vec<&SpatialEntry> = self.tree.locate_in_envelope_intersecting(&envelope).collect();

        let mut best: Option<&SpatialEntry> = None;
        let mut best_area = f64::INFINITY;
        let mut best_is_container = true;

        for entry in candidates {
            let node = nodes.iter().find(|node| node.id() == entry.id)?;
            if !hit_test_node(node, world) {
                continue;
            }
            let area = entry.bounds.area();
            let is_container = entry.is_container;
            if best.is_none()
                || area < best_area
                || (area == best_area && !is_container && best_is_container)
            {
                best = Some(entry);
                best_area = area;
                best_is_container = is_container;
            }
        }

        best.map(|entry| entry.id.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::RenderNode;

    #[test]
    fn prefers_smaller_shape_over_frame() {
        let nodes = vec![
            RenderNode::Frame {
                id: "frame".into(),
                name: "Frame".into(),
                visible: true,
                locked: false,
                sort_order: 0,
                x: 0.0,
                y: 0.0,
                width: 200.0,
                height: 200.0,
                rotation: 0.0,
                opacity: 1.0,
                fill: "#111111".into(),
                fill_gradient: None,
            },
            RenderNode::Rectangle {
                id: "rect".into(),
                visible: true,
                locked: false,
                sort_order: 1,
                x: 50.0,
                y: 50.0,
                width: 40.0,
                height: 40.0,
                rotation: 0.0,
                opacity: 1.0,
                fill: "#ffffff".into(),
                fill_gradient: None,
                stroke: "#000000".into(),
                stroke_width: 0.0,
                corner_radius: 0.0,
            },
        ];
        let index = SpatialIndex::from_nodes(&nodes);
        let hit = index.hit_test(Point { x: 60.0, y: 60.0 }, &nodes);
        assert_eq!(hit.as_deref(), Some("rect"));
    }
}
