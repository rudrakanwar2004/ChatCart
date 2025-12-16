import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Truck, Clock, CheckCircle, MapPin, CreditCard } from 'lucide-react'

const CheckoutPage = ({ cart, totalPrice, totalDiscount, totalAmount, onOrderSuccess, user }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    // Shipping Details
    firstName: '',
    lastName: '',
    email: user?.email || '', // Pre-fill with user email if available
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Payment Method
    paymentMethod: 'cod',
    
    // Order Review
    termsAccepted: false
  })

  const steps = [
    { number: 1, title: 'Shipping Details', icon: <MapPin size={20} /> },
    { number: 2, title: 'Payment Method', icon: <CreditCard size={20} /> },
    { number: 3, title: 'Review Order', icon: <CheckCircle size={20} /> }
  ]

  // Function to save order to localStorage
  const saveOrderToStorage = () => {
    const orderId = `ORD${Date.now()}`;
    setOrderNumber(orderId);
    
    const orderData = {
      id: orderId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      items: cart.map(item => ({
        id: item.id,
        title: item.title,
        priceINR: item.priceINR,
        quantity: item.quantity,
        image: item.image,
        brand: item.brand,
        category: item.category
      })),
      total: totalAmount,
      discount: totalDiscount,
      subtotal: totalPrice + totalDiscount,
      date: new Date().toISOString(),
      status: 'Processing',
      shippingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      },
      paymentMethod: formData.paymentMethod,
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days from now
    };

    // Get existing orders from localStorage
    const existingOrders = JSON.parse(localStorage.getItem('chatcart_orders') || '[]');
    
    // Add new order
    existingOrders.push(orderData);
    
    // Save back to localStorage
    localStorage.setItem('chatcart_orders', JSON.stringify(existingOrders));
    
    return orderId;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmitOrder = (e) => {
    e.preventDefault()
    
    // Validate form data
    if (!formData.termsAccepted) {
      alert('Please accept the Terms & Conditions to place your order.');
      return;
    }

    // Save order to localStorage first
    const orderId = saveOrderToStorage();
    
    // Simulate order processing
    setTimeout(() => {
      setOrderPlaced(true)
      if (onOrderSuccess) {
        onOrderSuccess()
      }
    }, 2000)
  }

  if (orderPlaced) {
    return (
      <div className="checkout-page order-success">
        <div className="container">
          <div className="success-content">
            <div className="success-icon">
              <CheckCircle size={80} />
            </div>
            <h1>Order Placed Successfully!</h1>
            <p className="success-message">
              Thank you for your purchase. Your order has been confirmed and will be shipped soon.
            </p>
            <div className="order-details">
              <div className="detail-item">
                <span>Order Number:</span>
                <strong>{orderNumber}</strong>
              </div>
              <div className="detail-item">
                <span>Order Total:</span>
                <strong>₹{totalAmount}</strong>
              </div>
              <div className="detail-item">
                <span>Payment Method:</span>
                <strong>Cash on Delivery</strong>
              </div>
              <div className="detail-item">
                <span>Estimated Delivery:</span>
                <strong>2-4 business days</strong>
              </div>
            </div>
            <div className="success-actions">
              <Link to="/home" className="continue-shopping-btn">
                Continue Shopping
              </Link>
              <Link to="/orders" className="track-order-btn">
                Track Your Order
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Header */}
        <div className="checkout-header">
          <Link to="/cart" className="back-link">
            <ArrowLeft size={20} />
            Back to Cart
          </Link>
          <h1>Checkout</h1>
        </div>

        <div className="checkout-layout">
          {/* Main Checkout Form */}
          <div className="checkout-form-section">
            {/* Progress Steps */}
            <div className="progress-steps">
              {steps.map(step => (
                <div
                  key={step.number}
                  className={`step ${currentStep >= step.number ? 'active' : ''} ${currentStep === step.number ? 'current' : ''}`}
                >
                  <div className="step-icon">{step.icon}</div>
                  <span className="step-title">{step.title}</span>
                  <div className="step-connector"></div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmitOrder} className="checkout-form">
              {/* Step 1: Shipping Details */}
              {currentStep === 1 && (
                <div className="form-step">
                  <h2>Shipping Details</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Address *</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        placeholder="Enter your complete address"
                      />
                    </div>
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your city"
                      />
                    </div>
                    <div className="form-group">
                      <label>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your state"
                      />
                    </div>
                    <div className="form-group">
                      <label>PIN Code *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter PIN code"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {currentStep === 2 && (
                <div className="form-step">
                  <h2>Payment Method</h2>
                  <div className="payment-options">
                    <label className="payment-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleInputChange}
                      />
                      <div className="payment-content">
                        <div className="payment-icon">💵</div>
                        <div className="payment-details">
                          <h4>Cash on Delivery</h4>
                          <p>Pay when you receive your order</p>
                        </div>
                      </div>
                    </label>

                    <label className="payment-option disabled">
                      <input type="radio" disabled />
                      <div className="payment-content">
                        <div className="payment-icon">💳</div>
                        <div className="payment-details">
                          <h4>Credit/Debit Card</h4>
                          <p>Pay securely with your card</p>
                          <span className="coming-soon">Coming Soon</span>
                        </div>
                      </div>
                    </label>

                    <label className="payment-option disabled">
                      <input type="radio" disabled />
                      <div className="payment-content">
                        <div className="payment-icon">📱</div>
                        <div className="payment-details">
                          <h4>UPI Payment</h4>
                          <p>Fast and secure UPI payments</p>
                          <span className="coming-soon">Coming Soon</span>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="security-notice">
                    <Shield size={20} />
                    <div>
                      <strong>Your payment is secure</strong>
                      <p>We use advanced encryption to protect your information</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review Order */}
              {currentStep === 3 && (
                <div className="form-step">
                  <h2>Review Your Order</h2>
                  
                  <div className="order-review">
                    <div className="shipping-review">
                      <h4>Shipping Address</h4>
                      <p><strong>{formData.firstName} {formData.lastName}</strong></p>
                      <p>{formData.address}</p>
                      <p>{formData.city}, {formData.state} - {formData.pincode}</p>
                      <p>📞 {formData.phone}</p>
                      <p>📧 {formData.email}</p>
                      <button 
                        type="button" 
                        className="edit-btn"
                        onClick={() => setCurrentStep(1)}
                      >
                        Edit Address
                      </button>
                    </div>

                    <div className="payment-review">
                      <h4>Payment Method</h4>
                      <p><strong>Cash on Delivery</strong></p>
                      <button 
                        type="button" 
                        className="edit-btn"
                        onClick={() => setCurrentStep(2)}
                      >
                        Change Payment
                      </button>
                    </div>

                    <div className="terms-agreement">
                      <label className="terms-checkbox">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          required
                        />
                        <span>I agree to the Terms & Conditions and Privacy Policy</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="form-navigation">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="nav-btn secondary"
                    onClick={handlePreviousStep}
                  >
                    Previous
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    className="nav-btn primary"
                    onClick={handleNextStep}
                  >
                    Continue to {steps[currentStep].title}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="place-order-btn"
                    disabled={!formData.termsAccepted}
                  >
                    Place Order - ₹{totalAmount}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-summary-sidebar">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="order-items">
                {cart.map(item => (
                  <div key={item.id} className="order-item">
                    <img src={item.image} alt={item.title} />
                    <div className="item-details">
                      <h4>{item.title}</h4>
                      <div className="item-meta">
                        <span>Qty: {item.quantity}</span>
                        <span>₹{item.priceINR} each</span>
                      </div>
                    </div>
                    <div className="item-total">
                      ₹{item.priceINR * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>Subtotal ({cart.length} items)</span>
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

              <div className="delivery-info">
                <Truck size={18} />
                <span>Free delivery on orders above ₹499</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage