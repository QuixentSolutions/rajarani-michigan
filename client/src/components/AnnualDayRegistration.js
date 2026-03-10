import React, { useState } from "react";
import "./AnnualDayRegistration.css";
import { FaCalendarAlt, FaUtensils, FaTimes } from "react-icons/fa";

function AnnualDayRegistration({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    date: "2026-05-12",
    vegCount: "1",
    nonVegCount: "0"
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
    
    const totalPeople = parseInt(formData.vegCount || 0) + parseInt(formData.nonVegCount || 0);
    if (totalPeople < 1) {
      newErrors.vegCount = "At least one person must be registered";
    }
    
    if (parseInt(formData.vegCount || 0) < 0) {
      newErrors.vegCount = "Veg count cannot be negative";
    }
    
    if (parseInt(formData.nonVegCount || 0) < 0) {
      newErrors.nonVegCount = "Non-veg count cannot be negative";
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
        // Calculate total people for this registration
        const totalPeople = parseInt(formData.vegCount || 0) + parseInt(formData.nonVegCount || 0);
        
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
            vegCount: parseInt(formData.vegCount) || 0,
            nonVegCount: parseInt(formData.nonVegCount) || 0,
            quantity: totalPeople.toString()
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
          date: "2026-05-12",
          vegCount: "1",
          nonVegCount: "0"
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
            <label htmlFor="date">Event Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              readOnly
              style={{backgroundColor: '#f8f9fa', cursor: 'not-allowed'}}
              disabled={isLoading}
            />
            <small style={{color: '#666', fontSize: '12px'}}>Annual Day Celebration - May 12, 2026</small>
          </div>

          <div className="form-group">
            <label>Food Preferences *</label>
            
            <div className="food-count-container" style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
              <div className="food-count-item" style={{flex: 1}}>
                <label htmlFor="vegCount" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
                  <FaUtensils style={{color: '#28a745'}} /> Vegetarian
                </label>
                <input
                  type="number"
                  id="vegCount"
                  name="vegCount"
                  value={formData.vegCount}
                  onChange={handleChange}
                  className={errors.vegCount ? "error" : ""}
                  min="0"
                  max="10"
                  placeholder="0"
                  disabled={isLoading}
                  style={{width: '100%', padding: '10px', border: errors.vegCount ? '1px solid #dc3545' : '1px solid #ddd', borderRadius: '5px'}}
                />
                {errors.vegCount && <span className="error-message">{errors.vegCount}</span>}
              </div>
              
              <div className="food-count-item" style={{flex: 1}}>
                <label htmlFor="nonVegCount" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
                  <FaUtensils style={{color: '#dc3545'}} /> Non-Vegetarian
                </label>
                <input
                  type="number"
                  id="nonVegCount"
                  name="nonVegCount"
                  value={formData.nonVegCount}
                  onChange={handleChange}
                  className={errors.nonVegCount ? "error" : ""}
                  min="0"
                  max="10"
                  placeholder="0"
                  disabled={isLoading}
                  style={{width: '100%', padding: '10px', border: errors.nonVegCount ? '1px solid #dc3545' : '1px solid #ddd', borderRadius: '5px'}}
                />
                {errors.nonVegCount && <span className="error-message">{errors.nonVegCount}</span>}
              </div>
            </div>
            
            <div style={{fontSize: '14px', color: '#28a745', fontWeight: 'bold'}}>
              Total People: {parseInt(formData.vegCount || 0) + parseInt(formData.nonVegCount || 0)}
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
