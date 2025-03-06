import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Add axios interceptor for better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorDetails = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      details: error.response?.data?.details || 'No additional details',
      error: error.response?.data || error
    };
    
    console.error('API Error Details:', errorDetails);
    return Promise.reject(errorDetails);
  }
);

export const authService = {
  async register(username, password) {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        username,
        password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async login(username, password) {
    try {
      console.log('Login request:', { username, hasPassword: !!password });
      
      // Validate inputs
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      });
      
      if (response.data?.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      } else {
        throw new Error('Invalid response format - missing token');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  async verifyProof(proof, publicSignals) {
    try {
      const response = await axios.post(`${API_URL}/verify-proof`, {
        proof,
        publicSignals
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('user');
  }
};