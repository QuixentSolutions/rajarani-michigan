import React, { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

function Hero() {
  const [validImages, setValidImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const galleryImages = Array.from(
    { length: 10 },
    (_, i) =>
      `https://rajarani-canton.s3.us-east-2.amazonaws.com/gallery/${i + 1}.png`
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
    // eslint-disable-next-line
  }, []);

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="header-container-div">
            <h1>
              Experience the <span>Taste</span> of the South
            </h1>
          </div>
          <div
            style={{
              textAlign: "center",
            }}
          >
            <img src="/halal_food.png" alt="Halal" />
          </div>
          <p
            style={{
              fontSize: "18px",
              lineHeight: "1.6",
              textAlign: "justify",
            }}
          >
            <strong>Raja Rani Indian Restaurant in Canton, MI</strong>, serves
            authentic South Indian food with fresh ingredients and bold spices.
            From crispy dosas to rich curries and flavorful biryanis, every dish
            is made with care. We offer 100% <strong>Halal</strong> meat and
            have both vegetarian and non-vegetarian choices.
          </p>
        </div>
        {isLoading || validImages.length === 0 ? (
          <div className="hero-carousel shimmer">
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
          >
            {validImages.map((image, index) => (
              <div key={index}>
                <img
                  src={image}
                  alt={`Gallery View ${index + 1}`}
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
