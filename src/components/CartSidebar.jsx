import { X, Plus, Minus, Trash2 } from 'lucide-react'

const Cart = ({ cart, onUpdateQuantity, onRemoveFromCart, onClose, onCheckout, totalPrice }) => {
  return (
    <div className="cart-overlay">
      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.title} className="cart-item-image" />
                
                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.title}</h4>
                  <div className="cart-item-price">₹{item.priceINR}</div>
                  
                  <div className="quantity-controls">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="quantity-btn"
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
                    
                    <button 
                      onClick={() => onRemoveFromCart(item.id)}
                      className="remove-btn"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total: </span>
              <span className="total-price">₹{totalPrice}</span>
            </div>
            
            <button 
              className="checkout-btn"
              onClick={onCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart