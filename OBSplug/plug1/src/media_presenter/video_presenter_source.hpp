#pragma once
#include <string>
#include <vector>
#include <queue>

namespace obsplug {

struct VideoAdItem {
    std::string id;
    std::string title;
    std::string videoFilePath;
    double durationSeconds;
    std::string sponsorName;
    bool autoDuckMicAudio = true;
};

class VideoPresenterSource {
public:
    VideoPresenterSource();
    ~VideoPresenterSource();

    void QueueVideo(const VideoAdItem& video);
    void PlayNext();
    void Pause();
    void Resume();
    void Stop();

    void Update(double deltaTime);

    bool IsPlaying() const { return isPlaying_; }
    VideoAdItem GetCurrentVideo() const { return currentVideo_; }
    double GetPlaybackProgressSeconds() const { return playbackProgress_; }

private:
    std::queue<VideoAdItem> playQueue_;
    VideoAdItem currentVideo_;
    bool isPlaying_ = false;
    double playbackProgress_ = 0.0;
};

void RegisterMediaPresenterSource();

} // namespace obsplug
