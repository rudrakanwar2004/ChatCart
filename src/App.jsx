import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import CategorySection from './components/CategorySection'
import ChatBot from './components/ChatBot'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import Account from './pages/Account'
import Orders from './pages/Orders'
import './index.css'

// Make sure regular users can only access user pages
const ProtectedRoute = ({ children, user }) => {
  if (!user) return <Navigate to="/login" replace />
  if (user.isAdmin) return <Navigate to="/admin" replace />
  return children
}

// Keep admin-only pages secure
const AdminRoute = ({ children, user }) => {
  if (!user) return <Navigate to="/login" replace />
  if (!user.isAdmin) return <Navigate to="/home" replace />
  return children
}

// Make sure admin users don't end up on regular user pages
const UserOnlyRoute = ({ children, user }) => {
  if (!user) return <Navigate to="/login" replace />
  if (user.isAdmin) return <Navigate to="/admin" replace />
  return children
}

function App() {
  // Basic app state - products, shopping cart, loading status, and user info
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Remember if user has seen the anonymous welcome screen
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    try {
      return localStorage.getItem('chatcart_welcome_dismissed') === 'true'
    } catch (e) {
      return false
    }
  })

  // Show a per-user personalized welcome after login (true => show it)
  const [showPersonalWelcome, setShowPersonalWelcome] = useState(false)

  // Helper functions to organize user-specific data
  const getCartKey = (userId) => `chatcart_cart_${userId}`
  const getUserWelcomeKey = (userId) => `chatcart_welcome_dismissed_${userId}`

  // When app starts, check if user was previously logged in
  useEffect(() => {
    const checkSession = () => {
      try {
        const session = JSON.parse(localStorage.getItem('chatcart_session') || 'null')
        if (session && session.user) {
          setUser(session.user)

          // Load this user's personal shopping cart
          const userCartKey = getCartKey(session.user.id)
          const savedCart = localStorage.getItem(userCartKey)
          if (savedCart) {
            try {
              setCart(JSON.parse(savedCart))
            } catch (e) {
              console.warn('Had trouble loading your saved cart:', e)
              setCart([])
            }
          }
        }
      } catch (error) {
        console.warn('Error checking login session:', error)
      }
    }

    checkSession()
  }, [])

  // Set up admin account when app first runs
  useEffect(() => {
    const initializeAdminUser = () => {
      try {
        const users = JSON.parse(localStorage.getItem('chatcart_users') || '[]')

        const adminExists = users.find(u => u.email === 'siespracticals@gmail.com')

        if (!adminExists) {
          const adminUser = {
            id: 'admin-001',
            name: 'ChatCart Admin',
            email: 'siespracticals@gmail.com',
            password: '123456',
            isAdmin: true,
            createdAt: new Date().toISOString()
          }

          users.push(adminUser)
          localStorage.setItem('chatcart_users', JSON.stringify(users))
          console.log('Admin account ready: siespracticals@gmail.com / 123456')
        }
      } catch (error) {
        console.warn('Error setting up admin account:', error)
      }
    }

    initializeAdminUser()
  }, [])

  // Load products from our server
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)

        // Get products from our main server
        const response = await fetch('http://localhost:4000/api/products')

        if (!response.ok) {
          throw new Error('Server is taking a break')
        }

        const productsData = await response.json()
        setProducts(productsData)
        setLoading(false)
      } catch (error) {
        console.error('Oops, trouble loading products:', error)

        // If server is down, show some basic products so users can still browse
        const fallbackProducts = [
          {
            id: 1,
            title: "Wireless Bluetooth Headphones",
            priceINR: 1999,
            originalPrice: 3999,
            discount: 50,
            category: "electronics",
            rating: { rate: 4.5, count: 120 },
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
            brand: "AudioTech"
          },
          {
            id: 2,
            title: "Men's Casual T-Shirt",
            priceINR: 899,
            originalPrice: 1499,
            discount: 40,
            category: "fashion",
            rating: { rate: 4.4, count: 234 },
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
            brand: "Urban Classic"
          },
          {
            id: 3,
            title: "Smart Fitness Watch",
            priceINR: 4599,
            originalPrice: 6999,
            discount: 34,
            category: "electronics",
            rating: { rate: 4.3, count: 89 },
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
            brand: "FitTech"
          },
          {
            id: 4,
            title: "Women's Summer Dress",
            priceINR: 1599,
            originalPrice: 2599,
            discount: 38,
            category: "fashion",
            rating: { rate: 4.6, count: 189 },
            image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300",
            brand: "Summer Bliss"
          }
        ]

        setProducts(fallbackProducts)
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Remember each user's shopping cart separately
  useEffect(() => {
    if (user && !user.isAdmin) {
      const userCartKey = getCartKey(user.id)
      localStorage.setItem(userCartKey, JSON.stringify(cart))
    }
  }, [cart, user])

  // Add items to shopping cart with quantity support
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [...prevCart, { ...product, quantity }]
      }
    })
  }

  // Remove items from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  // Change quantity of items in cart
  const updateQuantity = (productId, quantity) => {
    if (quantity === 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  // Empty the entire cart
  const clearCart = () => {
    setCart([])
  }

  // Count how many items are in the cart
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Calculate total price of everything in cart
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.priceINR * item.quantity), 0)
  }

  // Calculate how much user saved from discounts
  const getTotalDiscount = () => {
    return cart.reduce((total, item) => {
      const itemDiscount = (item.originalPrice - item.priceINR) * item.quantity
      return total + itemDiscount
    }, 0)
  }

  // Original price before discounts
  const getTotalAmount = () => {
    return getTotalPrice() + getTotalDiscount()
  }

  // Final amount to pay
  const getFinalAmount = () => {
    return getTotalPrice()
  }

  // Clear cart after successful order
  const handleOrderSuccess = () => {
    setCart([])
  }

  // Mark welcome screen as seen (anonymous welcome) and navigate to login
  const handleWelcomeComplete = () => {
    setWelcomeDismissed(true)
    try {
      localStorage.setItem('chatcart_welcome_dismissed', 'true')
    } catch (error) {
      console.warn('Could not remember welcome screen dismissal:', error)
    }
    navigate('/login')
  }

  // Handle user login and load their personal data
  const handleLogin = (userData) => {
    setUser(userData)

    // Persist session so reload keeps the user logged in
    try {
      localStorage.setItem('chatcart_session', JSON.stringify({ user: userData }))
    } catch (e) {
      console.warn('Could not persist session:', e)
    }

    // Load this user's personal shopping cart
    const userCartKey = getCartKey(userData.id)
    const savedCart = localStorage.getItem(userCartKey)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.warn('Had trouble loading your saved cart:', e)
        setCart([])
      }
    } else {
      setCart([]) // New session starts with empty cart
    }

    // If admin -> immediately navigate to admin panel
    if (userData.isAdmin) {
      navigate('/admin')
      return
    }

    // For regular users show a per-user personalized welcome once
    try {
      const userWelcomeKey = getUserWelcomeKey(userData.id)
      const hasSeenPersonalWelcome = localStorage.getItem(userWelcomeKey) === 'true'
      if (!hasSeenPersonalWelcome) {
        setShowPersonalWelcome(true)
        return
      }
    } catch (e) {
      console.warn('Could not read user welcome flag:', e)
    }

    // Otherwise go to home
    navigate('/home')
  }

  // Handle new user registration
  const handleRegister = (userData) => {
    setUser(userData)

    // Persist session
    try {
      localStorage.setItem('chatcart_session', JSON.stringify({ user: userData }))
    } catch (e) {
      console.warn('Could not persist session:', e)
    }

    // New users start with fresh cart and show personal welcome
    setCart([])

    if (userData.isAdmin) {
      navigate('/admin')
      return
    }

    // Show personalized welcome for newly registered user
    setShowPersonalWelcome(true)
  }

  // Handle user logout
  const handleLogout = () => {
    setUser(null)
    setCart([]) // Clear current cart from memory
    localStorage.removeItem('chatcart_session')

    // Note: We keep user's cart saved in localStorage so they can continue shopping later
    navigate('/login')
  }

  // Personal welcome completion handler (after user logs in/registers)
  const handlePersonalWelcomeComplete = () => {
    try {
      if (user && user.id) {
        localStorage.setItem(getUserWelcomeKey(user.id), 'true')
      }
    } catch (e) {
      console.warn('Could not persist personal welcome flag:', e)
    }
    setShowPersonalWelcome(false)
    navigate('/home')
  }

  // Organize products by category for easy display
  const electronicsProducts = useMemo(() =>
    products.filter(p => p.category === 'electronics'), [products]
  )

  const fashionProducts = useMemo(() =>
    products.filter(p => p.category === 'fashion'), [products]
  )

  // Pick top-rated products to feature on homepage
  const featuredProducts = useMemo(() => {
    // Sort by customer ratings and pick the top 5
    return [...products]
      .sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0))
      .slice(0, 5)
  }, [products])

  // If a personalized welcome should be shown (post-login), show it immediately
  if (showPersonalWelcome && user && !user.isAdmin) {
    return (
      <Welcome
        onComplete={handlePersonalWelcomeComplete}
        user={user}
      />
    )
  }

  // Show loading screen while products are loading (don't show for root/login/register)
  if (loading && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register') {
    return (
      <div className="app">
        <Header cartItemsCount={getTotalItems()} user={user} onLogout={handleLogout} />
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner" />
            <p>Loading amazing products for you...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show anonymous welcome screen for first-time visitors (before login)
  if (!welcomeDismissed && location.pathname === '/') {
    return <Welcome onComplete={handleWelcomeComplete} />
  }

  return (
    <div className="app">
      {/* Don't show header on welcome or login pages */}
      {!['/', '/login', '/register'].includes(location.pathname) && (
        <Header cartItemsCount={getTotalItems()} user={user} onLogout={handleLogout} />
      )}

      <main className="main-content">
        <Routes>
          {/* Public pages anyone can access */}
          <Route
            path="/"
            element={<Welcome onComplete={handleWelcomeComplete} />}
          />


          <Route
            path="/login"
            element={
              user ? <Navigate to={user.isAdmin ? "/admin" : "/home"} replace /> : <Login onLogin={handleLogin} />
            }
          />

          <Route
            path="/register"
            element={
              user ? <Navigate to={user.isAdmin ? "/admin" : "/home"} replace /> : <Register onRegister={handleRegister} />
            }
          />

          {/* Admin-only section */}
          <Route
            path="/admin"
            element={
              <AdminRoute user={user}>
                <Admin user={user} />
              </AdminRoute>
            }
          />

          {/* Regular user shopping pages */}
          <Route
            path="/home"
            element={
              <UserOnlyRoute user={user}>
                <HomePage
                  products={products}
                  onAddToCart={addToCart}
                  featuredProducts={featuredProducts}
                  loading={loading}
                />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/electronics"
            element={
              <UserOnlyRoute user={user}>
                <CategorySection
                  title="Electronics & Gadgets"
                  subtitle="Latest smartphones, laptops, accessories and more"
                  products={electronicsProducts}
                  onAddToCart={addToCart}
                />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/fashion"
            element={
              <UserOnlyRoute user={user}>
                <CategorySection
                  title="Fashion & Clothing"
                  subtitle="Trending clothes, jewelry, accessories and more"
                  products={fashionProducts}
                  onAddToCart={addToCart}
                />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <UserOnlyRoute user={user}>
                <CartPage
                  cart={cart}
                  onUpdateQuantity={updateQuantity}
                  onRemoveFromCart={removeFromCart}
                  onClearCart={clearCart}
                  totalPrice={getTotalPrice()}
                  totalDiscount={getTotalDiscount()}
                  totalAmount={getFinalAmount()}
                  totalItems={getTotalItems()}
                />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <UserOnlyRoute user={user}>
                <CheckoutPage
                  cart={cart}
                  totalPrice={getTotalAmount()}
                  totalDiscount={getTotalDiscount()}
                  totalAmount={getFinalAmount()}
                  onOrderSuccess={handleOrderSuccess}
                  user={user}
                />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/account"
            element={
              <UserOnlyRoute user={user}>
                <Account user={user} onLogout={handleLogout} />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <UserOnlyRoute user={user}>
                <Orders user={user} />
              </UserOnlyRoute>
            }
          />

          {/* If user tries to visit unknown page, send them somewhere sensible */}
          <Route path="*" element={<Navigate to={user ? (user.isAdmin ? "/admin" : "/home") : "/login"} replace />} />
        </Routes>
      </main>

      {/* Show shopping assistant for regular users, but not on login pages or for admin */}
      {user && !user.isAdmin && !['/', '/login', '/register'].includes(location.pathname) && (
        <ChatBot
          products={products}
          user={user}
          onAddToCart={addToCart}
          cart={cart}
        />
      )}
    </div>
  )
}

export default App
