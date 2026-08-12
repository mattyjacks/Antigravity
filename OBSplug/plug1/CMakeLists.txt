cmake_minimum_required(VERSION 3.18)
project(obs_plug1 VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find OBS Studio development headers & libraries (OPTIONAL for standalone preview builds)
find_package(libobs QUIET)

if(libobs_FOUND)
    add_library(obs_plug1 MODULE
        src/core/plugin_main.cpp
        src/core/subplugin_manager.cpp
        src/ai_greenscreen/ai_segmenter.cpp
        src/ai_greenscreen/edge_fx_pipeline.cpp
        src/chat_overlay/twitch_chat_client.cpp
        src/chat_renderer.cpp
        src/reactive_fx/effect_trigger_engine.cpp
        src/media_presenter/video_presenter_source.cpp
    )

    target_include_directories(obs_plug1 PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/src
        ${LIBOBS_INCLUDE_DIRS}
    )

    target_link_libraries(obs_plug1 PRIVATE
        libobs
    )

    set_target_properties(obs_plug1 PROPERTIES
        PREFIX ""
        OUTPUT_NAME "obs-plug1"
    )
else()
    message(STATUS "[OBSplug/plug1] libobs SDK not detected on local CMake search path. Dynamic header mocks enabled for standalone build preview.")
endif()
