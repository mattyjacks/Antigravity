#if __has_include(<obs-module.h>)
#include <obs-module.h>
#include <util/platform.h>
#include <util/dstr.h>
#else
// Fallback OBS API definition stubs for compilation verification
#define OBS_DECLARE_MODULE()
#define OBS_MODULE_USE_DEFAULT_LOCALE(name, lang)
#define MODULE_EXPORT
#define LOG_INFO 0
inline void blog(int level, const char* format, ...) {}
#endif

#include <iostream>
#include "subplugin_manager.hpp"
#include "ai_greenscreen/ai_segmenter.hpp"
#include "reactive_fx/effect_trigger_engine.hpp"
#include "media_presenter/video_presenter_source.hpp"


OBS_DECLARE_MODULE()
OBS_MODULE_USE_DEFAULT_LOCALE("obs-plug1", "en-US")

MODULE_EXPORT bool obs_module_load(void)
{
    blog(LOG_INFO, "[OBSplug/plug1] Initializing Plugin Suite v1.0.0...");

    // 1. Initialize Sub-Plugin Architecture
    obsplug::SubPluginManager::GetInstance().Initialize();

    // 2. Register Sources & Filters
    obsplug::RegisterAISegmenterFilter();
    obsplug::RegisterReactiveFXFilter();
    obsplug::RegisterMediaPresenterSource();

    blog(LOG_INFO, "[OBSplug/plug1] Plugin Suite Loaded successfully! AI Segmentation, Edge FX, Chat Overlay, Reactive FX, and Video Presenter active.");
    return true;
}

MODULE_EXPORT void obs_module_unload(void)
{
    blog(LOG_INFO, "[OBSplug/plug1] Unloading Plugin Suite...");
    obsplug::SubPluginManager::GetInstance().Shutdown();
}

MODULE_EXPORT const char *obs_module_name(void)
{
    return "OBSplug 1.0 - AI GreenScreen & Twitch Interactive Suite";
}

MODULE_EXPORT const char *obs_module_description(void)
{
    return "Next-Gen AI background removal, contour edge shaders, chat overlay, chat-driven video/audio FX, and presentation scene manager for Twitch streamers.";
}
