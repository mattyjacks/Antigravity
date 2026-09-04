use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DemoClip {
    pub id: String,
    pub title: String,
    pub category: String,
    pub description: String,
    pub duration_seconds: u32,
    pub preview_gradient: String,
    pub tags: Vec<String>,
}

pub fn get_default_demos() -> Vec<DemoClip> {
    vec![
        DemoClip {
            id: "demo-ai-vision".into(),
            title: "Autonomous AI Vision System".into(),
            category: "Artificial Intelligence".into(),
            description: "Live real-time neural network detection & semantic scene mapping.".into(),
            duration_seconds: 8,
            preview_gradient: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)".into(),
            tags: vec!["AI".into(), "Computer Vision".into(), "PyTorch".into()],
        },
        DemoClip {
            id: "demo-webgl-shader".into(),
            title: "Procedural 3D Quantum Core".into(),
            category: "Creative Dev & Shaders".into(),
            description: "Real-time raymarched volumetric quantum reactor rendered at 120 FPS.".into(),
            duration_seconds: 8,
            preview_gradient: "linear-gradient(135deg, #b026ff 0%, #00ff66 100%)".into(),
            tags: vec!["WebGL".into(), "Three.js".into(), "GLSL".into()],
        },
        DemoClip {
            id: "demo-tauri-rust".into(),
            title: "Ultra-Fast Rust Desktop Suite".into(),
            category: "Systems Engineering".into(),
            description: "Cross-platform lightweight multi-threaded video streaming engine.".into(),
            duration_seconds: 8,
            preview_gradient: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)".into(),
            tags: vec!["Rust".into(), "Tauri".into(), "Zero-Copy".into()],
        },
        DemoClip {
            id: "demo-fullstack-cloud".into(),
            title: "High-Scale Distributed Cloud".into(),
            category: "Cloud Architecture".into(),
            description: "Sub-millisecond global edge event mesh handling 100k+ events/sec.".into(),
            duration_seconds: 8,
            preview_gradient: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)".into(),
            tags: vec!["Distributed".into(), "Kafka".into(), "Kubernetes".into()],
        },
        DemoClip {
            id: "demo-mobile-native".into(),
            title: "Next-Gen Mobile Ecosystem".into(),
            category: "Mobile Apps".into(),
            description: "Fluid 120Hz gesture-driven mobile app architecture with offline sync.".into(),
            duration_seconds: 8,
            preview_gradient: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)".into(),
            tags: vec!["React Native".into(), "Swift".into(), "Kotlin".into()],
        },
        DemoClip {
            id: "demo-blockchain-defi".into(),
            title: "Algorithmic Market Intelligence".into(),
            category: "Fintech & Web3".into(),
            description: "Real-time liquidity visualizer and high-frequency orderbook analytics.".into(),
            duration_seconds: 8,
            preview_gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)".into(),
            tags: vec!["Fintech".into(), "WebSockets".into(), "Analytics".into()],
        },
    ]
}
