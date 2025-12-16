import { useState, useEffect } from 'react';

const Orders = ({ user }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Load user's orders
    const allOrders = JSON.parse(localStorage.getItem('chatcart_orders') || '[]');
    const userOrders = allOrders.filter(order => order.userId === user.id);
    setOrders(userOrders);
  }, [user.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'delivered';
      case 'Shipped': return 'shipped';
      case 'Processing': return 'processing';
      default: return 'pending';
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track your orders and view order history</p>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <h2>No Orders Yet</h2>
          <p>You haven't placed any orders. Start shopping to see your orders here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.id}</h3>
                  <p className="order-date">Placed on {new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div className="order-meta">
                  <span className={`status-badge ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="order-total">₹{order.total}</span>
                </div>
              </div>

              <div className="order-items">
                <h4>Items ({order.items.length})</h4>
                {order.items.map(item => (
                  <div key={item.id} className="order-item">
                    <img src={item.image} alt={item.title} />
                    <div className="item-details">
                      <span className="item-title">{item.title}</span>
                      <span className="item-brand">{item.brand}</span>
                      <span className="item-quantity">Quantity: {item.quantity}</span>
                    </div>
                    <span className="item-price">₹{item.priceINR * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="delivery-info">
                  <strong>Delivery Address:</strong>
                  <p>{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.pincode}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;