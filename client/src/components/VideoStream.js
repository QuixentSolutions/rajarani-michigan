import { useState } from "react";

function VideoStream() {
  const [validVideos, setValidVideos] = useState([]);
  const potentialVideos = Array.from({ length: 10 }, (_, i) =>
    `https://rajarani-michigan.s3.us-east-2.amazonaws.com/video/${i + 1}.MP4`
  );

  const [loadedCount, setLoadedCount] = useState(0);

  const handleVideoLoad = (videoUrl) => {
    setValidVideos((prev) => [...prev, videoUrl]);
    setLoadedCount((count) => count + 1);
  };

  const handleVideoError = () => {
    setLoadedCount((count) => count + 1);
  };

  return (
    <div className="video-stream-container">
      <h2 style={{ textAlign: "center", margin: "20px 0", fontSize: "24px" }}>
        VIDEO STREAM
      </h2>

      {loadedCount < potentialVideos.length && (
        <div style={{ textAlign: "center", margin: "20px" }}>Loading...</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "10px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {potentialVideos.map((videoUrl, index) => (
          <video
            key={index}
            style={{ display: "none" }}
            preload="metadata"
            muted
            onLoadedData={() => handleVideoLoad(videoUrl)}
            onError={handleVideoError}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ))}

        {validVideos.map((videoUrl, index) => (
          <div
            key={index}
            style={{
              overflow: "hidden",
              border: "2px solid #ccc",
              background: "white",
              padding: "5px",
            }}
          >
            <video
              style={{ width: "100%", height: "auto" }}
              controls
              muted
              preload="metadata"
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VideoStream;