import React, { useState } from 'react';
import AnnualDayRegistration from './AnnualDayRegistration';

function AnnualDayBanner() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleClick = () => {
    setIsPopupOpen(true);
  };

  const handleClose = () => {
    setIsPopupOpen(false);
  };

  return (
    <>
      <div 
        onClick={handleClick}
        style={{
          width: '100%',
          cursor: 'pointer',
          margin: '20px 0',
          textAlign: 'center'
        }}
      >
        <img 
          src={`${process.env.PUBLIC_URL}/annualDayBanner.jpeg`} 
          alt="Annual Day Celebration"
          style={{
            width: '100%',
            maxWidth: '500px',
            height: 'auto',
            maxHeight: '500px',
            objectFit: 'cover',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
          onError={(e) => {
            console.error('Image failed to load:', e.target.src);
            // Show a placeholder if image fails
            e.target.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
              background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
              color: white;
              padding: 60px 20px;
              border-radius: 8px;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              cursor: pointer;
            `;
            placeholder.innerHTML = `
              <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
              <div style="margin-bottom: 10px;">Annual Day Celebration</div>
              <div style="font-size: 16px; font-weight: normal;">Click here to register</div>
            `;
            placeholder.onclick = handleClick;
            e.target.parentNode.appendChild(placeholder);
          }}
          onLoad={(e) => {
            console.log('Image loaded successfully:', e.target.src);
          }}
        />
      </div>

      <AnnualDayRegistration 
        isOpen={isPopupOpen} 
        onClose={handleClose} 
      />
    </>
  );
}

export default AnnualDayBanner;
