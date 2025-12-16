import { Truck, Award, Smartphone, Shirt, CreditCard, Star } from 'lucide-react'
import ProductCard from './ProductCard'
import { memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Dashboard = ({ onProductClick, featuredProducts }) => {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  const features = [
    { icon: <Truck size={24} />, text: 'Free Delivery' },
    { icon: <CreditCard size={24} />, text: 'COD Payment' },
    { icon: <Award size={24} />, text: 'Authentic Products' }
  ]

  const handleFooterLinkClick = (path) => {
    navigate(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="dashboard">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Great Shopping Experience</h1>
              <p>Discover amazing products at great prices. Free delivery on orders above ₹499.</p>
            </div>
            <div className="hero-image">
              <img 
                src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&w=600" 
                alt="Shopping" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="features-section">
        <div className="container">
          <div className="features-header">
            <h2 className="features-title">Why Shop With Us?</h2>
            <p className="features-subtitle">We provide the best shopping experience for our customers</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <span className="feature-text">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products - UPDATED FOR TOP 5 */}
      {featuredProducts.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <div className="featured-header">
              <h2 className="section-title">Top Rated Products</h2>
              <p className="section-subtitle">
                Our highest rated products
                <span className="rating-badge">
                  <Star size={16} fill="currentColor" />
                  Top 5 by Rating
                </span>
              </p>
            </div>
            
            <div className="products-grid featured-grid">
              {featuredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => onProductClick(product)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-info">
              <p className="footer-text">
                Made by <span className="author-name">Rudra Kanwar</span> © {currentYear} | <span className="country">India</span> | <span className="app-name">ChatCart</span>
              </p>
            </div>
            <div className="footer-links">
              <button 
                onClick={() => handleFooterLinkClick('/')}
                className="footer-link"
              >
                Home
              </button>
              <button 
                onClick={() => handleFooterLinkClick('/electronics')}
                className="footer-link"
              >
                Electronics
              </button>
              <button 
                onClick={() => handleFooterLinkClick('/fashion')}
                className="footer-link"
              >
                Fashion
              </button>
              <button 
                onClick={() => handleFooterLinkClick('/cart')}
                className="footer-link"
              >
                Cart
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default memo(Dashboard)