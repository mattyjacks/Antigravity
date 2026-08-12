#pragma once
#include <string>
#include <unordered_map>
#include <chrono>
#include <vector>
#include <memory>

namespace obsplug {

enum class TriggerEffectType {
    FireAura,
    ScreenShake,
    GlitchAudioVisual,
    Pixelate,
    RainbowHue,
    ExplosionSound
};

struct ActiveEffect {
    TriggerEffectType type;
    float durationSeconds;
    float remainingSeconds;
    float intensity;
};

class EffectTriggerEngine {
public:
    static EffectTriggerEngine& GetInstance() {
        static EffectTriggerEngine instance;
        return instance;
    }

    void Initialize();
    void ProcessChatMessage(const std::string& username, const std::string& message);
    void Update(float deltaTime);

    std::vector<ActiveEffect> GetActiveEffects() const { return activeEffects_; }
    bool IsEffectActive(TriggerEffectType type) const;

    // Mapping keyword / emoji -> trigger effect
    void RegisterKeywordTrigger(const std::string& keyword, TriggerEffectType type, float duration = 4.0f);

private:
    EffectTriggerEngine() = default;
    std::unordered_map<std::string, std::pair<TriggerEffectType, float>> keywordMap_;
    std::vector<ActiveEffect> activeEffects_;
};

void RegisterReactiveFXFilter();

} // namespace obsplug
