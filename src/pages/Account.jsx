import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Account = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Load user's orders
    const allOrders = JSON.parse(localStorage.getItem('chatcart_orders') || '[]');
    const userOrders = allOrders.filter(order => order.userId === user.id);
    setOrders(userOrders);
  }, [user.id]);

  const handleLogout = () => {
    localStorage.removeItem('chatcart_session');
    onLogout();
    navigate('/login');
  };

  return (
    <div className="account-container">
      <div className="account-header">
        <h1>My Account</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="account-content">
        <div className="profile-section">
          <h2>Profile Information</h2>
          <div className="profile-details">
            <div className="detail-item">
              <label>Name:</label>
              <span>{user.name}</span>
            </div>
            <div className="detail-item">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
            <div className="detail-item">
              <label>Role:</label>
              <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                {user.isAdmin ? 'Administrator' : 'Customer'}
              </span>
            </div>
          </div>
        </div>

        <div className="orders-section">
          <h2>Order History</h2>
          {orders.length === 0 ? (
            <div className="no-orders">
              <p>You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>Order #{order.id}</h3>
                    <span className="order-status">{order.status}</span>
                  </div>
                  <div className="order-details">
                    <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ₹{order.total}</p>
                    <p><strong>Items:</strong> {order.items.length} items</p>
                  </div>
                  <div className="order-items">
                    {order.items.map(item => (
                      <div key={item.id} className="order-item">
                        <img src={item.image} alt={item.title} />
                        <div className="item-details">
                          <span className="item-title">{item.title}</span>
                          <span className="item-quantity">Qty: {item.quantity}</span>
                        </div>
                        <span className="item-price">₹{item.priceINR}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;