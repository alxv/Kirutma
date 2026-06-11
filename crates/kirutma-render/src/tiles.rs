use std::collections::HashSet;

use kirutma_core::{bounds::node_bounds, Rect, RenderNode};

pub const TILE_SIZE: f64 = 256.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TileCoord {
    pub x: i32,
    pub y: i32,
}

#[derive(Default)]
pub struct TileGrid {
    dirty: HashSet<TileCoord>,
    all_dirty: bool,
}

impl TileGrid {
    pub fn mark_all_dirty(&mut self) {
        self.all_dirty = true;
        self.dirty.clear();
    }

    pub fn mark_rect_dirty(&mut self, rect: Rect) {
        if self.all_dirty {
            return;
        }
        let min_x = (rect.x / TILE_SIZE).floor() as i32;
        let min_y = (rect.y / TILE_SIZE).floor() as i32;
        let max_x = ((rect.x + rect.width) / TILE_SIZE).floor() as i32;
        let max_y = ((rect.y + rect.height) / TILE_SIZE).floor() as i32;
        for y in min_y..=max_y {
            for x in min_x..=max_x {
                self.dirty.insert(TileCoord { x, y });
            }
        }
    }

    pub fn mark_nodes_dirty(&mut self, nodes: &[RenderNode]) {
        for node in nodes {
            if let Some(bounds) = node_bounds(node) {
                self.mark_rect_dirty(bounds);
            }
        }
    }

    pub fn tiles_for_viewport(&self, viewport_world: Rect) -> Vec<TileCoord> {
        let min_x = (viewport_world.x / TILE_SIZE).floor() as i32;
        let min_y = (viewport_world.y / TILE_SIZE).floor() as i32;
        let max_x = ((viewport_world.x + viewport_world.width) / TILE_SIZE).floor() as i32;
        let max_y = ((viewport_world.y + viewport_world.height) / TILE_SIZE).floor() as i32;
        let mut tiles = Vec::new();
        for y in min_y..=max_y {
            for x in min_x..=max_x {
                tiles.push(TileCoord { x, y });
            }
        }
        tiles
    }

    pub fn should_render_tile(&self, tile: TileCoord) -> bool {
        self.all_dirty || self.dirty.contains(&tile)
    }

    pub fn clear_dirty(&mut self) {
        self.all_dirty = false;
        self.dirty.clear();
    }

    pub fn dirty_count(&self) -> usize {
        if self.all_dirty {
            usize::MAX
        } else {
            self.dirty.len()
        }
    }
}
