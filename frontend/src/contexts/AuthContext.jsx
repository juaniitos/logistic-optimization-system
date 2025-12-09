import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al inicio si hay token
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await fetch('http://localhost:8000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(storedToken);
          } else {
            // Token inválido o expirado
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en el login');
      }

      const data = await response.json();
      const newToken = data.access_token;

      // Guardar token
      localStorage.setItem('token', newToken);
      setToken(newToken);

      // Obtener datos del usuario
      const userResponse = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${newToken}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
        message.success('¡Bienvenido!');
      }
    } catch (error) {
      message.error(error.message || 'Error al iniciar sesión');
      throw error;
    }
  };

  const register = async (username, email, password, fullName) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en el registro');
      }

      message.success('Registro exitoso. Por favor inicia sesión.');
      
      // Auto-login después del registro
      await login(username, password);
    } catch (error) {
      message.error(error.message || 'Error al registrarse');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    message.info('Sesión cerrada');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
