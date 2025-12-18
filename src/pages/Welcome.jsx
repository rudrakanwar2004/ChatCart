import { useState, useEffect } from 'react'
import vite from '../assets/vite.png'
const Welcome = ({ onComplete, user }) => {
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Show the button after 2 seconds
    const timer = setTimeout(() => {
      setShowButton(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleStartShopping = () => {
    // Inform parent that welcome is complete and let parent navigate
    if (onComplete) {
      onComplete()
    }
  }

  const userName = user?.name || null

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
          <br />
          <div className="logo-icon">
            <img src={vite} alt="ChatCart Logo" width={150} height={150} />
          </div>
          <br />
          <h1 className="welcome-title">ChatCart</h1>
          <p className="welcome-subtitle">Premium Electronics & Fashion</p>
        </div>

        <div className="welcome-message">
          {userName ? (
            <>
              <br />
              <h2>Welcome {userName} 👋</h2>
              <p>Ready to explore the best deals with ChatFit?</p>

            </>
          ) : (
            <>
            <br />
            <p>Ready to explore the best deals with ChatFit?</p>
            </>
          )}
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
            <span>{userName ? 'Continue to Home' : 'Start Shopping'}</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Welcome
