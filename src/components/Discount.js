import React, { useState, useEffect } from "react";

function Discount() {
  const [validImages, setValidImages] = useState([]);

  const imageUrls = Array.from(
    { length: 100 },
    (_, i) =>
      `https://rajaranimichigan.s3.ap-south-1.amazonaws.com/promotion-${
        i + 1
      }.png`
  );

  useEffect(() => {
    setValidImages(imageUrls);
  }, []);

  const handleImageError = (index) => {
    setValidImages((prev) => prev.filter((_, i) => i !== index));
  };

  const discountImages = validImages.slice(0, 10);

  return (
    <div className="dis-container">
      <h2
        style={{
          color: "#f4a261",
          textAlign: "center",
          margin: "20px 0",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        DISCOUNT OFFERS
      </h2>
      <div className="responsive-wrapper">
        {discountImages.length > 0 ? (
          discountImages.map((image, index) => (
            <div
              key={index}
              style={{
                // flex: "1 1 calc(33.33% - 20px)",
                // maxWidth: "calc(33.33% - 20px)",
                boxSizing: "border-box",
                overflow: "hidden",
                border: "2px solid #ccc",
                background: "white",
                padding: "12px",
              }}
            >
              <img
              className="dis-img"
                // src="https://cd519987.rajarani-website.pages.dev/images/photo/ChickenTikka.jpg"
                src={image}
                alt={`Promotion ${index + 1}`}
                // style={{
                //   width: "300px",
                //   height: "300px",
                //   display: "block",
                //   transition: "transform 0.3s ease",
                // }}
                onError={() => handleImageError(index)}
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
    </div>
  );
}

export default Discount;
