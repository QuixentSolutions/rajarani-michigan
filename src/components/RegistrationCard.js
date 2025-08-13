import React, { useState } from 'react';
import './RegistrationCard.css';
import emailjs from 'emailjs-com';

function RegistrationCard() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration Data:', formData);

    // EmailJS parameters - mapping form data and providing placeholders
    const templateParams = {
      name: formData.name,
      email: formData.email,
      date: formData.date, 
      mobile_number: "N/A", 
      order_mode: "3rd Anniversary Registration",
      sub_total: "0.00",
      sales_tax: "0.00",
      total_amount: "0.00",
      address: "N/A - Online Registration"
    };

    emailjs.send('service_otcs6w9', 'template_l7xjm52', templateParams)
      .then((response) => {
         console.log('SUCCESS!', response.status, response.text);
         alert('Registration Successful!');
         setFormData({
          name: '',
          email: '',
          date: ''
         });
      },
      (err) => {
         console.log('FAILED...', err);
         alert('Registration Failed. Please try again later.');
      });
  };

  return (
    <div className="registration-card-container">
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
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
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
