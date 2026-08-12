#include "video_presenter_source.hpp"
#include <iostream>

namespace obsplug {

VideoPresenterSource::VideoPresenterSource() {}
VideoPresenterSource::~VideoPresenterSource() {}

void VideoPresenterSource::QueueVideo(const VideoAdItem& video) {
    playQueue_.push(video);
    std::cout << "[VideoPresenterSource] Queued presentation video: " << video.title 
              << " (" << video.sponsorName << ")" << std::endl;
    
    if (!isPlaying_) {
        PlayNext();
    }
}

void VideoPresenterSource::PlayNext() {
    if (playQueue_.empty()) {
        isPlaying_ = false;
        std::cout << "[VideoPresenterSource] Presentation queue finished." << std::endl;
        return;
    }

    currentVideo_ = playQueue_.front();
    playQueue_.pop();
    isPlaying_ = true;
    playbackProgress_ = 0.0;

    std::cout << "[VideoPresenterSource] PRESENTING VIDEO: " << currentVideo_.title 
              << " | Auto-Ducking Streamer Mic Audio: " << (currentVideo_.autoDuckMicAudio ? "YES" : "NO") << std::endl;
}

void VideoPresenterSource::Pause() {
    isPlaying_ = false;
}

void VideoPresenterSource::Resume() {
    if (!currentVideo_.id.empty()) {
        isPlaying_ = true;
    }
}

void VideoPresenterSource::Stop() {
    isPlaying_ = false;
    playbackProgress_ = 0.0;
    while (!playQueue_.empty()) playQueue_.pop();
}

void VideoPresenterSource::Update(double deltaTime) {
    if (!isPlaying_) return;

    playbackProgress_ += deltaTime;
    if (playbackProgress_ >= currentVideo_.durationSeconds) {
        std::cout << "[VideoPresenterSource] Finished video presentation: " << currentVideo_.title << std::endl;
        PlayNext();
    }
}

void RegisterMediaPresenterSource() {
    std::cout << "[OBSplug/plug1] Registered 'Present Premade Video' OBS Scene Source Node." << std::endl;
}

} // namespace obsplug
