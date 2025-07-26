import React, { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";

function Discount() {
  const [validImages, setValidImages] = useState([]);

  const imageUrls = Array.from(
    { length: 10 },
    (_, i) =>
      `https://rajarani-michigan.s3.us-east-2.amazonaws.com/discounts/${
        i + 1
      }.png`
  );

  useEffect(() => {
    setValidImages(imageUrls);
    // eslint-disable-next-line
  }, []);

  const handleImageError = (index) => {
    setValidImages((prev) => prev.filter((_, i) => i !== index));
  };
  const discountImages = validImages.slice(0, 10);
  return (
    <div className="dis-container">
      <h2
        style={{
          color: "#333333",
          textAlign: "center",
          margin: "20px 0",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        PROMOTIONS
      </h2>
      <div className="responsive-wrapper">
        <Carousel
          infiniteLoop
          autoPlay
          interval={3000}
          showThumbs={false}
          showStatus={false}
          className="hero-carousel"
        >
          {discountImages.map((image, index) => (
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
                src={image}
                alt={`Gallery View ${index + 1}`}
                className="carousel-image"
                onError={() => handleImageError(index)}
              />
            </div>
          ))}
        </Carousel>

        {/* {discountImages.length > 0 ? (
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
                src={image}
                alt={`Promotion ${index + 1}`}
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
              color: "black",
              fontSize: "18px",
            }}
          >
            No images available
          </p>
        )} */}
      </div>
    </div>
  );
}

export default Discount;
