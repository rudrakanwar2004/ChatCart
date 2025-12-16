import { useState, useEffect } from 'react';
import { Users, ShoppingBag, Trash2, Crown, AlertCircle } from 'lucide-react';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load users from localStorage and filter out admin users
    const usersData = JSON.parse(localStorage.getItem('chatcart_users') || '[]');
    const regularUsers = usersData.filter(user => !user.isAdmin);
    setUsers(regularUsers);

    // Load orders from localStorage
    const ordersData = JSON.parse(localStorage.getItem('chatcart_orders') || '[]');
    setOrders(ordersData);
  };

  const deleteUser = (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to delete user "${userEmail}"? This will also delete all their orders.`)) {
      // Delete user from users list
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      
      // Update localStorage for users
      const allUsers = JSON.parse(localStorage.getItem('chatcart_users') || '[]');
      const updatedAllUsers = allUsers.filter(user => user.id !== userId);
      localStorage.setItem('chatcart_users', JSON.stringify(updatedAllUsers));

      // Delete all orders associated with this user
      const updatedOrders = orders.filter(order => order.userId !== userId && order.userEmail !== userEmail);
      setOrders(updatedOrders);
      localStorage.setItem('chatcart_orders', JSON.stringify(updatedOrders));

      alert(`User "${userEmail}" and all their orders have been deleted successfully.`);
    }
  };

  const deleteUserAndOrders = (userId, userName, userEmail) => {
    setDeleteConfirm({ userId, userName, userEmail });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      const { userId, userEmail } = deleteConfirm;
      
      // Delete user from users list
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      
      // Update localStorage for users
      const allUsers = JSON.parse(localStorage.getItem('chatcart_users') || '[]');
      const updatedAllUsers = allUsers.filter(user => user.id !== userId);
      localStorage.setItem('chatcart_users', JSON.stringify(updatedAllUsers));

      // Delete all orders associated with this user
      const updatedOrders = orders.filter(order => order.userId !== userId && order.userEmail !== userEmail);
      setOrders(updatedOrders);
      localStorage.setItem('chatcart_orders', JSON.stringify(updatedOrders));

      setDeleteConfirm(null);
      alert(`User "${userEmail}" and all their orders have been deleted successfully.`);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const getUserOrderCount = (userId, userEmail) => {
    return orders.filter(order => 
      order.userId === userId || order.userEmail === userEmail
    ).length;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('chatcart_orders', JSON.stringify(updatedOrders));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'delivered';
      case 'Shipped': return 'shipped';
      case 'Processing': return 'processing';
      default: return 'pending';
    }
  };

  return (
    <div className="admin-container">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
            <div className="modal-header">
              <AlertCircle size={24} className="warning-icon" />
              <h3>Confirm User Deletion</h3>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to delete user <strong>"{deleteConfirm.userEmail}"</strong>?
              </p>
              <p className="warning-text">
                This action will permanently delete the user account and 
                <strong> all {getUserOrderCount(deleteConfirm.userId, deleteConfirm.userEmail)} orders</strong> 
                associated with this user. This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Delete User & All Orders
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-header">
        <div className="admin-title-section">
          <Crown size={32} className="admin-crown" />
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage users and monitor orders</p>
          </div>
        </div>
        
        <div className="admin-stats">
          <div className="stat-card">
            <Users size={24} />
            <div>
              <span className="stat-number">{users.length}</span>
              <span className="stat-label">Registered Users</span>
            </div>
          </div>
          <div className="stat-card">
            <ShoppingBag size={24} />
            <div>
              <span className="stat-number">{orders.length}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={20} />
          Users ({users.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={20} />
          Orders ({orders.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-section">
          <div className="section-header">
            <h2>Registered Users</h2>
            <span className="total-count">{users.length} regular users</span>
          </div>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Orders</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const userOrdersCount = getUserOrderCount(user.id, user.email);
                  return (
                    <tr key={user.id}>
                      <td className="user-id">{user.id.slice(0, 8)}...</td>
                      <td className="user-name">
                        <div className="user-info">
                          <span className="name">{user.name}</span>
                        </div>
                      </td>
                      <td className="user-email">{user.email}</td>
                      <td className="user-orders">
                        <span className={`order-count ${userOrdersCount > 0 ? 'has-orders' : 'no-orders'}`}>
                          {userOrdersCount} order{userOrdersCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="join-date">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="actions">
                        <button 
                          className="delete-btn"
                          onClick={() => deleteUserAndOrders(user.id, user.name, user.email)}
                          title="Delete User and All Orders"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">
                      No regular users registered yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="orders-section">
          <div className="section-header">
            <h2>All Orders</h2>
            <span className="total-count">{orders.length} orders</span>
          </div>

          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.id}</h3>
                    <p className="order-user">
                      by {order.userName} ({order.userEmail})
                    </p>
                    <p className="order-date">
                      {new Date(order.date).toLocaleDateString()} at{' '}
                      {new Date(order.date).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="order-meta">
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`status-select ${getStatusColor(order.status)}`}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
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
                  <div className="shipping-info">
                    <strong>Shipping Address:</strong>
                    <p>{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                    <p>{order.shippingAddress?.address}</p>
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                    <p>Phone: {order.shippingAddress?.phone}</p>
                  </div>
                  <div className="payment-info">
                    <strong>Payment:</strong>
                    <p>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="no-data">
                <ShoppingBag size={48} />
                <h3>No Orders Yet</h3>
                <p>Orders will appear here when customers place them.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;