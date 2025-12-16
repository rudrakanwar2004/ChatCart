import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, ShoppingBag, User, LogOut, Crown } from 'lucide-react'

const Header = ({ cartItemsCount, user, onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()

  // Navigation for regular users only
  const userNavigation = [
    { path: '/home', name: 'Home' },
    { path: '/electronics', name: 'Electronics' },
    { path: '/fashion', name: 'Fashion' }
  ]

  const handleNavLinkClick = (path) => {
    navigate(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  }

  // If user is admin, show minimal header with only admin access
  if (user?.isAdmin) {
    return (
      <header className="header admin-header">
        <div className="header-main">
          <div className="container">
            <div className="header-main-content">
              <div className="logo-section">
                <span className="logo">ChatCart Admin</span>
              </div>

              {/* Admin Navigation - Only Admin Panel */}
              <nav className="header-navigation">
                <button
                  onClick={() => handleNavLinkClick('/admin')}
                  className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                >
                  <Crown size={18} />
                  <span>Admin Panel</span>
                </button>
              </nav>

              <div className="header-actions">
                <div className="admin-badge">
                  <User size={20} />
                  <span>{user.name} (Admin)</span>
                </div>
                <button onClick={handleLogout} className="header-btn logout-btn">
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Regular user header or logged out user
  return (
    <header className="header">
      <div className="header-main">
        <div className="container">
          <div className="header-main-content">
            <div className="logo-section">
              <Link to={user ? "/home" : "/"} className="logo">ChatCart</Link>
            </div>

            {/* Navigation Links - Only show when user is logged in as regular user */}
            {user && !user.isAdmin && (
              <nav className="header-navigation">
                {userNavigation.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavLinkClick(item.path)}
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    {item.name}
                  </button>
                ))}
              </nav>
            )}

            <div className="header-actions">
              {user ? (
                // Logged in as regular user
                <>
                  <Link to="/account" className="header-btn">
                    <User size={20} />
                    <span>{user.name}</span>
                  </Link>
                  <Link to="/orders" className="header-btn">
                    <ShoppingBag size={20} />
                    <span>Orders</span>
                  </Link>
                  <button onClick={handleLogout} className="header-btn logout-btn">
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                  <Link to="/cart" className="cart-button">
                    <ShoppingCart size={24} />
                    <span>Cart</span>
                    {cartItemsCount > 0 && (
                      <span className="cart-badge">{cartItemsCount}</span>
                    )}
                  </Link>
                </>
              ) : (
                // Not logged in
                <>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="header-btn"
                  >
                    <User size={20} />
                    <span>Login</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header