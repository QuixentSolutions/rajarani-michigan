import React, { useState } from "react";
import "./AnnualDayRegistration.css";
import { FaCalendarAlt, FaUtensils, FaTimes } from "react-icons/fa";

function AnnualDayRegistration({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    date: "",
    foodPreference: "veg",
    quantity: "1"
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    
    const mobileRegex = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/;
    if (!formData.mobileNumber || !mobileRegex.test(formData.mobileNumber)) {
      newErrors.mobileNumber = "Valid mobile number is required";
    }
    
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        // Save to database using the same endpoint as anniversary
        const dbResponse = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            mobile: formData.mobileNumber.trim(),
            eventDate: formData.date,
            eventName: "Annual Day Celebration",
            foodPreference: formData.foodPreference,
            quantity: formData.quantity
          }),
        });

        const dbData = await dbResponse.json();

        if (!dbResponse.ok) {
          throw new Error(
            dbData.message || "Failed to save registration to database."
          );
        }

        alert("Annual Day Registration successful! Confirmation email sent.");
        
        // Reset form and close popup
        setFormData({
          name: "",
          email: "",
          mobileNumber: "",
          date: "",
          foodPreference: "veg",
          quantity: "1"
        });
        onClose();
        
      } catch (err) {
        console.error("Registration process error:", err);
        alert(`Registration Failed: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/^\+1/, "").replace(/\D/g, "");
    if (digits.length <= 3) return `+1 ${digits}`;
    if (digits.length <= 6)
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
      6,
      10,
    )}`;
  };

  const handleMobileChange = (e) => {
    const input = e.target.value;
    if (!input.startsWith("+1") && input !== "") {
      setFormData(prev => ({ ...prev, mobileNumber: "+1" }));
      return;
    }
    const formatted = formatPhoneNumber(input);
    setFormData(prev => ({ ...prev, mobileNumber: formatted }));
  };

  if (!isOpen) return null;

  return (
    <div className="annual-day-overlay">
      <div className="annual-day-modal">
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="modal-header">
          <FaCalendarAlt className="header-icon" />
          <h2>Annual Day Registration</h2>
          <p>Join us for our special Annual Day celebration!</p>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "error" : ""}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="mobileNumber">Mobile Number *</label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleMobileChange}
              className={errors.mobileNumber ? "error" : ""}
              placeholder="+1 (555) 123-4567"
              disabled={isLoading}
            />
            {errors.mobileNumber && <span className="error-message">{errors.mobileNumber}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="date">Registration Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? "error" : ""}
              min={new Date().toISOString().split('T')[0]}
              disabled={isLoading}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Number of People *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={errors.quantity ? "error" : ""}
              min="1"
              max="10"
              placeholder="How many people?"
              disabled={isLoading}
            />
            {errors.quantity && <span className="error-message">{errors.quantity}</span>}
          </div>

          <div className="form-group">
            <label>Food Preference *</label>
            <div className="food-preference">
              <label className="radio-label">
                <input
                  type="radio"
                  name="foodPreference"
                  value="veg"
                  checked={formData.foodPreference === "veg"}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className="radio-custom">
                  <FaUtensils /> Vegetarian
                </span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="foodPreference"
                  value="non-veg"
                  checked={formData.foodPreference === "non-veg"}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className="radio-custom">
                  <FaUtensils /> Non-Vegetarian
                </span>
              </label>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register Now"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AnnualDayRegistration;
