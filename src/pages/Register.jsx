import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import userMemoryService from '../UserMemories/userMemoryService';
const Register = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('chatcart_users') || '[]');
    
    // Check if user already exists
    if (users.find(u => u.email === formData.email)) {
      setError('User with this email already exists');
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      password: formData.password,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    // Save user
    users.push(newUser);
    localStorage.setItem('chatcart_users', JSON.stringify(users));

    // Initialize user memory for the new user
    userMemoryService.setUserName(newUser.id, newUser.name);

    // Get the initialized memory to verify
    const userMemory = userMemoryService.getUserMemory(newUser.id);
    console.log('New user memory created:', userMemory);
    
    // Create session
    const session = {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin
      },
      timestamp: Date.now()
    };
    
    localStorage.setItem('chatcart_session', JSON.stringify(session));
    onRegister(session.user);
    navigate('/home');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join ChatCart today</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit" className="auth-button">
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;