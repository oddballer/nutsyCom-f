import React, { useState } from 'react';
import { Window, WindowHeader, WindowContent, Button, TextInput, Fieldset } from 'react95';
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
      background: '#008080',
      overflow: 'hidden'
    }}>
      <Window style={{
        width: 350,
        height: isLogin ? 280 : 420,
        maxWidth: '90%',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        <WindowHeader style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <span>{isLogin ? 'Login' : 'Register'}</span>
          <Button onClick={onClose} size="sm" style={{ marginLeft: 'auto' }}>
            ✕
          </Button>
        </WindowHeader>
        <WindowContent style={{
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: `calc(100% - 40px)`
        }}>
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}>
            <Fieldset label={isLogin ? 'Login Information' : 'Account Information'} style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                marginBottom: 12,
                minHeight: 0,
                overflow: 'hidden'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: 2,
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  Username:
                </label>
                <TextInput
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter username"
                  fullWidth
                  disabled={loading}
                  style={{ minWidth: 0 }}
                />
              </div>

              {!isLogin && (
                <div style={{
                  marginBottom: 12,
                  minHeight: 0,
                  overflow: 'hidden'
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 2,
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Email:
                  </label>
                  <TextInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email"
                    fullWidth
                    disabled={loading}
                    style={{ minWidth: 0 }}
                  />
                </div>
              )}

              {!isLogin && (
                <div style={{
                  marginBottom: 12,
                  minHeight: 0,
                  overflow: 'hidden'
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 2,
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Display Name (optional):
                  </label>
                  <TextInput
                    value={formData.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    placeholder="Enter display name"
                    fullWidth
                    disabled={loading}
                    style={{ minWidth: 0 }}
                  />
                </div>
              )}

              <div style={{
                marginBottom: 12,
                minHeight: 0,
                overflow: 'hidden'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: 2,
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  Password:
                </label>
                <TextInput
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password"
                  fullWidth
                  disabled={loading}
                  style={{ minWidth: 0 }}
                />
              </div>

              {!isLogin && (
                <div style={{
                  marginBottom: 12,
                  minHeight: 0,
                  overflow: 'hidden'
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 2,
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Confirm Password:
                  </label>
                  <TextInput
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm password"
                    fullWidth
                    disabled={loading}
                    style={{ minWidth: 0 }}
                  />
                </div>
              )}
            </Fieldset>

            {error && (
              <div style={{
                marginBottom: 12,
                padding: 8,
                backgroundColor: '#ffebee',
                border: '1px solid #f44336',
                color: '#d32f2f',
                fontSize: '12px',
                flexShrink: 0
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'space-between',
              flexShrink: 0,
              marginTop: 'auto'
            }}>
              <Button
                type="submit"
                primary
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
              </Button>
              <Button
                onClick={toggleMode}
                disabled={loading}
                style={{ minWidth: 80, flexShrink: 0 }}
              >
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