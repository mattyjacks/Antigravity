#pragma once
#include <string>
#include <vector>
#include <memory>
#include <functional>
#include <unordered_map>

namespace obsplug {

struct ChatEvent {
    std::string username;
    std::string message;
    std::string channel;
    bool isSubscriber;
    bool isMod;
};

class ISubPlugin {
public:
    virtual ~ISubPlugin() = default;
    virtual std::string GetId() const = 0;
    virtual std::string GetName() const = 0;
    virtual std::string GetVersion() const = 0;
    virtual bool Init() = 0;
    virtual void Shutdown() = 0;
    virtual void OnChatMessage(const ChatEvent& event) {}
    virtual void OnFrameUpdate(double deltaTime) {}
};

class SubPluginManager {
public:
    static SubPluginManager& GetInstance() {
        static SubPluginManager instance;
        return instance;
    }

    void Initialize();
    void Shutdown();
    bool RegisterPlugin(std::shared_ptr<ISubPlugin> plugin);
    bool UnregisterPlugin(const std::string& id);
    void DispatchChatMessage(const ChatEvent& event);
    void Update(double deltaTime);
    std::vector<std::shared_ptr<ISubPlugin>> GetLoadedPlugins() const;

private:
    SubPluginManager() = default;
    std::unordered_map<std::string, std::shared_ptr<ISubPlugin>> plugins_;
};

} // namespace obsplug
