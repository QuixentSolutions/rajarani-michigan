import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import "./RegistrationCard.css";

function RegistrationCard() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
    console.log("Registration Data:", formData);

    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      // First, save to database (without email functionality)
      const dbResponse = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
        }),
      });

      const dbData = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(
          dbData.message || "Failed to save registration to database."
        );
      }

      console.log("Registration saved to DB:", dbData);

      // Then send email from frontend using EmailJS
      const templateParams = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      console.log("Sending email with template params:", templateParams);

      // Send email using EmailJS from frontend
      const emailResponse = await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID || "service_otcs6w9",
        process.env.REACT_APP_EMAILJS_ANNIVERSARY_TEMPLATE_ID ||
          "template_l7xjm52",
        templateParams,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "FxwSUoBkBRQjimBrz"
      );

      console.log("EmailJS SUCCESS:", emailResponse);

      alert(
        "Registration Successful! Your details have been saved and confirmation email sent."
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
      });
    } catch (err) {
      console.error("Registration process error:", err);

      // If DB save succeeded but email failed, check error type
      if (err.name && err.name.includes("EmailJS")) {
        alert(
          "Registration saved successfully, but confirmation email could not be sent. Please check your email address."
        );
      } else if (err.message && err.message.includes("email")) {
        alert(
          "Registration saved successfully, but confirmation email could not be sent."
        );
      } else {
        alert(
          `Registration Failed: ${
            err.message || "An unknown error occurred."
          } Please try again later.`
        );
      }
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
        <button type="submit" className="register-button" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}

export default RegistrationCard;
