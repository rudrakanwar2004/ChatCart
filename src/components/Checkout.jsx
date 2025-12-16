import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'

const Checkout = ({ cart, totalPrice, onClose, onOrderSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  })
  const [orderPlaced, setOrderPlaced] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulate order processing
    setTimeout(() => {
      setOrderPlaced(true)
    }, 1000)
  }

  if (orderPlaced) {
    return (
      <div className="checkout-overlay">
        <div className="checkout-modal">
          <div className="order-success">
            <CheckCircle size={64} className="success-icon" />
            <h2>Order Placed Successfully!</h2>
            <p>Your order will be delivered via Cash on Delivery</p>
            <p className="order-total">Total: ₹{totalPrice}</p>
            <button 
              className="continue-shopping-btn"
              onClick={onOrderSuccess}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-overlay">
      <div className="checkout-modal">
        <div className="checkout-header">
          <h2>Checkout</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="checkout-content">
          <div className="order-summary">
            <h3>Order Summary</h3>
            {cart.map(item => (
              <div key={item.id} className="order-item">
                <img src={item.image} alt={item.title} />
                <div className="order-item-details">
                  <span className="item-title">{item.title}</span>
                  <span className="item-quantity">Qty: {item.quantity}</span>
                </div>
                <span className="item-total">₹{item.priceINR * item.quantity}</span>
              </div>
            ))}
            <div className="order-total">
              <strong>Total: ₹{totalPrice}</strong>
            </div>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <h3>Delivery Information</h3>
            
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>PIN Code</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="payment-method">
              <h4>Payment Method</h4>
              <div className="cod-option">
                <input type="radio" id="cod" name="payment" defaultChecked />
                <label htmlFor="cod">Cash on Delivery (COD)</label>
              </div>
            </div>

            <button type="submit" className="place-order-btn">
              Place Order
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Checkout