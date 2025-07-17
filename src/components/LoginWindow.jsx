import React, { useState } from 'react';
import { Window, WindowHeader, WindowContent, Button, TextInput } from 'react95';
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
    }}>
      <Window style={{ minWidth: 340, maxWidth: '90vw' }}>
        <WindowHeader>
          <span>{isLogin ? 'Login' : 'Register'}</span>
        </WindowHeader>
        <WindowContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TextInput
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              placeholder="Username"
              disabled={loading}
              fullWidth
              style={{ marginBottom: 8 }}
            />
            {!isLogin && (
              <TextInput
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="Email"
                disabled={loading}
                fullWidth
                style={{ marginBottom: 8 }}
              />
            )}
            {!isLogin && (
              <TextInput
                value={formData.display_name}
                onChange={e => handleInputChange('display_name', e.target.value)}
                placeholder="Display Name (optional)"
                disabled={loading}
                fullWidth
                style={{ marginBottom: 8 }}
              />
            )}
            <TextInput
              type="password"
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              placeholder="Password"
              disabled={loading}
              fullWidth
              style={{ marginBottom: 8 }}
            />
            {!isLogin && (
              <TextInput
                type="password"
                value={formData.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm Password"
                disabled={loading}
                fullWidth
                style={{ marginBottom: 8 }}
              />
            )}
            {error && (
              <div style={{
                marginBottom: 8,
                padding: 8,
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: 4,
                color: '#721c24',
                fontSize: 13
              }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
              </Button>
              <Button type="button" onClick={toggleMode} disabled={loading} style={{ flex: 1 }}>
                {isLogin ? 'Register' : 'Login'}
              </Button>
            </div>
          </form>
        </WindowContent>
      </Window>
    </div>
  );
};

export default LoginWindow; 