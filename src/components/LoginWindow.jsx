import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginWindow = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    display_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        if (!formData.username || !formData.password) {
          throw new Error('Username and password are required');
        }

        const result = await login(formData.username, formData.password);
        if (result.success) {
          onClose();
        } else {
          setError(result.error);
        }
      } else {
        // Register
        if (!formData.username || !formData.password || !formData.email) {
          throw new Error('Username, email, and password are required');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const result = await register(
          formData.username,
          formData.email,
          formData.password,
          formData.display_name || formData.username
        );

        if (result.success) {
          onClose();
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      display_name: ''
    });
    setError('');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      background: 'teal',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '40px',
        borderRadius: 8,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '350px',
        maxWidth: '90%'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{
            margin: '0 0 10px 0',
            color: '#333333',
            fontSize: '24px'
          }}>
            {isLogin ? 'Login' : 'Register'}
          </h2>
          <p style={{
            margin: '0',
            color: '#666666',
            fontSize: '14px'
          }}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333333',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cccccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: loading ? '#f5f5f5' : '#ffffff'
              }}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333333',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cccccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: loading ? '#f5f5f5' : '#ffffff'
                }}
              />
            </div>
          )}

          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333333',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Display Name (optional)
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Enter display name"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cccccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: loading ? '#f5f5f5' : '#ffffff'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333333',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cccccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: loading ? '#f5f5f5' : '#ffffff'
              }}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333333',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm password"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cccccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: loading ? '#f5f5f5' : '#ffffff'
                }}
              />
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              color: '#721c24',
              fontSize: 14
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#666666',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>
            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              style={{
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                color: '#666666',
                border: '1px solid #cccccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginWindow; 