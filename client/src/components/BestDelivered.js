import React, { useState, useEffect } from "react";

function BestDelivered() {
  const [validImages, setValidImages] = useState([]);

  const imageUrls = Array.from(
    { length: 10 },
    (_, i) =>
      `https://rajarani-michigan.s3.us-east-2.amazonaws.com/best-delivered/${
        i + 1
      }.jpeg`
  );

  useEffect(() => {
    const loadImages = async () => {
      const loadedImages = await Promise.all(
        imageUrls.map(
          (url) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () =>
                resolve({ url, width: img.width, height: img.height });
              img.onerror = () => resolve(null);
              img.src = url;
            })
        )
      );
      setValidImages(loadedImages.filter((img) => img !== null));
    };
    loadImages();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="bd-container">
      <h2
        style={{
          color: "white",
          textAlign: "center",
          margin: "20px 0",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        BEST DELIVERED
      </h2>
      <div className="bd-wrapper">
        {validImages.length > 0 ? (
          validImages.map((image, index) => (
            <div
              key={index}
              className={`bd-item ${
                image.width > image.height
                  ? "bd-item-horizontal"
                  : "bd-item-vertical"
              }`}
              style={{
                boxSizing: "border-box",
                overflow: "hidden",
                border: "2px solid #ccc",
                background: "white",
                padding: "2px",
              }}
            >
              <img
                src={image.url}
                alt={`Best Delivered ${index + 1}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  borderRadius: "10px",
                  display: "block",
                  padding: "10px",
                }}
                onError={() => handleImageError(index)}
              />
            </div>
          ))
        ) : (
          <p
            style={{
              textAlign: "center",
              margin: "0 auto",
              padding: "20px 0",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontSize: "18px",
            }}
          >
            No images available
          </p>
        )}
      </div>
    </div>
  );

  function handleImageError(index) {
    setValidImages((prev) => prev.filter((_, i) => i !== index));
  }
}

export default BestDelivered;
