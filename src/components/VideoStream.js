import { useState, useEffect } from "react";

function VideoStream() {
  const [validVideos, setValidVideos] = useState([]);

  const potentialVideos = Array.from({ length: 10 }, (_, i) => `/videos/${i + 1}.mp4`);

  useEffect(() => {
    const checkVideoExistence = async () => {
      const existingVideos = [];
      for (const video of potentialVideos) {
        try {
          const response = await fetch(`${video}?t=${Date.now()}`, {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache",
            },
          });
          if (response.ok && response.headers.get("Content-Type")?.includes("video/mp4")) {
            existingVideos.push(video);
          }
        } catch (error) {
          console.warn(`Video ${video} not found:`, error);
        }
      }
      setValidVideos(existingVideos);
    };

    checkVideoExistence();
    // eslint-disable-next-line
  }, []);

  const handleVideoError = (index) => {
    setValidVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMouseOver = (e) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  };

  const handleMouseOut = (e) => {
    const video = e.currentTarget;
    if (!video.paused) {
      video.pause();
      video.currentTime = 0;
    }
  };

  return (
    <div className="video-stream-container">
      <h2
        style={{
          color: "#333333",
          textAlign: "center",
          margin: "20px 0",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        VIDEO STREAM
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "10px",
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 10px",
          "@media (min-width: 769px)": {
            gridTemplateColumns: "repeat(3, 1fr)",
            maxWidth: "1200px",
          },
        }}
      >
        {validVideos.length > 0 ? (
          validVideos.map((video, index) => (
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
                style={{
                  width: "100%",
                  height: "auto",
                  "@media (min-width: 769px)": {
                    maxWidth: "250px",
                    maxHeight: "150px",
                  },
                }}
                controls
                preload="metadata"
                onError={() => handleVideoError(index)}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
              >
                <source src={video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          ))
        ) : (
          <p
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              margin: "0 auto",
              padding: "20px 0",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "black",
              fontSize: "18px",
            }}
          >
            No videos available
          </p>
        )}
      </div>
    </div>
  );
}

export default VideoStream;