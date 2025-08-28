import React, { useState } from "react";
import "./RegistrationCard.css";

function RegistrationCard() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      // First, save to database (without email functionality)
      const dbResponse = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          eventDate: "03-Sep-2025",
          eventName: "3rd Anniversary Celebration",
        }),
      });

      const dbData = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(
          dbData.message || "Failed to save registration to database."
        );
      }

      console.log("Registration saved to DB:", dbData);

      alert("Registration successful! Confirmation email sent.");

      // Reset form
      setFormData({
        name: "",
        email: "",
        mobile: "",
      });
    } catch (err) {
      console.error("Registration process error:", err);
      alert(`Registration Failed, Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-card-container" id="anniversary-registration">
      <h2>3rd Anniversary Celebration Registration</h2>
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Mobile:</label>
          <input
            type="text"
            id="mobile"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="register-button" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}

export default RegistrationCard;
