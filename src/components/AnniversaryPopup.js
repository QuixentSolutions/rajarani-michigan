import React, { useEffect, useState } from 'react';
import './AnniversaryPopup.css';

function AnniversaryPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const scrollToRegistration = () => {
    // Hide the popup immediately and mark as clicked
    setIsVisible(false);
    setHasBeenClicked(true);

    const registrationCard = document.getElementById('anniversary-registration');
    if (registrationCard) {
      registrationCard.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Don't render anything if it has been clicked
  if (hasBeenClicked) {
    return null;
  }

  return (
    <div className={`anniversary-popup ${isVisible ? 'is-visible' : ''}`}>
      <div className="celebration-card">
        {/* Floating sparkles */}
        <div className="sparkle sparkle-1">
          ✨
        </div>
        <div className="sparkle sparkle-2">
          ✨
        </div>
        <div className="sparkle sparkle-3">
          ✨
        </div>
        <div className="sparkle sparkle-4">
          ✨
        </div>
        
        {/* Main content */}
        <div className="card-header">
          <div className="trophy-icon">
            🍃
          </div>
          <div className="anniversary-badge">3rd</div>
        </div>
        
        <div className="card-content">
          <h3 className="title">Anniversary!</h3>
        </div>
        
        <button onClick={scrollToRegistration} className="register-btn">
          🍽️
          <span>Register Now</span>
          <div className="btn-glow"></div>
        </button>
        
        {/* Decorative elements */}
        <div className="celebration-rays"></div>
      </div>
    </div>
  );
}

export default AnniversaryPopup;