import React, { useState, useEffect } from "react";

function BestDelivered() {
  const [validImages, setValidImages] = useState([]);

  const imageUrls = Array.from(
    { length: 10 },
    (_, i) =>
      `https://rajaranimichigan.s3.ap-south-1.amazonaws.com/best-delivered-${
        i + 1
      }.png`
  );

  useEffect(() => {
    setValidImages(imageUrls);
  }, []);

  const handleImageError = (index) => {
    setValidImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="best-delivered-container">
      <div className="best-delivered">
        <h2>Our Best Delivered</h2>
        <div className="content">
          {validImages.length > 0 ? (
            validImages.map((image, index) => (
              <div key={index} className="food-item">
                <img
                  // src="https://cd519987.rajarani-website.pages.dev/images/photo/ChickenTikka.jpg"
                  src={image}
                  alt={`Best Delivered ${index + 1}`}
                  onError={() => handleImageError(index)}
                />
              </div>
            ))
          ) : (
            <p>No images available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BestDelivered;