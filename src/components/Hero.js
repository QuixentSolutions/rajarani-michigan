import React, { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

function Hero() {
  const [validImages, setValidImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const galleryImages = Array.from(
    { length: 100 },
    (_, i) =>
      `https://rajaranimichigan.s3.ap-south-1.amazonaws.com/gallery-${
        i + 1
      }.png`
  );

  const handleImageError = (index) => {
    setValidImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    setIsLoading(true);
    const checkImages = async () => {
      const loadedImages = [];
      for (const image of galleryImages) {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = image;
        });
        loadedImages.push(image);
      }
      setValidImages(loadedImages);
      setIsLoading(false);
    };
    checkImages();
  }, []);

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1>
            Experience the <span>Taste</span> of the South
          </h1>
          <p
            style={{
              fontSize: "18px",
              lineHeight: "1.6",
              textAlign: "justify",
            }}
          >
            A divine blend of Indian tradition and authentic South Indian taste
            awaits you at{" "}
            <strong style={{ background: "white" }}>
              Raja Rani Indian Restaurant
            </strong>{" "}
            in Canton, MI. From crispy dosas to rich curries, biryanis, and
            handcrafted appetizers — every dish is made with fresh ingredients,
            bold spices, and traditional Indian cooking methods.
          </p>
          <p
            style={{
              fontSize: "18px",
              lineHeight: "1.6",
              textAlign: "justify",
            }}
          >
            We proudly serve 100%{" "}
            <strong>
              <span className="halal-highlight">Halal</span>
            </strong>{" "}
            meat, ensuring both quality and authenticity. Come enjoy our
            flavorful vegetarian and non-vegetarian options prepared by expert
            chefs who bring the heart of India to your plate.
          </p>
        </div>
        {isLoading || validImages.length === 0 ? (
          <div
            className="hero-carousel shimmer"
            style={{ background: "white" }}
          >
            <div className="shimmer-effect">Loading......</div>
          </div>
        ) : (
          <Carousel
            infiniteLoop
            autoPlay
            interval={3000}
            showThumbs={false}
            showStatus={false}
            className="hero-carousel"
            style={{ background: "white" }}
          >
            {validImages.map((image, index) => (
              <div key={index} style={{ background: "white" }}>
                <img
                  src={image}
                  alt={`Gallery Image ${index + 1}`}
                  className="carousel-image"
                  onError={() => handleImageError(index)}
                />
              </div>
            ))}
          </Carousel>
        )}
      </div>
    </section>
  );
}

export default Hero;