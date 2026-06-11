use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl Rect {
    pub fn contains(&self, point: Point) -> bool {
        point.x >= self.x
            && point.x <= self.x + self.width
            && point.y >= self.y
            && point.y <= self.y + self.height
    }

    pub fn area(&self) -> f64 {
        (self.width.max(0.0)) * (self.height.max(0.0))
    }

    pub fn union(a: Self, b: Self) -> Self {
        let x1 = a.x.min(b.x);
        let y1 = a.y.min(b.y);
        let x2 = (a.x + a.width).max(b.x + b.width);
        let y2 = (a.y + a.height).max(b.y + b.height);
        Self {
            x: x1,
            y: y1,
            width: (x2 - x1).max(0.0),
            height: (y2 - y1).max(0.0),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Camera {
    pub x: f64,
    pub y: f64,
    pub zoom: f64,
}

impl Default for Camera {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            zoom: 1.0,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct ViewportRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FillGradient {
    pub start: String,
    pub end: String,
    pub angle: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum RenderNode {
    Frame {
        id: String,
        name: String,
        visible: bool,
        locked: bool,
        sort_order: i32,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        rotation: f64,
        opacity: f64,
        fill: String,
        fill_gradient: Option<FillGradient>,
    },
    Rectangle {
        id: String,
        visible: bool,
        locked: bool,
        sort_order: i32,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        rotation: f64,
        opacity: f64,
        fill: String,
        fill_gradient: Option<FillGradient>,
        stroke: String,
        stroke_width: f64,
        corner_radius: f64,
    },
    Ellipse {
        id: String,
        visible: bool,
        locked: bool,
        sort_order: i32,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        rotation: f64,
        opacity: f64,
        fill: String,
        fill_gradient: Option<FillGradient>,
        stroke: String,
        stroke_width: f64,
    },
    Line {
        id: String,
        visible: bool,
        locked: bool,
        sort_order: i32,
        x: f64,
        y: f64,
        x2: f64,
        y2: f64,
        rotation: f64,
        opacity: f64,
        stroke: String,
        stroke_width: f64,
    },
    Text {
        id: String,
        visible: bool,
        locked: bool,
        sort_order: i32,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        rotation: f64,
        opacity: f64,
        fill: String,
    },
}

impl RenderNode {
    pub fn id(&self) -> &str {
        match self {
            Self::Frame { id, .. }
            | Self::Rectangle { id, .. }
            | Self::Ellipse { id, .. }
            | Self::Line { id, .. }
            | Self::Text { id, .. } => id,
        }
    }

    pub fn sort_order(&self) -> i32 {
        match self {
            Self::Frame { sort_order, .. }
            | Self::Rectangle { sort_order, .. }
            | Self::Ellipse { sort_order, .. }
            | Self::Line { sort_order, .. }
            | Self::Text { sort_order, .. } => *sort_order,
        }
    }

    pub fn locked(&self) -> bool {
        match self {
            Self::Frame { locked, .. }
            | Self::Rectangle { locked, .. }
            | Self::Ellipse { locked, .. }
            | Self::Line { locked, .. }
            | Self::Text { locked, .. } => *locked,
        }
    }

    pub fn visible(&self) -> bool {
        match self {
            Self::Frame { visible, .. }
            | Self::Rectangle { visible, .. }
            | Self::Ellipse { visible, .. }
            | Self::Line { visible, .. }
            | Self::Text { visible, .. } => *visible,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum DraftShape {
    Frame {
        x: f64,
        y: f64,
        width: f64,
        height: f64,
    },
    Rectangle {
        x: f64,
        y: f64,
        width: f64,
        height: f64,
    },
    Ellipse {
        x: f64,
        y: f64,
        width: f64,
        height: f64,
    },
    Line {
        x: f64,
        y: f64,
        x2: f64,
        y2: f64,
    },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SnapAxis {
    X,
    Y,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct SnapGuide {
    pub axis: SnapAxis,
    pub value: f64,
    pub from: f64,
    pub to: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct HandlePoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TransformHandles {
    pub nw: HandlePoint,
    pub n: HandlePoint,
    pub ne: HandlePoint,
    pub e: HandlePoint,
    pub se: HandlePoint,
    pub s: HandlePoint,
    pub sw: HandlePoint,
    pub w: HandlePoint,
    pub rotation: Option<HandlePoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasSyncPayload {
    pub nodes: Vec<RenderNode>,
    pub camera: Camera,
    pub viewport: ViewportRect,
    pub selected_ids: Vec<String>,
    pub draft: Option<DraftShape>,
    pub marquee: Option<Rect>,
    pub snap_guides: Vec<SnapGuide>,
    pub show_pixel_grid: bool,
    pub show_handles: bool,
    pub handles: Option<TransformHandles>,
    pub selection_bounds: Option<Rect>,
    pub window_width: u32,
    pub window_height: u32,
}

pub fn screen_to_world(point: Point, camera: Camera) -> Point {
    Point {
        x: (point.x - camera.x) / camera.zoom,
        y: (point.y - camera.y) / camera.zoom,
    }
}

pub fn world_to_screen(point: Point, camera: Camera) -> Point {
    Point {
        x: point.x * camera.zoom + camera.x,
        y: point.y * camera.zoom + camera.y,
    }
}
