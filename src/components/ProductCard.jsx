import { Star, Truck, Shield } from 'lucide-react'
import { memo, useState } from 'react'

const ProductCard = ({ product, onAddToCart }) => {
  const [imageError, setImageError] = useState(false)
  
  const { discount, priceINR, originalPrice } = product

  const handleImageError = () => {
    setImageError(true)
  }

  const getFallbackImage = () => {
    // Different fallback images based on category
    if (product.category === 'electronics') {
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
    } else {
      return 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
    }
  }

  return (
    <div className="product-card">
      <div className="product-badge">-{discount}%</div>
      
      <div className="product-image">
        <img 
          src={imageError ? getFallbackImage() : product.image} 
          alt={product.title}
          onError={handleImageError}
        />
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        
        <div className="product-brand">
          {product.brand || 'Premium Brand'}
        </div>
        
        <div className="product-rating">
          <div className="stars">
            <Star size={14} fill="currentColor" />
            <span>{product.rating?.rate?.toFixed(1) || 4.5}</span>
          </div>
          <span className="rating-count">
            ({product.rating?.count || 100})
          </span>
        </div>

        <div className="product-pricing">
          <span className="current-price">₹{priceINR}</span>
          <span className="original-price">₹{originalPrice}</span>
          <span className="discount">Save ₹{originalPrice - priceINR}</span>
        </div>

        <div className="product-features">
          <div className="feature">
            <Truck size={14} />
            <span>Free delivery</span>
          </div>
          <div className="feature">
            <Shield size={14} />
            <span>1 year warranty</span>
          </div>
        </div>

        <button 
          className="add-to-cart-btn"
          onClick={onAddToCart}
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}

export default memo(ProductCard)