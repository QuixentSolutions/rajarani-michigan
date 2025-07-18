import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

function PhotoStream() {
  const [validImages, setValidImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Generate array of image URLs (1 to 100)
  const imageUrls = Array.from(
    { length: 10 },
    (_, i) =>
      `https://rajaranimichigan.s3.ap-south-1.amazonaws.com/photo-stream-${
        i + 1
      }.png`
  );

  useEffect(() => {
    setValidImages(imageUrls);
  }, []);

  const handleImageError = (index) => {
    setValidImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleClosePopup = () => {
    setSelectedImage(null);
  };

  return (
    <div className="photo-stream-container">
      <h2
        style={{
          color: "#f4a261",
          textAlign: "center",
          margin: "20px 0",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        PHOTO STREAM
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "10px",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 10px",
        }}
      >
        {validImages.length > 0 ? (
          validImages.map((image, index) => (
            <div
              key={index}
              style={{
                overflow: "hidden",
                cursor: "pointer",
                border: "2px solid #ccc",
                background: "white",
                padding: "5px",
              }}
            >
              <img
                src={image}
                // src="https://cd519987.rajarani-website.pages.dev/images/photo/ChickenTikka.jpg"
                alt={`Photo Stream ${index + 1}`}
                className="responsive-img"
                // style={{
                //   width: "100%",
                //   height: "auto",
                //   display: "block",
                //   transition: "transform 0.3s ease",
                // }}
                onError={() => handleImageError(index)}
                onClick={() => handleImageClick(image)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
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
            }}
          >
            No images available
          </p>
        )}
      </div>

      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={handleClosePopup}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "90%",
              maxHeight: "90%",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the image container
          >
            <FaTimes
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                padding: "5px",
                backgroundColor: "#f4a261",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "20px",
              }}
              onClick={handleClosePopup}
            />
            <img
              src="https://cd519987.rajarani-website.pages.dev/images/photo/ChickenTikka.jpg"
              // src={selectedImage}
              alt="Enlarged Photo"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoStream;