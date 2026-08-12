#include "subplugin_manager.hpp"
#include <iostream>

namespace obsplug {

// Built-in sample sub-plugin: Emote Rain
class EmoteRainSubPlugin : public ISubPlugin {
public:
    std::string GetId() const override { return "subplugin_emote_rain"; }
    std::string GetName() const override { return "Emote Rain Visualizer"; }
    std::string GetVersion() const override { return "1.0.0"; }
    
    bool Init() override {
        std::cout << "[SubPlugin: Emote Rain] Initialized." << std::endl;
        return true;
    }

    void Shutdown() override {
        std::cout << "[SubPlugin: Emote Rain] Shutting down." << std::endl;
    }

    void OnChatMessage(const ChatEvent& event) override {
        if (event.message.find("POG") != std::string::npos || event.message.find("LUL") != std::string::npos) {
            std::cout << "[SubPlugin: Emote Rain] Triggering emote cascade for message: " << event.message << std::endl;
        }
    }
};

// Built-in sample sub-plugin: Soundboard Trigger
class SoundboardSubPlugin : public ISubPlugin {
public:
    std::string GetId() const override { return "subplugin_soundboard"; }
    std::string GetName() const override { return "Interactive Chat Soundboard"; }
    std::string GetVersion() const override { return "1.0.0"; }

    bool Init() override {
        std::cout << "[SubPlugin: Soundboard] Initialized." << std::endl;
        return true;
    }

    void Shutdown() override {
        std::cout << "[SubPlugin: Soundboard] Shutting down." << std::endl;
    }

    void OnChatMessage(const ChatEvent& event) override {
        if (event.message.find("!cheer") != std::string::npos) {
            std::cout << "[SubPlugin: Soundboard] Playing cheer sound FX for " << event.username << std::endl;
        }
    }
};

void SubPluginManager::Initialize() {
    std::cout << "[SubPluginManager] Initializing modular ecosystem..." << std::endl;
    RegisterPlugin(std::make_shared<EmoteRainSubPlugin>());
    RegisterPlugin(std::make_shared<SoundboardSubPlugin>());
}

void SubPluginManager::Shutdown() {
    for (auto& [id, plugin] : plugins_) {
        plugin->Shutdown();
    }
    plugins_.clear();
}

bool SubPluginManager::RegisterPlugin(std::shared_ptr<ISubPlugin> plugin) {
    if (!plugin) return false;
    std::string id = plugin->GetId();
    if (plugins_.find(id) != plugins_.end()) return false;
    
    if (plugin->Init()) {
        plugins_[id] = plugin;
        std::cout << "[SubPluginManager] Registered sub-plugin: " << plugin->GetName() << " (" << id << ")" << std::endl;
        return true;
    }
    return false;
}

bool SubPluginManager::UnregisterPlugin(const std::string& id) {
    auto it = plugins_.find(id);
    if (it == plugins_.end()) return false;
    it->second->Shutdown();
    plugins_.erase(it);
    return true;
}

void SubPluginManager::DispatchChatMessage(const ChatEvent& event) {
    for (auto& [id, plugin] : plugins_) {
        plugin->OnChatMessage(event);
    }
}

void SubPluginManager::Update(double deltaTime) {
    for (auto& [id, plugin] : plugins_) {
        plugin->OnFrameUpdate(deltaTime);
    }
}

std::vector<std::shared_ptr<ISubPlugin>> SubPluginManager::GetLoadedPlugins() const {
    std::vector<std::shared_ptr<ISubPlugin>> result;
    for (const auto& [id, plugin] : plugins_) {
        result.push_back(plugin);
    }
    return result;
}

} // namespace obsplug
