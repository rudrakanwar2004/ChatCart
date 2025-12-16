import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = ({ onComplete }) => {
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show the button after 2 seconds
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartShopping = () => {
    // Call the onComplete callback to hide welcome screen
    if (onComplete) {
      onComplete();
    }
    // Navigate to login page instead of home
    navigate('/login');
  };

  return (
    <div className="welcome-container">
      {/* Animated Background */}
      <div className="welcome-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      {/* Content */}
      <div className="welcome-content">
        <div className="logo-section">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.2 16.5H17M17 16.5C15.9 16.5 15 17.4 15 18.5C15 19.6 15.9 20.5 17 20.5C18.1 20.5 19 19.6 19 18.5C19 17.4 18.1 16.5 17 16.5ZM9 18.5C9 19.6 8.1 20.5 7 20.5C5.9 20.5 5 19.6 5 18.5C5 17.4 5.9 16.5 7 16.5C8.1 16.5 9 17.4 9 18.5Z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="welcome-title">ChatCart</h1>
          <p className="welcome-subtitle">Premium Electronics & Fashion</p>
        </div>

        <div className="welcome-message">
          <h2>Welcome to Your Ultimate Shopping Destination</h2>
          <p>Discover the latest in electronics and fashion with AI-powered shopping assistance</p>
        </div>

        {/* Feature Highlights */}
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Shopping Assistant</h3>
            <p>Get personalized recommendations with ChatFit</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Delivery</h3>
            <p>2-4 day delivery across India</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Best Prices</h3>
            <p>Guaranteed best deals</p>
          </div>
        </div>

        {/* Start Shopping Button */}
        <div className={`button-container ${showButton ? 'visible' : ''}`}>
          <button 
            className="start-shopping-btn"
            onClick={handleStartShopping}
          >
            <span>Start Shopping</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;