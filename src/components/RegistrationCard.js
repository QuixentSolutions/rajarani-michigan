import React, { useState } from 'react';
import './RegistrationCard.css';
import emailjs from '@emailjs/browser'; // Use the modern emailjs package

function RegistrationCard() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Registration Data:', formData);

    const templateParams = {
      name: formData.name,
      email: formData.email,
      to_email: formData.email, 
      mobile_number: formData.mobileNumber, 
      order_mode: "3rd Anniversary Registration",
      sub_total: "0.00",
      sales_tax: "0.00",
      total_amount: "0.00",
      address: "Online Registration for Anniversary Event"
    };

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save registration to database.');
      }

      console.log('Registration saved to DB:', data);

      // THIS IS THE FIX: Use the new anniversary template ID and modern syntax
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID, 
        process.env.REACT_APP_EMAILJS_ANNIVERSARY_TEMPLATE_ID, // <-- THE FIX IS HERE
        templateParams,
        { publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY }
      );

      console.log('EmailJS SUCCESS!');
      alert('Registration Successful! Check your email for confirmation.');
      setFormData({
        name: '',
        email: '',
        mobileNumber: '', 
      });

    } catch (err) {
      console.error('Process FAILED:', err);
      alert(`Registration Failed: ${err.message || 'An unknown error occurred.'} Please try again later.`);
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
          />
        </div>
        <div className="form-group">
          <label htmlFor="mobileNumber">Mobile Number:</label>
          <input
            type="tel"
            id="mobileNumber"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="register-button">Register</button>
      </form>
    </div>
  );
}

export default RegistrationCard;