import React, { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

function Hero() {
  const [validImages, setValidImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const galleryImages = Array.from(
    { length: 10 },
    (_, i) =>
      `https://rajarani-michigan.s3.us-east-2.amazonaws.com/gallery/${
        i + 1
      }.jpeg`
  );
  //   const tryExtensions = [".png", ".jpg", ".jpeg", ".webp"];

  //   const galleryImages = Array.from({ length: 10 }, (_, i) =>
  //   tryExtensions.map(
  //     (ext) =>
  //       `https://rajarani-michigan.s3.us-east-2.amazonaws.com/gallery/${i + 1}${ext}`
  //   )
  // ).flat();

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
          {/* <h1>
            <span>
              <i>Taste of South India</i>
            </span>
          </h1> */}
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
            awaits you at <strong>Raja Rani Indian Restaurant</strong> in
            Canton, MI. From crispy dosas to rich curries, biryanis, and
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
            We proudly serve 100% <strong>Halal</strong> meat, ensuring both
            quality and authenticity. Come enjoy our flavorful vegetarian and
            non-vegetarian options prepared by expert chefs who bring the heart
            of India to your plate.
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
