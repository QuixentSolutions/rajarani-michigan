import React, { useState, useEffect } from "react";

function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const placeId = "ChIJIxLZNx1TO4gRO48CGGIhids";
  const apiKey = "YOUR_API_KEY";

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`,
          { mode: "cors" }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const data = await response.json();
        if (data.result && data.result.reviews) {
          const formattedReviews = data.result.reviews
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5)
            .map((review) => ({
              name: review.author_name,
              text: review.text,
              rating: review.rating,
            }));
          setTestimonials(formattedReviews);
        } else {
          setError("No reviews found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="testimonial-container">
      <h2 style={{ color: "#f4a261", textAlign: "center", margin: "20px 0" }}>
        What They Say?
      </h2>
      <div className="testimonials">
        {loading ? (
          <p>Loading reviews...</p>
        ) : error ? (
          <p style={{color: "black",fontSize: "18px"}}>{error}</p>
        ) : testimonials.length > 0 ? (
          testimonials.map((testimonial, index) => (
            <div className="testimonial" key={index}>
              <div className="stars">
                {Array.from({ length: testimonial.rating }, (_, i) => (
                  <span key={i}>⭐</span>
                ))}
              </div>
              <p>{testimonial.text}</p>
              <p>- {testimonial.name}</p>
            </div>
          ))
        ) : (
          <p>No reviews available</p>
        )}
      </div>
    </div>
  );
}

export default Testimonials;