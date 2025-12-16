import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, Shield, Truck, Clock } from 'lucide-react'

const CartPage = ({ 
  cart, 
  onUpdateQuantity, 
  onRemoveFromCart, 
  onClearCart,
  totalPrice,
  totalDiscount,
  totalAmount,
  totalItems
}) => {
  if (cart.length === 0) {
    return (
      <div className="cart-page empty-cart">
        <div className="container">
          <div className="empty-cart-content">
            <div className="empty-cart-icon">
              <ShoppingBag size={80} />
            </div>
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <span className="cart-count">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items-section">
            <div className="section-header">
              <h2>Cart Items</h2>
              <button onClick={onClearCart} className="clear-cart-btn">
                <Trash2 size={16} />
                Clear Cart
              </button>
            </div>

            <div className="cart-items-list">
              {cart.map(item => (
                <div key={item.id} className="cart-item-card">
                  <div className="item-image">
                    <img src={item.image} alt={item.title} />
                  </div>
                  
                  <div className="item-details">
                    <h3 className="item-title">{item.title}</h3>
                    
                    <div className="item-pricing">
                      <span className="current-price">₹{item.priceINR}</span>
                      <span className="original-price">₹{item.originalPrice}</span>
                      <span className="discount-badge">Save ₹{item.originalPrice - item.priceINR}</span>
                    </div>

                    <div className="item-features">
                      <div className="feature">
                        <Truck size={14} />
                        <span>Free delivery</span>
                      </div>
                      <div className="feature">
                        <Shield size={14} />
                        <span>1 year warranty</span>
                      </div>
                    </div>

                    <div className="quantity-section">
                      <div className="quantity-controls">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        
                        <span className="quantity">{item.quantity}</span>
                        
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <button 
                        onClick={() => onRemoveFromCart(item.id)}
                        className="remove-item-btn"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="item-total">
                    <div className="total-price">₹{item.priceINR * item.quantity}</div>
                    <div className="savings">
                      You save ₹{(item.originalPrice - item.priceINR) * item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-section">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Price ({totalItems} items)</span>
                  <span>₹{totalPrice + totalDiscount}</span>
                </div>
                <div className="price-row discount">
                  <span>Discount</span>
                  <span>-₹{totalDiscount}</span>
                </div>
                <div className="price-row">
                  <span>Shipping</span>
                  <span className="free">FREE</span>
                </div>
                <div className="price-divider"></div>
                <div className="price-row total">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <Link to="/checkout" className="checkout-btn">
                Proceed to Checkout
                <ArrowRight size={20} />
              </Link>

              <div className="security-notice">
                <Shield size={16} />
                <span>Safe and Secure Payments. Easy returns.</span>
              </div>

              <div className="delivery-notice">
                <Clock size={16} />
                <span>Delivery within 2-4 business days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage