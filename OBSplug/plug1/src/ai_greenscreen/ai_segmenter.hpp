#pragma once
#include <string>
#include <vector>
#include <cstdint>

namespace obsplug {

enum class EdgeEffectMode {
    None = 0,
    FireAura,
    CyberpunkNeon,
    ElectricArc,
    RainbowGlow,
    GlitchBorder
};

enum class ComputeMode {
    GPU_WebGL_DirectX,
    CPU_SIMD_Accelerated
};

struct EdgeFXSettings {
    EdgeEffectMode mode = EdgeEffectMode::FireAura;
    float glowRadius = 15.0f;
    float intensity = 1.2f;
    float speed = 1.0f;
    uint32_t primaryColorHex = 0xFF5500FF; // Fire orange
    uint32_t secondaryColorHex = 0xFFFF00FF; // Flame yellow
    bool animate = true;
};

class AISegmenter {
public:
    AISegmenter();
    ~AISegmenter();

    bool InitModel(ComputeMode mode = ComputeMode::GPU_WebGL_DirectX);
    
    // Processes input frame buffer RGBA, produces mask RGBA and applies edge shader effects
    void ProcessFrame(
        const uint8_t* inFrameBuffer,
        uint8_t* outFrameBuffer,
        int width,
        int height,
        const EdgeFXSettings& edgeSettings
    );

    void SetThreshold(float val) { threshold_ = val; }
    float GetThreshold() const { return threshold_; }

    void SetComputeMode(ComputeMode mode);
    ComputeMode GetComputeMode() const { return computeMode_; }

private:
    ComputeMode computeMode_ = ComputeMode::GPU_WebGL_DirectX;
    float threshold_ = 0.65f;
    bool isLoaded_ = false;

    void InferMaskCPU(const uint8_t* in, uint8_t* mask, int w, int h);
    void ApplyEdgeFX(uint8_t* frame, const uint8_t* mask, int w, int h, const EdgeFXSettings& settings);
};

void RegisterAISegmenterFilter();

} // namespace obsplug
