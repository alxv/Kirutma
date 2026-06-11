use vello::peniko::Color;

pub fn parse_color(input: &str, opacity: f64) -> Color {
    let trimmed = input.trim();
    let base = if let Some(hex) = trimmed.strip_prefix('#') {
        match hex.len() {
            6 => {
                let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
                let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(255);
                let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
                Color::from_rgb8(r, g, b)
            }
            8 => {
                let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
                let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(255);
                let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
                let a = u8::from_str_radix(&hex[6..8], 16).unwrap_or(255);
                Color::from_rgba8(r, g, b, a)
            }
            _ => Color::WHITE,
        }
    } else if trimmed.starts_with("rgba(") && trimmed.ends_with(')') {
        let inner = trimmed.trim_start_matches("rgba(").trim_end_matches(')');
        let parts: Vec<&str> = inner.split(',').map(str::trim).collect();
        if parts.len() == 4 {
            let r = (parts[0].parse::<f32>().unwrap_or(1.0) * 255.0) as u8;
            let g = (parts[1].parse::<f32>().unwrap_or(1.0) * 255.0) as u8;
            let b = (parts[2].parse::<f32>().unwrap_or(1.0) * 255.0) as u8;
            let a = (parts[3].parse::<f32>().unwrap_or(1.0) * 255.0) as u8;
            Color::from_rgba8(r, g, b, a)
        } else {
            Color::WHITE
        }
    } else {
        Color::WHITE
    };

    base.with_alpha(opacity.clamp(0.0, 1.0) as f32)
}
