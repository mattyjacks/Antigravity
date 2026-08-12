#include "effect_trigger_engine.hpp"
#include "../core/subplugin_manager.hpp"
#include <iostream>
#include <algorithm>

namespace obsplug {

void EffectTriggerEngine::Initialize() {
    std::cout << "[EffectTriggerEngine] Initializing Chat Reactive FX triggers..." << std::endl;

    // Default triggers
    RegisterKeywordTrigger("fire", TriggerEffectType::FireAura, 5.0f);
    RegisterKeywordTrigger("🔥", TriggerEffectType::FireAura, 5.0f);
    RegisterKeywordTrigger("shake", TriggerEffectType::ScreenShake, 3.0f);
    RegisterKeywordTrigger("glitch", TriggerEffectType::GlitchAudioVisual, 4.0f);
    RegisterKeywordTrigger("pixel", TriggerEffectType::Pixelate, 4.0f);
    RegisterKeywordTrigger("rainbow", TriggerEffectType::RainbowHue, 6.0f);
    RegisterKeywordTrigger("boom", TriggerEffectType::ExplosionSound, 2.0f);
}

void EffectTriggerEngine::RegisterKeywordTrigger(const std::string& keyword, TriggerEffectType type, float duration) {
    keywordMap_[keyword] = { type, duration };
}

void EffectTriggerEngine::ProcessChatMessage(const std::string& username, const std::string& message) {
    std::string lowerMsg = message;
    std::transform(lowerMsg.begin(), lowerMsg.end(), lowerMsg.begin(), ::tolower);

    for (const auto& [kw, effectData] : keywordMap_) {
        if (lowerMsg.find(kw) != std::string::npos || message.find(kw) != std::string::npos) {
            std::cout << "[EffectTriggerEngine] Chat trigger fired by '" << username 
                      << "'! Keyword: '" << kw << "'" << std::endl;

            activeEffects_.push_back({
                effectData.first,
                effectData.second,
                effectData.second,
                1.0f
            });

            // Also dispatch event to SubPlugin Ecosystem
            ChatEvent evt{ username, message, "twitch_channel", false, false };
            SubPluginManager::GetInstance().DispatchChatMessage(evt);
        }
    }
}

void EffectTriggerEngine::Update(float deltaTime) {
    for (auto it = activeEffects_.begin(); it != activeEffects_.end();) {
        it->remainingSeconds -= deltaTime;
        if (it->remainingSeconds <= 0.0f) {
            it = activeEffects_.erase(it);
        } else {
            ++it;
        }
    }
}

bool EffectTriggerEngine::IsEffectActive(TriggerEffectType type) const {
    for (const auto& fx : activeEffects_) {
        if (fx.type == type) return true;
    }
    return false;
}

void RegisterReactiveFXFilter() {
    std::cout << "[OBSplug/plug1] Registered Reactive Audio/Video FX Filter Node." << std::endl;
}

} // namespace obsplug
