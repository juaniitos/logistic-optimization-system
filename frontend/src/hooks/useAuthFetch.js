import { useAuth } from '../contexts/AuthContext';

export const useAuthFetch = () => {
  const { token } = useAuth();

  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error en la petición');
    }

    return response.json();
  };

  return authFetch;
};
